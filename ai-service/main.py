# File: main.py

"""
RAG Medical Chatbot với LangChain + LangGraph + Llama-Med42 8B
Tích hợp MongoDB + FAISS + Guardrails tùy chỉnh
"""
import sys
import os
import asyncio
from pprint import pprint
import nest_asyncio
# 🚨 FIX: Import Any để thay thế cho RAGMedicalChatbot trong node function signature
from typing import TypedDict, Dict, Any 
from functools import partial 
from dotenv import load_dotenv

from langgraph.graph import StateGraph, END
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnableLambda 
import re
from typing import TypedDict, Any
# Import custom modules
from lm_studio_llm import LMStudioLLM 
from rag_system import RAGSystem
from unified_guardrails import UnifiedGuardrails
from pydantic import BaseModel 

# Load environment variables
load_dotenv()
nest_asyncio.apply()


# ====================================================================
# 1. ĐỊNH NGHĨA TRẠNG THÁI GRAPH (LangGraph State)
# ====================================================================

class RAGState(TypedDict):
    user_input: str
    context: str
    final_response:  Dict[str, Any]
    safety_response: str
    intent: str
    intents: list[str]
    intent_sentences: dict[str, list[str]]
    conversation_history: list[tuple[str, str]]


# ====================================================================
# 2. ĐỊNH NGHĨA CÁC NÚT GRAPH (Nodes)
# 🚨 FIX LỖI FORWARDREF: THAY THẾ RAGMedicalChatbot BẰNG Any
# ====================================================================

def input_guardrails_node(chatbot: Any, state: RAGState) -> RAGState:
    user_input = state["user_input"]
    validation = chatbot.guardrails.validate_input(user_input)

    if not validation.get("safe", False):
        # trả về final_response và intent = safety_violation
        return {
            "final_response": validation.get("reason", "Xin lỗi..."),
            "intent": "safety_violation"
        }
    return {"intent": "input_safe"}

async def detect_intent_node(chatbot: Any, state: RAGState) -> RAGState:
    user_input = state["user_input"]

    sentences = re.split(r'[.!?]\s*', user_input)
    detected_intents = []
    intent_sentences = {}

    for s in sentences:
        s = s.strip()
        if not s:
            continue
        intent = await chatbot.guardrails.detect_intent(s)
        detected_intents.append(intent)
        # ✅ Lưu nhiều câu cho cùng intent nếu trùng
        if intent not in intent_sentences:
            intent_sentences[intent] = []
        intent_sentences[intent].append(s)

    print(f"🧠 MULTI-INTENT DETECTED: {detected_intents}")

    # chọn intent chính
    if "ask_product" in detected_intents:
        main_intent = "ask_product"
    elif "medical_condition" in detected_intents:
        main_intent = "medical_condition"
    elif "ask_medication" in detected_intents:
        main_intent = "ask_medication"
    elif "faq" in detected_intents:
        main_intent = "faq"
    elif "thanks" in detected_intents:
        main_intent = "thanks"
    elif "goodbye" in detected_intents:
        main_intent = "goodbye"
    elif "greeting" in detected_intents:
        main_intent = "greeting"
    else:
        main_intent = detected_intents[-1] if detected_intents else "general"

    # 🧩 Template phản hồi nhanh
    TEMPLATES = {
        "greeting": "Xin chào 👋! Tôi là trợ lý y tế. Tôi có thể giúp gì cho bạn hôm nay?",
        "thanks": "Rất vui khi được giúp đỡ bạn 😊",
        "goodbye": "Chúc bạn một ngày tốt lành! 🌿",
    }

    # ⚡ Nếu là greeting/thanks/goodbye → trả phản hồi ngay tại đây
    if main_intent in TEMPLATES:
        print(f"💬 Quick template intent detected: {main_intent}")
        return {
            "intent": main_intent,
            "intents": [main_intent],
            "intent_sentences": intent_sentences,
            "final_response": {
                main_intent: {"text": TEMPLATES[main_intent], "links": []}
            }
        }

    # ❯ Nếu không thì để invoke_llm xử lý tiếp
    return {
        "intent": main_intent,
        "intents": detected_intents,
        "intent_sentences": intent_sentences,
    }
