# File: unified_guardrails.py


from typing import Dict, Any, Optional
from sentence_transformers import SentenceTransformer

from medical_guardrails import MedicalGuardrails
try:
    from hf_api_llm import HuggingFaceAPILLM
except ImportError:
    HuggingFaceAPILLM = type("MockLLM", (object,), {})


class UnifiedGuardrails:
    # 🚨 FIX: Chấp nhận LLM instance
    def __init__(self, llm: Optional[HuggingFaceAPILLM] = None, config_path: str = ".") -> None:
        self.llm = llm
        # 🚨 FIX: Truyền LLM vào MedicalGuardrails
        self.medical = MedicalGuardrails(llm=llm) 
        # Giữ lại các thuộc tính cũ nếu cần
        self.rails = None
        self.rails_active: bool = False

    # Input validation chỉ gọi MedicalGuardrails
    def validate_input(self, user_input: str) -> Dict[str, Any]:
        result = self.medical.validate_input(user_input)
        return result

    # Output validation chỉ gọi MedicalGuardrails
    async def validate_output(self, response: Dict[str, Any], is_medical: bool = True) -> Dict[str, Any]:
        processed = await self.medical.validate_output(response, is_medical=is_medical)
        return processed

    # Intent detection chỉ gọi MedicalGuardrails
    async def detect_intent(self, query: str) -> str:
        result = await self.medical.detect_intent(query)
        return result

    # Entity extraction bridge
    def extract_entities(self, text: str) -> Dict[str, Any]:
        return self.medical.extract_entities(text)