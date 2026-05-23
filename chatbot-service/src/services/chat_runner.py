
import os
import asyncio
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import sys
import re
# Bổ sung FIX: Import WsgiToAsgi để chạy Flask trên Uvicorn
from asgiref.wsgi import WsgiToAsgi
from dotenv import load_dotenv 

# Load environment variables (giữ lại nếu các phần khác cần)
load_dotenv() 

# --- Path Setup (Giữ nguyên) ---
PY_LOCAL_PATH = os.path.join(os.path.dirname(__file__), '..', 'py')
PY_LOCAL_PATH = os.path.abspath(PY_LOCAL_PATH)
if PY_LOCAL_PATH not in sys.path:
    sys.path.insert(0, PY_LOCAL_PATH)

# --- Import Chatbot (Giữ nguyên) ---
try:
    from main import RAGMedicalChatbot
except Exception as e:
    print(f"FATAL: Failed to import RAGMedicalChatbot: {e}", file=sys.stderr)
    sys.exit(1)

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app, origins=["*"], methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"])

# 🚨 FIX LỖI ASGI: Bọc Flask app bằng WsgiToAsgi để tạo đối tượng ASGI
asgi_app = WsgiToAsgi(app)


# --- Singleton Chatbot Instance ---
chatbot_instance = None
try:
    print("--- Initializing Chatbot Singleton ---")
    chatbot_instance = RAGMedicalChatbot() 
    print("--- Chatbot Singleton Initialized ---")
except Exception as e:
    print(f"FATAL: Could not initialize chatbot instance: {e}", file=sys.stderr)

# --- Helper Function to Format Links ---
def format_links(text):
    path_regex = r"\/[a-zA-Z0-9-]+"
    found_paths = re.findall(path_regex, text)
    if found_paths:
        unique_paths = sorted(list(set(found_paths)), key=len, reverse=True)
        for path in unique_paths:
            link_name = path.lstrip('/').replace('-', ' ').title()
            
            # Khởi tạo Markdown Link hợp lệ
            markdown_link = f"[{link_name}]({path})" 
            
            # Thay thế đường dẫn thô bằng link Markdown
            text = re.sub(r'(?<!\w)' + re.escape(path) + r'(?!\w)', markdown_link, text)
    return text

def ensure_faq_links(text: str) -> str:
    """If the answer looks like site/FAQ guidance, ensure common routes are suggested with links."""
    q = (text or "").lower()
    # Heuristic: if referring to login/register/products/news/account pages
    routes = [
        ("/products", "Sản phẩm"),
        ("/health-news", "Tin tức sức khỏe"),
        ("/login", "Đăng nhập"),
        ("/register", "Đăng ký"),
        ("/account", "Tài khoản"),
        ("/cart", "Giỏ hàng"),
        ("/checkout", "Thanh toán"),
        ("/privacy", "Quyền riêng tư"),
        ("/terms", "Điều khoản"),
        ("/contact", "Liên hệ"),
    ]
    suffix = []
    for path, name in routes:
        if path in text:
            continue
        # If keyword hints exist, add link
        key = name.lower().split()[0]
        if key in q:
            suffix.append(f"[{name}]({path})")
    if suffix:
        text = text.rstrip() + "\n\nCác đường dẫn hữu ích: " + ", ".join(suffix)
    return text

# --- API Routes ---
@app.post('/api-chat')
async def handle_chat():
    if not chatbot_instance:
        return jsonify({"error": "Chatbot is not available"}), 500

    data = request.get_json()
    query = data.get('message')
    hf_token = data.get('hf_token')
    # THAY ĐỔI: Nhận history từ request body
    history = data.get('history', [])
    if not query:
        return jsonify({"error": "Missing 'message' in request data."}), 400

    try:
        # THAY ĐỔI: Truyền history vào hàm generate_response
        response_data = await chatbot_instance.generate_response(user_message=query, history=history)
        
        # THAY ĐỔI: Xử lý response_data mới (là một dict)
        response_to_send = {}
        if "final_response" in response_data:
            formatted = {}
            for intent, res in response_data["final_response"].items():
                text = format_links(res.get("text", ""))
                res["text"] = ensure_faq_links(text)
                formatted[intent] = res
            response_to_send["final_response"] = formatted
        
        elif "message" in response_data:
            text = format_links(str(response_data["message"]))
            response_to_send["message"] = text
            
        elif "error" in response_data:
            return jsonify({"error": response_data["error"]}), 500

        # Luôn trả về cả history đã được cập nhật
        # response_to_send["history"] = response_data.get("history", [])

        # Chỉ cần trả về response, frontend đã tự quản lý history
        return jsonify(response_to_send)


    except Exception as e:
        import traceback; traceback.print_exc()
        print(f"Lỗi khi xử lý chat: {e}", file=sys.stderr)
        return jsonify({"error": f"Lỗi máy chủ nội bộ: {e}"}), 500
if __name__ == '__main__':
    if chatbot_instance:
        print("🚀 Starting ASGI server (Uvicorn)...")

        try:
            from uvicorn import run
            print("✅ Server is now running in ASYNC mode via Uvicorn.")
            run(asgi_app, host='0.0.0.0', port=8003)
        except ImportError:
            print("⚠️ Uvicorn chưa được cài, fallback sang Flask app.run().")
            app.run(debug=True, host='0.0.0.0', port=8003)
    else:
        print("❌ Không thể khởi động server: chatbot_instance = None")