async def rag_retrieval_node(chatbot: Any, state: RAGState) -> RAGState:
    intent_raw = state.get("intent", "general")
    user_input = state.get("user_input", "")
    history = state.get("conversation_history", []) # Lấy lịch sử

    if intent_raw in ["ask_product", "faq"]:
        rag_intent = "product" if intent_raw == "ask_product" else "faq"
        
        # 🚨 FIX LỖI 3: Xử lý context cho câu hỏi mơ hồ (như "chi tiết hơn về sản phẩm")
        effective_query = user_input
        
        # Heuristic: Nếu câu hỏi là mơ hồ và có lịch sử
        vague_terms = ["sản phẩm", "nó", "cái đó", "món đó"]
        is_vague = any(term in user_input.lower() for term in vague_terms)
        
        if rag_intent == "product" and len(history) >= 1 and is_vague:
            last_ai_answer = history[-1][1] if history else ""
            
            # 1. CLEAN last_ai_answer (Loại bỏ HTML tags để tìm kiếm text)
            last_ai_answer_clean = last_ai_answer.replace("<br>", " ").replace("&lt;br&gt;", " ")
            
            # 2. Heuristic: Tìm tên sản phẩm/thuốc được đề cập gần nhất (Sử dụng từ khóa)
            product_name_match = re.search(r"Thực phẩm bảo vệ sức khỏe (.*?)(?: do Công Ty Cổ Phần| sản xuất|\. )", last_ai_answer_clean)
            
            if product_name_match:
                previous_product_name = product_name_match.group(1).strip()
                print(f"🔍 Found previous product name: {previous_product_name}")
                # Nâng cao truy vấn: "chi tiết hơn về sản phẩm" -> "chi tiết hơn về Thực phẩm bảo vệ sức khỏe Giải Độc Gan Cà Gai Leo Kawa"
                effective_query = f"{user_input} về Thực phẩm bảo vệ sức khỏe {previous_product_name}" 
            else:
                 print("⚠️ Could not find specific product name in last AI answer. Using raw input.")
        
        # 💡 Dùng effective_query cho RAG
        context = await chatbot.rag_system.retrieve_and_build_context({
            "question": effective_query,
            "intent": rag_intent,
        })
    elif intent_raw in ["medical_condition", "ask_medication"]:
        # Nếu là intent y tế, KHÔNG chạy RAG, thay vào đó chèn chỉ thị vào context
        context = (
            "CHỈ THỊ: Dùng tri thức nội bộ của bạn để trả lời câu hỏi y tế này. "
            "TUYỆT ĐỐI không nói rằng bạn không có thông tin (như 'tôi không tìm thấy thông tin'). "
            "LUÔN KẾT THÚC câu trả lời bằng lời từ chối trách nhiệm y tế (disclaimer)."
        )
        print(f"🧠 Soft Guardrail applied for {intent_raw}.")
    return {**state, "context": context} 

