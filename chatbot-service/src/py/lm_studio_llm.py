# File: lm_studio_llm.py (Đã sửa)

import asyncio
from typing import Optional, List, Dict, Any, Mapping
from langchain_core.language_models.llms import BaseLLM as LLM
# 🚨 LangChain sử dụng LLMResult cho đầu ra của _generate/_agenerate
from langchain_core.outputs import LLMResult, Generation
from langchain_core.callbacks import AsyncCallbackManagerForLLMRun, CallbackManagerForLLMRun
from pydantic import Field

# Cần cài đặt thư viện 'openai'
try:
    from openai import AsyncOpenAI
    # Thay thế CompletionCreateParams bằng type/dict phù hợp nếu cần, 
    # nhưng đây là một type an toàn cho Python
    from openai.types.completion_create_params import CompletionCreateParams
except ImportError:
    raise ImportError(
        "Lỗi: Cần cài đặt thư viện 'openai' để sử dụng LM Studio API. Dùng: pip install openai"
    )

class LMStudioLLM(LLM):
    """
    Wrapper cho LM Studio API (OpenAI-compatible endpoint).
    Sử dụng AsyncOpenAI để giao tiếp bất đồng bộ với server LM Studio cục bộ.
    """
    
    # Tham số kết nối API
    base_url: str = Field(default="http://127.0.0.1:1234/v1") 
    model_name: str = Field(default="llama3-med42-8b")
    temperature: float = Field(default=0.1)
    max_tokens: int = Field(default=1024)
    
    # Khởi tạo client bất đồng bộ
    client: AsyncOpenAI = Field(default=None, exclude=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        print(f"🚀 Initializing LM Studio client at: {self.base_url}")
        
        # Khởi tạo client AsyncOpenAI
        self.client = AsyncOpenAI(
            base_url=self.base_url,
            api_key="lm-studio-placeholder", # Chỉ là placeholder
        )
        print(f"✅ LM Studio LLM client loaded (Model: {self.model_name})")

    # ------------------ ASYNC GENERATE METHOD (REQUIRED) ------------------
    # 🚨 FIX: Đổi tên thành _agenerate và chấp nhận List[str] và trả về LLMResult
    async def _agenerate(
        self,
        prompts: List[str],
        stop: Optional[List[str]] = None,
        run_manager: Optional[AsyncCallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> LLMResult:
        """Thực hiện API call bất đồng bộ (ASYNC)."""
        
        # Chỉ lấy prompt đầu tiên vì BaseLLM chỉ gọi một prompt mỗi lần.
        prompt = prompts[0]

        # Sử dụng API /v1/completions (tương thích với endpoint của LM Studio)
        params: CompletionCreateParams = {
            "model": self.model_name,
            "prompt": prompt,
            "temperature": kwargs.get("temperature", self.temperature),
            "max_tokens": kwargs.get("max_tokens", self.max_tokens),
            "stop": stop,
            "stream": False,
        }

        try:
            response = await self.client.completions.create(**params)
            
            # Trích xuất nội dung và tạo LangChain Generation
            generations = []
            for choice in response.choices:
                generations.append(Generation(text=choice.text))
                
            # Tạo LLMResult
            llm_result = LLMResult(
                generations=[generations], 
                llm_output={"token_usage": response.usage.model_dump() if response.usage else None}
            )
            
            # Bạn có thể bỏ qua dòng print này nếu nó quá dài
            # print(f"🧾 LLM output length: {len(generations[0].text.split())} words") 
            return llm_result
            
        except Exception as e:
            raise RuntimeError(f"LM Studio API call failed at {self.base_url}. Đảm bảo LM Studio đang chạy và Ready: {e}")

    # ------------------ SYNC GENERATE METHOD (REQUIRED) ------------------
    # 🚨 FIX: Đổi tên thành _generate và chấp nhận List[str] và trả về LLMResult
    def _generate(
        self,
        prompts: List[str],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> LLMResult:
        """Đồng bộ (sync) wrapper - Gọi bản async trong môi trường đồng bộ."""
        
        # Dùng asyncio.run() để gọi phương thức async.
        # Lưu ý: Việc dùng nest_asyncio trong main.py giúp việc này hoạt động an toàn hơn trong CLI.
        # LLMResult sẽ có dạng list[list[Generation]], nên ta phải giữ cấu trúc này.
        return asyncio.run(self._agenerate(prompts, stop, run_manager, **kwargs))

    # ------------------ Helper Methods ------------------
    # Giữ nguyên ainvoke (đã được LangChain sử dụng để gọi _agenerate)
    # Phương thức _acall đã bị xóa và thay thế bằng _agenerate

    @property
    def _identifying_params(self) -> Mapping[str, Any]:
        """Trả về các tham số nhận dạng của mô hình."""
        return {
            "base_url": self.base_url,
            "model_name": self.model_name,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }
    
    @property
    def _llm_type(self) -> str:
        return "lm_studio_api"
    async def ainvoke(self, prompt: str, **kwargs) -> str:
        """
        Chuẩn hóa phương thức async invoke.
        Gọi _agenerate và trích xuất kết quả dạng chuỗi (str) để tương thích ngược 
        với cách gọi trong main.py
        """
        # 1. Gọi _agenerate (hàm cốt lõi)
        llm_result = await self._agenerate(
            prompts=[prompt], 
            stop=kwargs.get("stop", None),
            run_manager=None,
            **kwargs
        )
        
        # 2. Trích xuất text từ LLMResult
        # LLMResult.generations là List[List[Generation]]. 
        # Ta lấy kết quả từ Generation đầu tiên của prompt đầu tiên.
        if llm_result.generations and llm_result.generations[0]:
            return llm_result.generations[0][0].text
        else:
            # Trường hợp không có kết quả, trả về chuỗi rỗng
            return ""