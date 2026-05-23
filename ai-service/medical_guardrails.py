# File: medical_guardrails.py
"""
Medical Guardrails cho input/output validation và intent detection
"""

import re
import asyncio
from typing import Dict, Any, List, Optional
# 🚨 Bổ sung: Import LangChain Prompt
from langchain.prompts import PromptTemplate
from typing import Tuple, cast
import numpy as np
# 🚨 Bổ sung: Import LLM type hint
try:
    from lm_studio_llm import LMStudioLLM
except ImportError:
    from langchain.llms.base import LLM as LMStudioLLM 
class MedicalGuardrails:
    """Medical Guardrails System"""
    
    def __init__(self, llm: Optional[LMStudioLLM] = None):
        self.llm = llm
        # Input validation patterns - Enhanced security
        self.blocked_patterns = [
            # Prompt injection patterns
            r"ignore\s+previous\s+instructions",
            r"forget\s+everything",
            r"you\s+are\s+now",
            r"system\s+prompt",
            r"jailbreak",
            r"bypass",
            r"hack",
            r"admin",
            r"root",
            r"sudo",
            r"override",
            r"disable\s+safety",
            r"ignore\s+guidelines",
            r"act\s+as\s+if",
            r"pretend\s+to\s+be",
            r"roleplay",
            r"simulate",
            r"imagine\s+you\s+are",
            r"forget\s+your\s+role",
            r"new\s+instructions",
            r"updated\s+instructions",
            # Vietnamese prompt injection patterns
            r"bỏ\s+qua\s+(chỉ\s*dẫn|hướng\s*dẫn|quy\s*tắc)",
            r"phớt\s*lờ\s+(chỉ\s*dẫn|hướng\s*dẫn)",
            r"lờ\s*đi\s+(chỉ\s*dẫn|hướng\s*dẫn)",
            r"vượt\s+qua\s+(bảo\s*mật|giới\s+hạn|an\s*toàn)",
            r"vô\s*hiệu\s*hóa\s+an\s*toàn",
            r"đóng\s+vai",
            r"giả\s*vờ\s+là",
            r"giả\s*lập",
            r"tưởng\s+tượng\s+bạn\s+là",
            r"quên\s+vai\s+trò",
            r"prompt\s+hệ\s+thống",
            r"hệ\s+thống\s+prompt",
            r"quyền\s+quản\s+trị",
            r"chế\s+độ\s+quản\s+trị",
            r"in\s+ra\s+\"?hack\"?",
            # More Vietnamese variants
            r"bỏ\s*qua\s*luật",
            r"phớt\s*lờ\s*luật",
            r"vượt\s*qua\s*hệ\s*thống",
            r"tiết\s*lộ\s*prompt",
            r"hiển\s*thị\s*prompt",
            r"xem\s*nội\s*dung\s*hệ\s*thống",
            r"lệnh\s*ẩn",
            r"mặc\s*kệ\s*an\s*toàn"
        ]
        
        # Inappropriate content patterns
        self.inappropriate_patterns = [
            r"sex\s+with",
            r"sexual\s+relationship",
            r"how\s+to\s+have\s+sex",
            r"sexual\s+positions",
            r"porn",
            r"pornography",
            r"nude",
            r"naked",
            r"strip",
            r"masturbat",
            r"orgasm",
            r"erotic",
            r"fetish",
            r"kinky",
            r"bdsm",
            r"rape",
            r"molest",
            r"pedophil",
            r"incest",
            r"bestiality",
            r"prostitution",
            r"escort",
            r"hooker",
            # Vietnamese sexual/inappropriate
            r"quan\s*hệ\s*tình\s*dục",
            r"tư\s*thế\s*tình\s*dục",
            r"xem\s*phim\s*đen",
            r"phim\s*sex",
            r"khiêu\s*dâm",
            r"kích\s*dục",
            r"dâm\s*ôn",
            r"dâm\s*loạn",
            r"loạn\s*luân",
            r"ấu\s*dâm"
        ]
        
        # Illegal activities patterns
        self.illegal_patterns = [
            r"how\s+to\s+make\s+bomb",
            r"how\s+to\s+kill",
            r"how\s+to\s+murder",
            r"suicide\s+methods",
            r"how\s+to\s+commit\s+suicide",
            r"self\s+harm\s+methods",
            r"cut\s+myself",
            r"overdose",
            r"poison",
            r"weapon",
            r"gun",
            r"knife",
            r"violence",
            r"terrorism",
            r"bomb\s+making",
            r"drug\s+manufacturing",
            r"how\s+to\s+cook\s+meth",
            r"cocaine\s+production",
            r"hack\s+into",
            r"steal\s+money",
            r"fraud",
            r"scam",
            r"identity\s+theft",
             r"sell\s+drug", r"traffic\s+drug", r"manufacture\s+drug", r"deal\s+drug",
            # Vietnamese illegal/harmful
            r"heroin", r"cocaine", r"meth", r"methamphetamine", r"cannabis", r"MDMA", r"ecstasy",
            r"thuốc\s+lắc", r"cần\s+sa", r"ma\s+túy", r"chất\s+cấm", r"thuốc\s+phiện",
            r"cách\s+bán\s+", r"cách\s+chế\s+biến\s+", r"mua\s+bán\s+chất\s+cấm",
            r"sản\s+xuất\s+thuốc\s+phiện", r"buôn\s+bán\s+ma\s+túy",
            r"cách\s*làm\s*bom",
            r"cách\s*giết\s*người",
            r"tự\s*sát",
            r"tự\s*hại",
            r"khủng\s*bố",
            r"chế\s*tạo\s*ma\s*túy",
            r"lừa\s*đảo",
            r"gian\s*lận"
        ]
        
        # Emergency keywords
        self.emergency_keywords = [
            "emergency", "urgent", "severe pain", "chest pain", "heart attack",
            "stroke", "difficulty breathing", "unconscious", "bleeding heavily",
            "overdose", "suicide", "self harm", "crisis",
            # Vietnamese
            "khẩn cấp", "cấp cứu", "đau ngực", "khó thở", "bất tỉnh",
            "chảy máu nhiều", "ngộ độc", "tự tử", "tự hại"
        ]
        
        # Intent detection keywords
        self.price_keywords = [
            "bao nhiêu", "bao nhiêu tiền", "giá", "giá bán", "giá cả", "đơn giá",
            "₫", "vnđ", "vnd", "đ", "đắt", "rẻ", "cost", "price", "expensive", "cheap",
            "tiền", "chi phí", "khuyến mãi", "giảm giá", "sale", "ưu đãi", "bảng giá"
        ]
        
        self.product_keywords = [
            "sản phẩm", "thuốc", "thuốc nào", "loại nào", "nhãn hiệu", "brand", "model",
            "medicine", "product", "công dụng", "tác dụng", "benefit", "effect",
            "thành phần", "ingredient", "hàm lượng", "dosage", "liều", "liều lượng",
            "cách dùng", "hướng dẫn sử dụng", "how to use",
            "chống chỉ định", "tác dụng phụ", "bảo quản", "hạn dùng", "hạn sử dụng",
            "mua", "mua ở đâu", "đặt mua", "bán", "cửa hàng", "nhà thuốc",
            "SKU", "mã sản phẩm"
        ]

        # Website/FAQ intent keywords (expanded, includes short forms)
        self.faq_keywords = [
            # Vietnamese website/navigation/policy/help
            "trang web", "website", "đường dẫn", "điều khoản", "quyền riêng tư", "chính sách",
            "hỗ trợ", "liên hệ", "đăng nhập", "đăng ký", "đăng xuất", "tài khoản", "giỏ hàng", "thanh toán",
            "tin tức", "trợ năng", "xử lý sự cố", "quên mật khẩu", "đặt lại mật khẩu", "khôi phục mật khẩu",
            "/login", "/register", "/account", "/cart", "/checkout", "/privacy", "/terms", "/contact",
            # English
            "privacy", "terms", "policy", "contact", "login", "register", "logout", "forgot password",
            "reset password", "account", "cart", "checkout", "routes", "navigation", "faq",
            # Brand/Persona
            "health care", "HEALTH CARE"
        ]

        # Additional site/UX keywords beyond faq/product/price
        self.web_extra_keywords = [
            "website", "trang web", "trang chủ", "menu", "điều hướng", "đường dẫn",
            "route", "navigation", "ui", "ux", "giao diện", "liên hệ", "hỗ trợ",
            "support", "help", "policy", "terms", "privacy", "cookies"
        ]

        # Unified web keywords = faq ∪ product ∪ price ∪ extras
        self.web_keywords = sorted(list({
            *self.faq_keywords, *self.product_keywords, *self.price_keywords, *self.web_extra_keywords
        }))
        
        self.medical_keywords = [
            # English
            "symptom", "symptoms", "disease", "illness", "pain", "fever", "headache",
            "medicine", "medication", "treatment", "diagnosis", "doctor",
            "hospital", "health", "medical", "condition", "therapy", "anatomy",
            "structure", "organ", "liver", "kidney", "heart", "lung", "stomach",
            # Vietnamese
            "triệu chứng", "bệnh", "đau", "sốt", "đau đầu", "điều trị", "khám",
            "giải phẫu", "cấu tạo", "cơ thể", "cơ quan", "gan", "thận", "tim",
            "phổi", "dạ dày", "ruột", "máu", "da", "mắt", "tai", "mũi", "miệng",
            "xương", "cơ", "khớp", "gan mật", "tiêu hóa", "hô hấp"
        ]
        
        # Medical disclaimer
        self.medical_disclaimer = (
            "\n\n⚠️ Tuyên bố miễn trừ y tế: Thông tin này chỉ mang tính chất giáo dục và "
            "không thay thế cho lời khuyên, chẩn đoán hay điều trị y tế chuyên nghiệp. "
            "Hãy tham khảo ý kiến bác sĩ khi cần."
        )

        # Semantic representative phrases per intent (can be expanded)
        self.intent_phrases: Dict[str, List[str]] = {
            "greeting": [
                "xin chào", "chào bạn", "cảm ơn", "tạm biệt", "hello", "hi"
            ],
            "price": [
                "giá bao nhiêu", "chi phí", "khuyến mãi", "so sánh giá", "price", "cost"
            ],
            "product": [
                "công dụng của thuốc", "thành phần sản phẩm", "cách dùng thuốc", "tác dụng phụ",
                "chống chỉ định", "thuốc này là gì", "product details"
            ],
            "medical": [
                "triệu chứng bệnh", "giải phẫu gan", "cấu tạo cơ thể", "điều trị chung", "phòng ngừa bệnh"
            ],
            "followup": [
                "giải thích thêm", "chi tiết hơn", "ví dụ thêm", "nói rõ hơn", "tiếp tục"
            ],
            "non_medical": [
                "hack wifi", "cách nấu ăn", "tin tức bóng đá", "tải phim"
            ],
            "general": [
                "giúp tôi", "tư vấn giúp", "hỗ trợ"
            ],
            "faq": [
                "trang web hoạt động thế nào", "đường dẫn các trang", "cách đăng nhập",
                "chính sách quyền riêng tư", "điều khoản dịch vụ", "liên hệ ở đâu",
                "chatbot dùng ra sao", "ứng dụng health care là gì", "đăng nhập", "đăng ký",
                "quên mật khẩu", "login", "register", "forgot password"
            ],
            "web": [
                "đăng nhập", "đăng ký", "giá", "sản phẩm", "trang web", "/login", "/products",
                "/privacy", "/terms", "quên mật khẩu", "account", "checkout", "price", "product",
                "điều khoản", "quyền riêng tư", "liên hệ", "hỗ trợ"
            ],
        }

        # Lazy embedding model reference (reuse from RAG if available)

        # Precomputed representative embeddings and index
        self._rep_texts: List[str] = []
        self._rep_intents: List[str] = []
        # Small LRU cache for query embeddings
        self._q_cache: Dict[str, np.ndarray] = {}
        self._q_cache_order: List[str] = []
        self._q_cache_limit: int = 64
        self._compiled_safety_patterns = [
            re.compile(p, re.IGNORECASE | re.DOTALL) 
            for p in (self.blocked_patterns + self.illegal_patterns + self.inappropriate_patterns)
        ]

    def validate_input(self, user_input: str) -> Dict[str, Any]:
        """
        Chỉ kiểm tra các vi phạm an toàn nghiêm trọng (Jailbreak, độc hại) bằng Regex/Keyword.
        """
        q_lower = user_input.lower()
        
        # 1. Chặn nhanh Jailbreak/Illegal/Inappropriate
        for compiled_pattern in self._compiled_safety_patterns: 
            if compiled_pattern.search(q_lower):
                return {
                    "safe": False, 
                    "reason": "Yêu cầu vi phạm chính sách an toàn của hệ thống."
                }
        
        # 2. Phát hiện khẩn cấp (Không chặn, nhưng cảnh báo/gắn cờ)
        is_emergency = any(k in q_lower for k in self.emergency_keywords)
        if is_emergency:
            # Hệ thống phải được thiết lập để trả lời khẩn cấp ngay tại node này
            return {
                "safe": False,
                "reason": "Phát hiện nội dung liên quan đến tình trạng y tế khẩn cấp hoặc tự hại."
            }
            
        return {
            "safe": True, 
            "reason": "Input an toàn, chuyển sang phân loại ý định."
        }
    def _is_valid_medical_question(self, query: str) -> bool:
        """Check if the question is related to medical/health topics"""
        
        # First check for greeting patterns - allow these through
        greeting_patterns = [
            "xin chào", "chào", "hello", "hi", "hey", "good morning", "good afternoon", "good evening",
            "chào bạn", "chào bot", "chào chatbot", "hello bot", "hi bot", "hey bot",
            "cảm ơn", "thank you", "thanks", "cảm ơn bạn", "thank you bot",
            "tạm biệt", "goodbye", "bye", "see you", "hẹn gặp lại",
            "bạn khỏe không", "how are you", "bạn thế nào", "how are you doing",
            "làm gì", "what are you doing", "bạn đang làm gì"
        ]
        
        # Check for greeting patterns first
        if any(pattern in query for pattern in greeting_patterns):
            return True
        
        medical_keywords = [
            # General health
            "sức khỏe", "health", "y tế", "medical", "bệnh", "disease", "illness",
            "triệu chứng", "symptom", "đau", "pain", "sốt", "fever", "ho", "cough",
            "thuốc", "medicine", "medication", "điều trị", "treatment", "therapy",
            "chẩn đoán", "diagnosis", "bác sĩ", "doctor", "bệnh viện", "hospital",
            "phòng khám", "clinic", "dược sĩ", "pharmacist", "nhà thuốc", "pharmacy",
            
            # Body parts and systems
            "tim", "heart", "phổi", "lung", "gan", "liver", "thận", "kidney",
            "dạ dày", "stomach", "ruột", "intestine", "máu", "blood", "da", "skin",
            "mắt", "eye", "tai", "ear", "mũi", "nose", "miệng", "mouth",
            "răng", "tooth", "xương", "bone", "cơ", "muscle", "khớp", "joint",
            
            # Medical conditions
            "tiểu đường", "diabetes", "huyết áp", "blood pressure", "tim mạch", "cardiovascular",
            "ung thư", "cancer", "viêm", "inflammation", "nhiễm trùng", "infection",
            "dị ứng", "allergy", "hen suyễn", "asthma", "đau đầu", "headache",
            "mất ngủ", "insomnia", "trầm cảm", "depression", "lo âu", "anxiety",
            
            # Medications and treatments
            "kháng sinh", "antibiotic", "giảm đau", "painkiller", "vitamin", "khoáng chất",
            "thuốc cảm", "cold medicine", "thuốc ho", "cough medicine", "thuốc sốt", "fever medicine",
            "kem", "cream", "thuốc mỡ", "ointment", "thuốc nhỏ", "drops", "thuốc xịt", "spray",
            
            # Products and prices
            "sản phẩm", "product", "giá", "price", "cost", "mua", "buy", "bán", "sell",
            "công dụng", "benefit", "tác dụng", "effect", "cách dùng", "how to use",
            "liều lượng", "dosage", "tác dụng phụ", "side effect", "chống chỉ định", "contraindication"
        ]
        
        # Check if query contains medical OR web keywords to allow site questions
        keywords = self.medical_keywords + self.web_keywords
        return any(keyword in query for keyword in keywords)
    
    async def detect_intent(self, query: str) -> str:
        """LLM-based intent detection for accurate classification."""
        q = (query or "").strip()
        if not q:
            return "general"

        # Safety quick check (non-async)
        for pattern in self.blocked_patterns + self.illegal_patterns:
            if re.search(pattern, q, re.IGNORECASE):
                return "safety_violation"

        # 🚨 FIX 4: Gọi LLM BẤT ĐỒNG BỘ
        # Chỉ kiểm tra self.llm có tồn tại, không cần kiểm tra self.llm.client vì LocalLlamaCppLLM không dùng thuộc tính đó.
        if self.llm: 
            try:
                # LocalLlamaCppLLM có ainvoke()
                intent = await self._llm_intent_detection(q) 
                if intent:
                    return intent
            except Exception as e:
                # Lỗi LLM, in ra và chuyển sang Heuristic
                print(f"⚠️ LLM intent detection failed (async): {e}, falling back to heuristic")
        
        # Fallback to heuristic detection
        return self._heuristic_intent_detection(q)
    
    async def _llm_intent_detection(self, query: str) -> str:
        # ... (Giữ nguyên logic Early return cho greeting/thanks/goodbye) ...
        q = query.strip().lower()

        # ⚡ Bước 1: Early return cho greeting thực sự (rất ngắn)
        if len(q.split()) <= 3 and any(word in q for word in ["chào", "xin chào", "hello", "hi", "hey"]):
            return "greeting"
        if len(q.split()) <= 3 and any(word in q for word in ["cảm ơn", "thanks", "thank", "biết ơn", "tks"]):
            return "thanks"
        if len(q.split()) <= 3 and any(word in q for word in ["tạm biệt", "bye", "goodbye", "hẹn gặp lại"]):
            return "goodbye"

        # 🧠 Bước 2: Dùng LLM cho intent phức tạp
        prompt = f"""
Bạn là một chuyên gia phân loại ý định người dùng cho hệ thống chatbot y tế.
Nhiệm vụ của bạn là phân loại câu hỏi sau vào MỘT trong các loại ý định được định nghĩa.
LUÔN LUÔN trả lời bằng một đối tượng JSON HỢP LỆ.

Các loại ý định hợp lệ (chỉ chọn MỘT):
1. greeting (Lời chào hỏi/cảm ơn)
2. ask_product (Hỏi về TÊN SẢN PHẨM, giá, nơi bán)
3. medical_condition (Hỏi về KIẾN THỨC Y TẾ, triệu chứng, bệnh lý)
4. ask_medication (Hỏi về CÁCH DÙNG THUỐC, liều lượng, tác dụng phụ)
5. faq (Hỏi về trang web, chính sách, tài khoản)
6. general (Câu hỏi khác/không rõ ràng)

HÃY PHÂN BIỆT RÕ: 'medical_condition' là KIẾN THỨC BỆNH LÝ, 'ask_medication' là CÁCH DÙNG THUỐC, 'ask_product' là THÔNG TIN THƯƠNG MẠI/SẢN PHẨM.

Câu hỏi của người dùng: "{query}"

Trả lời CHỈ đối tượng JSON (ví dụ: {{"intent": "ask_product"}}):
"""

        try:
            # 🟢 FIX 5: Dùng ainvoke() chuẩn của LangChain thay vì _acall()
            response_text = await self.llm.ainvoke(prompt)
            json_match = re.search(r'\{.*?\}', response_text.strip(), re.DOTALL)
            
            if json_match:
                json_string = json_match.group(0)
                # Dùng thư viện json để parse, đây là cách tin cậy nhất
                import json
                parsed_json = json.loads(json_string)
                
                # Trích xuất intent
                intent = parsed_json.get("intent", "").strip().lower()

                valid_intents = ["greeting", "thanks", "goodbye", "ask_product", "medical_condition", "ask_medication", "faq", "general"]
                if intent in valid_intents:
                    return intent
                
                # Nếu LLM trả về JSON nhưng intent không hợp lệ
                print(f"⚠️ Invalid intent value in LLM JSON: '{intent}', fallback to heuristic.")
                return self._heuristic_intent_detection(query)

            # Nếu không tìm thấy JSON hoặc lỗi parsing (dùng lại logic cũ để loại bỏ ký tự)
            intent = response_text.strip().lower()
            intent = re.sub(r'[^a-z_]', '', intent) # Loại bỏ tất cả ký tự không phải a-z, _
            
            valid_intents = ["greeting", "thanks", "goodbye", "ask_product", "medical_condition", "ask_medication", "faq", "general"]
            if intent in valid_intents:
                return intent

            # Trường hợp LLM trả lời lan man/vô nghĩa
            print(f"⚠️ Invalid LLM intent output: '{response_text.strip()[:50]}...', fallback to heuristic.")
            return self._heuristic_intent_detection(query)

        except Exception as e:
            print(f"⚠️ LLM intent detection error: {e}")
            return self._heuristic_intent_detection(query)
    def _heuristic_intent_detection(self, query: str) -> str:
        q = query.lower()

        # 1. Safety check (Giữ nguyên)
        if any(p in q for p in self.emergency_keywords):
            return "emergency"

        # 2. Medication detection (Ưu tiên: Thuốc cụ thể và liều dùng)
        medication_tokens = ["liều", "liều lượng", "dosage", "cách dùng", "tác dụng phụ", "chống chỉ định"]
        if any(k in q for k in medication_tokens) and any(topic in q for topic in ["thuốc", "medication"]):
            return "ask_medication"

        # 3. Product/Price detection (Ưu tiên: Giao dịch, tìm kiếm sản phẩm)
        product_verbs = ["giới thiệu", "tìm", "show", "cho tôi xem", "recommend", "gợi ý", "mua", "bán", "giá"]
        if (
            any(k in q for k in self.product_keywords) 
            or any(k in q for k in self.price_keywords)
            or (
                any(v in q for v in product_verbs) 
                and any(topic in q for topic in ["sản phẩm", "thuốc", "thực phẩm chức năng", "brand", "nhãn hiệu"])
            )
        ):
            return "ask_product"

        # 4. FAQ (Câu hỏi về website/hệ thống)
        if any(k in q for k in self.web_keywords):
            return "faq"
            
        # 5. Medical condition (Kiến thức y tế chung)
        if any(k in q for k in self.medical_keywords):
            return "medical_condition"

        # 6. Greeting (Đơn giản)
        greeting_markers = ["xin chào", "chào", "hello", "hi", "cảm ơn", "tạm biệt", "bye", "thank you"]
        if any(m in q for m in greeting_markers):
            return "greeting"

        return "general"
    
    
    async def validate_output(self, response: Dict[str, Any], is_medical: bool = True) -> Dict[str, Any]: 
        
        # 1. Trích xuất text cần validate
        if "combined" not in response or "text" not in response["combined"]:
            return response
            
        original_text = response["combined"]["text"]
        
        # ⚠️ Tối ưu: Bỏ logic gọi LLM. Chỉ cần thêm disclaimer cố định.
        if is_medical:
            disclaimer = (
                "\n\n⚠️ Lưu ý: Thông tin này chỉ mang tính tham khảo, "
                "không thay thế chẩn đoán/lời khuyên y tế chuyên nghiệp. "
                "Vui lòng tham khảo ý kiến bác sĩ khi cần."
            )
            # Dùng .strip() để đảm bảo khoảng trắng
            text_with_disclaimer = original_text.strip()
            
            # Chỉ thêm nếu chưa có (để tránh lặp lại nếu LLM chính đã tự thêm)
            if "lưu ý" not in text_with_disclaimer.lower():
                text_with_disclaimer += disclaimer
            
            response["combined"]["text"] = text_with_disclaimer
            
        return response 
            
    # --- Hàm extract_entities (Giữ nguyên) ---
    def extract_entities(self, text: str) -> Dict[str, Any]:
        # ... (logic hiện tại giữ nguyên) ...
        # (Tôi bỏ qua việc sao chép code này vì nó không thay đổi)
        # BẠN CẦN GIỮ NGUYÊN CODE TỪ DÒNG extract_entities() ĐẾN HẾT FILE
        return {} # Placeholder
    
    def is_medical_question(self, user_message: str) -> bool:
        """Check if the question is medical-related"""
        message_lower = user_message.lower()
        return any(keyword in message_lower for keyword in self.medical_keywords)
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract medical entities from text using LLM when available, fallback to regex."""
        # Try LLM-based extraction via LangChainIntentClassifier
        try:
            from intent_classifier import LangChainIntentClassifier
            clf = LangChainIntentClassifier()
            result = clf.classify(text)
            ent = result.get("entities") or {}
            # Normalize structure
            normalized = {
                "symptoms": ent.get("symptom") or ent.get("symptoms") or [],
                "medications": ent.get("medication") or ent.get("medications") or [],
                "conditions": ent.get("condition") or ent.get("conditions") or [],
                "product_name": ent.get("product_name") or ent.get("product") or "",
            }
            # Ensure lists
            for k in ["symptoms", "medications", "conditions"]:
                v = normalized.get(k)
                if isinstance(v, str):
                    normalized[k] = [v]
                elif not isinstance(v, list):
                    normalized[k] = []
            if not isinstance(normalized.get("product_name"), str):
                normalized["product_name"] = ""
            return normalized
        except Exception:
            pass

        # Regex fallback
        entities = {
            "symptoms": [],
            "medications": [],
            "conditions": [],
            "product_name": ""
        }
        text_lower = text.lower()
        symptom_patterns = [
            r"đau\s+([\wàáạãảăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ-]+)",
            r"sốt\s+([\wàáạãảăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ-]+)",
            r"ho\s+([\wàáạãảăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ-]+)",
        ]
        for pattern in symptom_patterns:
            entities["symptoms"].extend(re.findall(pattern, text_lower))
        return entities