async def invoke_llm_node(chatbot: Any, state: RAGState) -> RAGState:
    user_input = state.get("user_input", "")
    intents = state.get("intents", [])
    # THAY ĐỔI: Lấy lịch sử hội thoại từ state
    history = state.get("conversation_history", [])
    
    final_text_parts = []

    # --- Template intents --- (Giữ nguyên)
    TEMPLATES = {
        "greeting": "Xin chào 👋!",
        "thanks": "Rất vui khi được giúp đỡ bạn 😊",
        "goodbye": "Chúc bạn một ngày tốt lành! 🌿",
    }
    for intent in intents:
        if intent in TEMPLATES:
            final_text_parts.append(TEMPLATES[intent])

    # --- LLM intents ---
    llm_intents = [i for i in intents if i in ["ask_product", "medical_condition", "ask_medication", "faq", "general"]]

    context = state.get("context", "").strip()
    if llm_intents:
        prompt_parts = []
        for intent in llm_intents:
            sentences = state.get("intent_sentences", {}).get(intent, [])
            if sentences:
                prompt_parts.append(f"{intent}: {' '.join(sentences)}")
        
        if prompt_parts:
            # THAY ĐỔI: Xây dựng prompt với lịch sử
            # 1. Tạo phần lịch sử cho prompt
            history_prompt = ""
            if history:
                history_prompt += "Đây là cuộc trò chuyện gần đây:\n"
                for user_q, ai_a in history:
                    # 🚨 FIX 1: Loại bỏ HTML tags <br> và &lt;br&gt; khỏi câu trả lời của Trợ lý
                    ai_a_clean = ai_a.replace("<br>", "\n").replace("&lt;br&gt;", "\n") 
                    history_prompt += f"Người dùng: {user_q}\nTrợ lý: {ai_a_clean}\n"
                history_prompt += "\n"

            # 2. Tạo prompt thống nhất mới
            unified_prompt = (
 "Bạn là **Trợ lý AI Y tế (HealthCare AI Assistant)** chính thức. "
 # 🟢 FIX 1: Loại bỏ Guardrail cứng khỏi Header. Đặt tính tổng quát
 "Bạn hỗ trợ người dùng bằng cách trả lời các câu hỏi về sản phẩm, dịch vụ, và kiến thức y tế. "
 
 "Quy tắc trả lời:\n"
 "1. Trả lời tất cả các phần của câu hỏi người dùng trong **MỘT ĐOẠN VĂN MẠCH LẠC** và thân thiện. "
"2. **TUYỆT ĐỐI KHÔNG** được lặp lại bất kỳ lời nhắc (prompt), quy tắc nào, hoặc các từ như 'Trợ lý:' hay 'Trả lời:'. "
 "3. Nếu có 'Thông tin tham khảo' hoặc 'CHỈ THỊ' trong context, **hãy tuân thủ nghiêm ngặt** (bao gồm việc sử dụng tri thức nội bộ hoặc thêm disclaimer). "
 "4. Nếu câu hỏi không liên quan đến y tế/sản phẩm, hãy trả lời ngắn gọn và lịch sự.\n\n"
 
f"{history_prompt}"
)

            current_question = "\n".join(f"{p}" for p in prompt_parts)
            unified_prompt += f"Câu hỏi cuối cùng của người dùng:\n{current_question}"

            if context:
                unified_prompt += f"\n\nThông tin tham khảo (Dữ liệu từ web HealthCare):\n{context}"
            
            unified_prompt += "\n\nBắt đầu câu trả lời (chỉ nội dung):" 
            try:
                llm_response = await chatbot.llm.ainvoke(unified_prompt)
                llm_response = llm_response.strip() if llm_response else "Xin lỗi, tôi không thể trả lời câu hỏi này."
                final_text_parts.append(llm_response)
            except Exception as e:
                final_text_parts.append(f"Lỗi khi gọi LLM: {e}")

    # --- Trích links từ context --- (Giữ nguyên)
    product_ids = re.findall(r"Sản phẩm ID: ([a-f0-9]{24})", context)
    links = [f"/product/{pid}" for pid in product_ids]

    # --- Ghép final text --- (Giữ nguyên)
    final_text = " ".join(final_text_parts).strip()
    if not final_text:
        final_text = "Xin lỗi, tôi không tìm thấy thông tin phù hợp."

    # --- Gán vào final_response --- (Giğữ nguyên)
    final_response = {"combined": {"text": final_text, "links": links}}

    # THAY ĐỔI: Cập nhật lại lịch sử với câu trả lời mới
    # Lấy text từ response để lưu vào history
    response_text_for_history = final_response["combined"]["text"]
    updated_history = history + [(user_input, response_text_for_history)]
    
    return {
        "final_response": final_response,
        "conversation_history": updated_history # Trả về lịch sử đã cập nhật
    }




