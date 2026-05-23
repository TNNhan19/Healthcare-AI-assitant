"""
Custom Actions for RAG Medical Chatbot
This file defines custom actions that can be called from NeMo Guardrails flows.
"""

import os
import sys
from typing import Dict, Any, Optional
from langchain.schema import HumanMessage, SystemMessage

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from rag_system import RAGSystem
except ImportError as e:
    print(f"Warning: Could not import RAGSystem: {e}")
    RAGSystem = None


def retrieve_and_set_context(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Custom action to retrieve relevant context using RAG system.
    This action is called from NeMo Guardrails flows.
    """
    try:
        if not context:
            context = {}
            
        # Get the user message from context
        user_message = context.get('user_message', '')
        user_id = context.get('user_id', 'default_user')
        
        if not user_message:
            print("Warning: No user message in context for RAG retrieval")
            return context
            
        # Initialize RAG system if not already done
        if RAGSystem and not hasattr(retrieve_and_set_context, 'rag_system'):
            try:
                retrieve_and_set_context.rag_system = RAGSystem()
                print("✅ RAG System initialized for custom actions")
            except Exception as e:
                print(f"❌ Failed to initialize RAG System: {e}")
                return context
        
        # Retrieve relevant context using RAG
        if hasattr(retrieve_and_set_context, 'rag_system'):
            try:
                # Get relevant documents
                relevant_docs = retrieve_and_set_context.rag_system.retrieve_relevant_documents(
                    user_message, top_k=3
                )
                
                # Format context for LLM
                context_text = ""
                if relevant_docs:
                    context_text = "\n\n".join([
                        f"Document {i+1}:\n{doc.page_content}" 
                        for i, doc in enumerate(relevant_docs)
                    ])
                
                # Add retrieved context to the context dictionary
                context['retrieved_context'] = context_text
                context['relevant_documents'] = relevant_docs
                
                print(f"✅ Retrieved {len(relevant_docs)} relevant documents")
                
            except Exception as e:
                print(f"❌ Error during RAG retrieval: {e}")
                context['retrieved_context'] = ""
                context['relevant_documents'] = []
        else:
            context['retrieved_context'] = ""
            context['relevant_documents'] = []
            
        return context
        
    except Exception as e:
        print(f"❌ Error in retrieve_and_set_context: {e}")
        return context


def general_medical_response(context: Dict[str, Any]) -> str:
    """
    General medical response without RAG - for medical conditions and advice.
    """
    try:
        if not context:
            return "Xin lỗi, tôi không thể xử lý yêu cầu này. Vui lòng thử lại."
            
        user_message = context.get('user_message', '')
        if not user_message:
            return "Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể hỏi lại không?"
        
        # Create system prompt for general medical knowledge
        system_prompt = f"""Bạn là trợ lý y tế chuyên nghiệp của HealthCare. Trả lời câu hỏi y tế dựa trên kiến thức y khoa chung.

HƯỚNG DẪN:
- Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
- Cung cấp thông tin y tế chính xác dựa trên kiến thức y khoa
- Luôn khuyên tham khảo ý kiến bác sĩ cho vấn đề nghiêm trọng
- Đưa ra lời khuyên an toàn và phù hợp
- Thừa nhận khi không chắc chắn và khuyên gặp chuyên gia
- Không đưa ra chẩn đoán cụ thể hoặc hướng dẫn điều trị

CÂU HỎI CỦA NGƯỜI DÙNG: {user_message}"""

        return system_prompt
        
    except Exception as e:
        print(f"❌ Error in general_medical_response: {e}")
        return f"Xin lỗi, đã xảy ra lỗi trong quá trình xử lý: {str(e)}"

def rag_enhanced_response(context: Dict[str, Any]) -> str:
    """
    RAG-enhanced response generation with document retrieval.
    This action integrates RAG system with NeMo Guardrails.
    """
    try:
        if not context:
            return "Xin lỗi, tôi không thể xử lý yêu cầu này. Vui lòng thử lại."
            
        # Get context information
        user_message = context.get('user_message', '')
        user_id = context.get('user_id', 'default_user')
        
        if not user_message:
            return "Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể hỏi lại không?"
        
        # Initialize RAG system if not already done
        if not hasattr(rag_enhanced_response, 'rag_system'):
            try:
                rag_enhanced_response.rag_system = RAGSystem()
                print("✅ RAG System initialized for NeMo Guardrails")
            except Exception as e:
                print(f"❌ Failed to initialize RAG System: {e}")
                return _fallback_llm_response(user_message)
        
        # Retrieve relevant documents using RAG
        try:
            # Use RAG system to retrieve relevant context
            rag_input = {
                "question": user_message,
                "intent": "general"
            }
            
            # Get relevant context from RAG system
            retrieved_context = rag_enhanced_response.rag_system.retrieve_and_build_context(rag_input)
            
            print(f"✅ RAG retrieved context: {retrieved_context[:200]}...")
            
        except Exception as e:
            print(f"❌ RAG retrieval failed: {e}")
            retrieved_context = ""
        
        # Create enhanced system prompt with RAG context
        if retrieved_context and retrieved_context.strip():
            system_prompt = f"""Bạn là trợ lý y tế thông minh của HealthCare. Sử dụng thông tin từ cơ sở dữ liệu y tế để trả lời câu hỏi của người dùng.

THÔNG TIN THAM KHẢO TỪ CƠ SỞ DỮ LIỆU:
{retrieved_context}

HƯỚNG DẪN TRẢ LỜI:
- Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
- Ưu tiên sử dụng thông tin từ cơ sở dữ liệu y tế ở trên
- Nếu thông tin từ cơ sở dữ liệu không đủ, bổ sung kiến thức y tế chung
- Luôn khuyên tham khảo ý kiến bác sĩ cho vấn đề nghiêm trọng
- Cung cấp link hữu ích khi phù hợp (/products, /health-news, /login)
- Thừa nhận khi không chắc chắn và hướng dẫn đến nguồn thông tin phù hợp

CÂU HỎI CỦA NGƯỜI DÙNG: {user_message}"""
        else:
            # Fallback to general response without RAG context
            system_prompt = f"""Bạn là trợ lý y tế thông minh của HealthCare. Trả lời câu hỏi của người dùng một cách chính xác và hữu ích.

HƯỚNG DẪN:
- Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
- Phân tích câu hỏi và đưa ra câu trả lời phù hợp
- Luôn khuyên người dùng tham khảo ý kiến bác sĩ cho các vấn đề y tế nghiêm trọng
- Cung cấp link hữu ích khi phù hợp (/products, /health-news, /login)
- Thừa nhận khi không có thông tin cụ thể và hướng dẫn đến nguồn thông tin phù hợp
- Chỉ trả lời các câu hỏi liên quan đến y tế, sức khỏe, thuốc men, sản phẩm y tế

CÂU HỎI CỦA NGƯỜI DÙNG: {user_message}"""

        # Return the enhanced system prompt for the LLM to process
        return system_prompt
        
    except Exception as e:
        print(f"❌ Error in rag_enhanced_response: {e}")
        return f"Xin lỗi, đã xảy ra lỗi trong quá trình xử lý: {str(e)}"

def _fallback_llm_response(user_message: str) -> str:
    """Fallback LLM response when RAG system is not available."""
    return f"""Bạn là trợ lý y tế thông minh của HealthCare. Trả lời câu hỏi của người dùng một cách chính xác và hữu ích.

HƯỚNG DẪN:
- Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
- Phân tích câu hỏi và đưa ra câu trả lời phù hợp
- Luôn khuyên người dùng tham khảo ý kiến bác sĩ cho các vấn đề y tế nghiêm trọng
- Cung cấp link hữu ích khi phù hợp (/products, /health-news, /login)

CÂU HỎI CỦA NGƯỜI DÙNG: {user_message}"""


# Register custom actions for NeMo Guardrails
custom_actions = {
    "retrieve_and_set_context": retrieve_and_set_context,
    "rag_enhanced_response": rag_enhanced_response,
    "general_medical_response": general_medical_response
}