async def output_guardrails_node(chatbot: Any, state: RAGState) -> RAGState:
    """Kiểm tra và xử lý output cuối cùng (ASYNC) và áp dụng định dạng hiển thị."""
    response = state["final_response"]
    is_medical = state["intent"] in ["medical_condition", "ask_medication"]
    
    # 1. Chạy Guardrails (Kiểm tra nội dung)
    try:
        # Giả định Guardrails nhận dict và trả về dict
        processed_response = await chatbot.guardrails.validate_output(response, is_medical=is_medical)
    except Exception as e:
        print(f"⚠️ Guardrails output error: {e}")
        processed_response = response 
    
    # 2. Xử lý Định dạng cho Hiển thị (HTML Escape và thay thế xuống dòng)
    if "combined" in processed_response and "text" in processed_response["combined"]:
        final_text = processed_response["combined"]["text"]
        
        # Chỉ thực hiện xử lý này nếu final_text là string
        if isinstance(final_text, str):
            formatted_text = final_text.replace("\n", "<br>")
            
            processed_response["combined"]["text"] = formatted_text
            
    # 3. Trả về state đã xử lý
    return {"final_response": processed_response}


# ====================================================================
# 3. ĐỊNH NGHĨA RAGMedicalChatbot CLASS VÀ COMPILE GRAPH
# ====================================================================

class RAGMedicalChatbot:
    """Main RAG Medical Chatbot với LangGraph + Guardrails"""
    
    def __init__(self):
        print("🚀 Initializing RAG Medical Chatbot...")
        
        self.rag_system = RAGSystem()
        self.conversation_history = [] 

        self.llm = LMStudioLLM(
            # Các tham số này sẽ được chuyển vào LMStudioLLM
            temperature=0.1, # Đặt nhiệt độ thấp hơn cho RAG
            max_tokens=1024,
            # base_url và model_name đã được đặt trong lm_studio_llm.py
        )
        
        # Giả định UnifiedGuardrails cần LLM instance
        self.guardrails = UnifiedGuardrails(llm=self.llm)
        
        print("🏗️ Compiling LangGraph Workflow...")
        builder = StateGraph(RAGState)

        # Thêm Nodes
        builder.add_node("input_guardrails", partial(input_guardrails_node, self))
        builder.add_node("detect_intent", partial(detect_intent_node, self))
        builder.add_node("rag_retrieval", partial(rag_retrieval_node, self))
        builder.add_node("invoke_llm", partial(invoke_llm_node, self))
        builder.add_node("output_guardrails", partial(output_guardrails_node, self))
        builder.add_node("safety_end", partial(lambda state: state, self))

        # Định nghĩa Start
        builder.set_entry_point("input_guardrails")

        # Định nghĩa Conditional Edge (Input Guardrails)
        def check_flow_path(state: RAGState) -> str:
            # nếu vi phạm safety → đi qua output_guardrails để xử lý output và END
            if state.get("intent") == "safety_violation":
                return "output_guardrails"   # <-- PHẢI KHỚP với mapping dưới
            # ngược lại → tiếp tục detect_intent
            return "detect_intent"
        
        builder.add_conditional_edges(
            "input_guardrails",
            check_flow_path,
            {
                "output_guardrails": "output_guardrails",  # ✅ Thêm dòng này
                "detect_intent": "detect_intent", 
            },
        )
                
        # Định nghĩa Conditional Edge (Intent Detection)
        def check_retrieval_needed(state: RAGState) -> str:
            intent = state.get("intent", "")
            if intent in ["greeting", "thanks", "goodbye"]:
                return "output_guardrails"
            if state["intent"] in ["general", "medical_condition", "ask_medication", "ask_product", "faq"]:
                return "rag_retrieval"
            return "invoke_llm" 

        builder.add_conditional_edges(
            "detect_intent",
            check_retrieval_needed,
            {
                "rag_retrieval": "rag_retrieval",
                "invoke_llm": "invoke_llm",
                "output_guardrails": "output_guardrails",
            },
        )
        
        # Edges cho luồng chính
        builder.add_edge("rag_retrieval", "invoke_llm")
        builder.add_edge("invoke_llm", "output_guardrails") 
        # Định nghĩa End
        builder.add_edge("safety_end", END)
        builder.add_edge("output_guardrails", END)

        self.app = builder.compile()
        print("✅ LangGraph Workflow compiled!")
    async def generate_response(self, user_message: str, history: list[tuple[str, str]] = None) -> dict:
        """Chạy LangGraph để tạo ra phản hồi (ASYNC)."""
        current_history = history if history is not None else []
        # Khởi tạo state dưới dạng dict theo TypedDict
        initial_state: RAGState = {
            "user_input": user_message,
            "context": "",
            "final_response": {},
            "safety_response": "",
            "intent": "",
            "intents": [],
            "intent_sentences": {},
            "conversation_history": current_history
        }

        try:
            final_state = {} 
            try:
                print("⚙️ Starting LangGraph run...")
                final_state = await self.app.ainvoke(initial_state)
                print("✅ LangGraph finished successfully!")
                print("==============================================")
                print("🧩 Final State (Pretty Print - Không bị cắt):")
                pprint(final_state, compact=True, width=120) # Thêm width để hiển thị tốt hơn
                print("==============================================")
            except Exception as e:
                import traceback
                print("❌ LangGraph crashed:")
                traceback.print_exc()
                print(f"⚠️ Exception type: {type(e)}, value: {e}")
                # Trả về format dict để nhất quán
                return {"error": f"Lỗi nội bộ: {e}", "history": current_history}
            
            # 1. Xử lý phản hồi Safety (Ưu tiên)
            safety_resp = final_state.get("safety_response")
            if safety_resp:
                # Nếu có safety_response, trả về nó (đã được LangGraph xử lý và điền vào state)
                return {"message": safety_resp, "history": final_state.get("conversation_history", current_history)}

            # 2. Xử lý phản hồi RAG/LLM thông thường
            final_res = final_state.get("final_response", "")
            updated_history = final_state.get("conversation_history", [])
            
            if isinstance(final_res, dict):
                # Trả về dict final_response đã được combine và guardrail
                return {"final_response": final_res, "history": updated_history}
            else:
                # Trường hợp fallback nếu final_res không phải dict
                return {"message": final_res, "history": updated_history}
        
        except Exception as e:
            print(f"Lỗi trong quá trình chạy LangGraph: {e}", file=sys.stderr)
            # Trả về history cũ nếu có lỗi ngoại lệ lớn hơn
            return {"error": "Xin lỗi, đã xảy ra lỗi không mong muốn...", "history": current_history}
# ====================================================================
# 4. GIAO DIỆN CLI (Phần này chỉ để test nội bộ)
# ====================================================================

async def main():
    """Main function for local testing"""
    
    print("🚀 Starting RAG Medical Chatbot...")
    

    try:
        chatbot = RAGMedicalChatbot()
        
        print("🚀 Chatbot đã sẵn sàng! Gõ 'exit' để thoát.")
        
        while True:
            user_message = input("\n👤 You: ")
            if user_message.lower() in ["exit", "quit", "thoát"]:
                print("👋 Tạm biệt!")
                break
            
            if not user_message.strip():
                continue
            
            print("🤖 Bot: ", end="", flush=True)
            response = await chatbot.generate_response(user_message)
            print(response)
    
    except Exception as e:
        print(f"❌ Error in main loop: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Đã đóng chương trình.")