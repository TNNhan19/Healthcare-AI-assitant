import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { format } from 'date-fns';
import { marked } from "marked";
import remarkGfm from "remark-gfm";
import './ChatPopupWindow.css';
import MiniProductCard  from "./MiniProduct";
import { useNavigate } from "react-router-dom";

// --- Helper Function to Render Links ---
const renderMessageContent = (content?: string) => { // Make content optional
    if (!content) return ''; // Return empty string if content is undefined

    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = markdownLinkRegex.exec(content)) !== null) {
        // Add the text before the link
        if (match.index > lastIndex) {
            parts.push(content.substring(lastIndex, match.index));
        }
        // Add the link component
        const [fullMatch, linkText, linkUrl] = match;
        parts.push(<Link key={lastIndex} to={linkUrl} className="chat-markdown-link">{linkText}</Link>);
        lastIndex = match.index + fullMatch.length;
    }

    // Add any remaining text after the last link
    if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
    }

    return <>{parts}</>;
};


interface Attachment {
    id: string;
    type: 'image' | 'file';
    url: string;
    name: string;
    size?: number;
    thumbnail?: string;
}

interface ProductCard {
    productId: string;
    name: string;
    image: string;
    price: number;
}

interface Message {
    id: string;
    from: string;
    timestamp: string;
    type: 'message' | 'system' | 'error' | 'product';
    status?: 'sent' | 'delivered' | 'read';
    attachments?: Attachment[];
    productCard?: ProductCard;

    /**
     * 🧠 Content có thể là:
     * - string (tin nhắn thông thường)
     * - object (đa intent: { final_response: { intent: { text, links } } })
     */
    content?: string | {
        final_response?: Record<
            string,
            {
                text: string;
                links?: string[];
            }
        >;
    };

    /**
     * 🧩 Trường riêng, khi backend trả trực tiếp { final_response: {...} }
     */
    final_response?: Record<
        string,
        {
            text: string;
            links?: string[];
        }
    >;
}

interface ChatPopupProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: string;
        name: string;
        token: string;
        role: string;
    };
    onNewMessage?: () => void;
}


const ChatPopupWindow: React.FC<ChatPopupProps> = ({ isOpen, onClose, user, onNewMessage }) => {
    const [aiMessages, setAiMessages] = useState<Message[]>([]);
    const [pharmaMessages, setPharmaMessages] = useState<Message[]>([]);
    // const [messages, setMessages] = useState<Message[]>([]); // No longer needed, computed directly
    const [inputValue, setInputValue] = useState('');
    const [mode, setMode] = useState<'ai' | 'pharmacist'>('ai');
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [huggingFaceToken, setHuggingFaceToken] = useState(() => localStorage.getItem('huggingFaceToken') || '');
    
    // ✨ BƯỚC 1: Thêm state để theo dõi trạng thái "AI đang suy nghĩ"
    const [isAiThinking, setIsAiThinking] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    // Determine which messages to display based on the current mode
    const messages = mode === 'ai' ? aiMessages : pharmaMessages;

    const fetchAiChatHistory = async () => {
        try {
            console.log("Attempting to fetch AI history with token:", user.token); // DEBUGGING
            const res = await fetch('/api/v1/ai-chat/history', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (!res.ok) {
                // Log the server's response for more details
                const errorBody = await res.json();
                console.error("Server responded with an error:", errorBody);
                throw new Error('Failed to fetch AI history');
            }
            const data = await res.json();
            if (Array.isArray(data.history)) {
                const historyMsgs = data.history.map((msg: any) => ({
                    id: msg._id,
                    content: msg.content,
                    from: msg.from === 'user' ? user.id : 'AI Assistant',
                    timestamp: msg.timestamp,
                    type: 'message',
                }));
                setAiMessages(historyMsgs);
            }
        } catch (err) {
            console.error("Failed to fetch AI chat history:", err);
        }
    };
    const fetchProductInfo = async (id: string) => {
        try {
          const res = await fetch(`/api/v1/products/${id}`);
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      };

    const fetchPharmacistChatHistory = async () => {
        try {
            console.log('Fetching chat history for user:', user.id); // Debug log
            const res = await fetch(`/api/v1/chat/history?userId=${user.id}&pharmacistId=pharmacist`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error('Server error:', errorText); // Debug log
                throw new Error(`Server responded with ${res.status}`);
            }
            
            const data = await res.json();
            console.log('Received chat history:', data); // Debug log
            
            if (Array.isArray(data.history)) {
                const historyMsgs = data.history.map((msg: any) => {
                    console.log('Processing message:', msg); // Debug log
                    return {
                        id: msg._id || msg.messageId || Date.now().toString(),
                        content: msg.message || msg.content || '',
                        from: msg.senderId?._id?.toString() === user.id ? user.id : msg.from || 'pharmacist',
                        timestamp: msg.timestamp || new Date().toISOString(),
                        type: msg.messageType || 'message',
                        status: msg.status || 'delivered',
                        productCard: msg.productCard,
                        attachments: msg.attachments || []
                    };
                });
                console.log('Processed messages:', historyMsgs); // Debug log
                setPharmaMessages(historyMsgs);
            } else {
                console.warn('History is not an array:', data); // Debug log
            }
        } catch (err) {
            console.error("Failed to fetch chat history:", err);
            setPharmaMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                content: 'Could not load chat history.', 
                from: 'system', 
                timestamp: new Date().toISOString(), 
                type: 'error' 
            }]);
        }
    };

    useEffect(() => {
        const initializeChat = async () => {
            if (isOpen) {
                if (mode === 'pharmacist') {
                    // First fetch history
                    await fetchPharmacistChatHistory();
                    // Then connect WebSocket if not already connected
                    if (!ws || ws.readyState !== WebSocket.OPEN) {
                        connectWebSocket();
                    }
                } else if (mode === 'ai') {
                    await fetchAiChatHistory();
                }
            }
        };

        initializeChat();
        
        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [isOpen, mode]);

    // ✨ Cập nhật useEffect để scroll khi có indicator "thinking"
    useEffect(() => {
        scrollToBottom();
        // If we have new messages and window is not focused, notify
        if (messages.length > 0 && document.hidden) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.from !== 'user') {
                if (onNewMessage) onNewMessage();
                notifyNewMessage(lastMessage);
            }
        }
    }, [messages, isAiThinking]); // Thêm isAiThinking vào dependency array

    const connectWebSocket = () => {
        if (!user || !user.token) {
            console.error("WebSocket connection failed: User or token is missing.");
            setPharmaMessages(prev => [...prev, {
                id: Date.now().toString(),
                content: 'Authentication error. Cannot connect to chat.',
                from: 'system',
                timestamp: new Date().toISOString(),
                type: 'error'
            }]);
            return;
        }

        const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/chat'}?token=${user.token}`;
        const wsClient = new WebSocket(wsUrl);

        wsClient.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        wsClient.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        wsClient.onerror = (error) => {
            console.error('WebSocket error:', error);
            setPharmaMessages(prev => [...prev, {
                id: Date.now().toString(),
                content: 'Connection error. Trying to reconnect...',
                from: 'system',
                timestamp: new Date().toISOString(),
                type: 'error'
            }]);
        };

        wsClient.onclose = () => {
            console.log('WebSocket closed, attempting to reconnect...');
            setIsConnected(false);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        setWs(wsClient);
    };

    const handleWebSocketMessage = (data: any) => {
        console.log('Received WebSocket message:', data); // Debug log
        
        // Check message type and handle accordingly
        switch (data.type) {
            case 'pharmacist_reply': {
                const message: Message = {
                    id: data.messageId || Date.now().toString(),
                    content: data.message || '', // Ensure content is never undefined
                    from: data.from,
                    timestamp: data.timestamp || new Date().toISOString(),
                    type: data.messageType || 'message',
                    status: 'delivered',
                    attachments: data.attachments || [],
                    productCard: data.productCard,
                };
                console.log('Created new pharmacist message:', message);
                setPharmaMessages(prev => [...prev, message]);
                
                // Send read receipt
                if (ws && ws.readyState === WebSocket.OPEN && data.from !== user.id) {
                    ws.send(JSON.stringify({
                        type: 'read_receipt',
                        messageId: data.messageId,
                        userId: user.id
                    }));
                }
                break;
            }
            case 'message_status_update': {
                setPharmaMessages(prev => prev.map(msg => 
                    msg.id === data.messageId ? { ...msg, status: data.status } : msg
                ));
                break;
            }
            default:
                console.log('Unhandled message type:', data.type);
        }

        // Send read receipt if it's a message from someone else
        if (ws && ws.readyState === WebSocket.OPEN && data.from !== user.id && newMessage.type !== 'system') {
            ws.send(JSON.stringify({
                type: 'read_receipt',
                messageId: newMessage.id,
                userId: user.id
            }));
        }
    };

    const notifyNewMessage = (message: Message) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Message', {
                body: message.content,
                icon: '/path/to/notification-icon.png'
            });
        }
    };

    // No longer needed, state is updated directly
    // const addMessage = (message: Message) => { ... };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const uploadFile = async (file: File): Promise<Attachment> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            return {
                id: data.id,
                type: file.type.startsWith('image/') ? 'image' : 'file',
                url: data.url,
                name: file.name,
                size: file.size,
                thumbnail: data.thumbnail
            };
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const handleSend = async () => {
        if (!inputValue.trim() && selectedFiles.length === 0) return;
        const messageId = Date.now().toString();
        let attachments: Attachment[] = [];
        const userMessage: Message = {
            id: messageId,
            content: inputValue,
            from: user.id,
            timestamp: new Date().toISOString(),
            type: 'message',
            status: 'sent',
            attachments: [] // attachments will be added after upload
        };

        try {
            if (selectedFiles.length > 0) {
                setIsUploading(true);
                attachments = await Promise.all(selectedFiles.map(uploadFile));
                userMessage.attachments = attachments;
            }

            if (mode === 'ai') {
                const recentMessages = aiMessages.slice(-2);
                const historyForApi: [string, string][] = [];
                for (let i = 0; i < recentMessages.length; i++) {
                    const msg = recentMessages[i];
                    if (msg.from === user.id) {
                        const aiResponse = recentMessages[i + 1];
                        if (aiResponse && aiResponse.from === 'AI Assistant') {
                            let aiText = "";
                            if (typeof aiResponse.content === 'string') {
                                aiText = aiResponse.content;
                            } else if (aiResponse.content?.final_response?.combined?.text) {
                                aiText = aiResponse.content.final_response.combined.text;
                            }
                            if (msg.content && aiText) {
                                historyForApi.push([msg.content as string, aiText]);
                            }
                        }
                    }
                }
                
                setAiMessages(prev => [...prev, userMessage]);
                // ✨ BƯỚC 2: Bật trạng thái "thinking" ngay trước khi gọi API
                setIsAiThinking(true); 

                try {
                    const token = localStorage.getItem('huggingFaceToken');
                    if (!token) {
                        setShowTokenInput(true);
                        throw new Error("Hugging Face token is not set.");
                    }
                    const aiServiceUrl = 'http://localhost:8003';
                    const response = await fetch(`${aiServiceUrl}/api-chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: inputValue,
                            user_id: user.id,
                            hf_token: token,
                            history: historyForApi
                        })
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.error || 'AI service returned an error');
                    }
                    const aiResponse: Message = {
                        id: (Date.now() + 1).toString(),
                        content: data.final_response ? { final_response: data.final_response } : { message: data.message || data.error || "No response" },
                        from: 'AI Assistant',
                        timestamp: new Date().toISOString(),
                        type: 'message',
                    };
                    setAiMessages(prev => [...prev, aiResponse]);
                } catch (error) {
                    const errorMessage: Message = {
                        id: Date.now().toString(),
                        content: `AI Assistant Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        from: 'system',
                        timestamp: new Date().toISOString(),
                        type: 'error'
                    };
                    setAiMessages(prev => [...prev, errorMessage]);
                } finally {
                    // ✨ BƯỚC 2 (tiếp): Luôn tắt trạng thái "thinking" sau khi có kết quả hoặc lỗi
                    setIsAiThinking(false);
                }
            } else if (ws && ws.readyState === WebSocket.OPEN) {
                setPharmaMessages(prev => [...prev, userMessage]);
                ws.send(JSON.stringify({
                    type: 'user_message',
                    messageId: userMessage.id,
                    message: userMessage.content,
                    attachments: userMessage.attachments,
                    timestamp: userMessage.timestamp
                }));
            }
            
            setInputValue('');
            setSelectedFiles([]);
        } catch (error) {
            console.error('Send error:', error);
            const errorMessage: Message = {
                id: Date.now().toString(),
                content: 'Failed to send message. Please try again.',
                from: 'system',
                timestamp: new Date().toISOString(),
                type: 'error'
            };
            if (mode === 'ai') {
                setAiMessages(prev => [...prev, errorMessage]);
            } else {
                setPharmaMessages(prev => [...prev, errorMessage]);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const switchMode = (newMode: 'ai' | 'pharmacist') => {
        setMode(newMode);
    };

    const handleEmojiSelect = (emoji: any) => {
        setInputValue(prev => prev + emoji.emoji);
        setShowEmojiPicker(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNewChat = async () => {
        if (mode !== 'ai') return;
        if (!confirm("Are you sure you want to start a new chat? This will clear your current conversation with the AI.")) return;

        try {
            const res = await fetch('/api/v1/ai-chat/history', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (!res.ok) throw new Error('Failed to clear history');
            setAiMessages([]);
        } catch (err) {
            console.error("Failed to clear AI chat:", err);
            alert("Could not start a new chat. Please try again.");
        }
    };

    const handleTokenSave = () => {
        localStorage.setItem('huggingFaceToken', huggingFaceToken);
        setShowTokenInput(false);
    };
    const navigate = useNavigate();
    return (
        <div className={`chat-popup-window ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
            <header className="chat-header">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center">
                        <span>Health Care Chat</span>
                        <span className={`ml-2 w-2 h-2 rounded-full ${mode === 'pharmacist' && isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                    </h3>
                    <div className="header-buttons">
                        {mode === 'ai' && (
                            <Link to="/chat" className="header-button" title="Open in full screen">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                   <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                   <path d="M5 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-2.586l-6.293-6.293A1 1 0 005 5z" />
                                </svg>
                            </Link>
                        )}
                        {mode === 'ai' && (
                            <button onClick={() => setShowTokenInput(!showTokenInput)} className="header-button" title="AI Settings">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L8 5.134A5.973 5.973 0 005.134 8L3.17 8.51c-1.56.38-1.56 2.6 0 2.98L5.134 12A5.973 5.973 0 008 14.866L8.51 16.83c.38 1.56 2.6 1.56 2.98 0L12 14.866A5.973 5.973 0 0014.866 12L16.83 11.49c1.56-.38 1.56-2.6 0-2.98L14.866 8A5.973 5.973 0 0012 5.134L11.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                        <button onClick={onClose} className="header-button" title="Close chat">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg> 
                        </button>
                    </div>
                </div>
                {showTokenInput && mode === 'ai' && (
                    <div className="token-input-container">
                        <input
                            type="password"
                            placeholder="Enter your Hugging Face Token..."
                            value={huggingFaceToken}
                            onChange={(e) => setHuggingFaceToken(e.target.value)}
                            className="token-input"
                        />
                        <button onClick={handleTokenSave} className="token-save-button">Save</button>
                    </div>
                )}
                <div className="mode-switcher">
                    <button 
                        onClick={() => switchMode('ai')}
                        className={`mode-button ${mode === 'ai' ? 'bg-white text-blue-500' : 'text-white border border-white'}`}
                    >
                        AI Assistant
                    </button>
                    <button 
                        onClick={() => switchMode('pharmacist')}
                        className={`mode-button ${mode === 'pharmacist' ? 'bg-white text-blue-500' : 'text-white border border-white'}`}
                    >
                        Pharmacist
                    </button>
                </div>
            </header>
    
            <div className="messages-container">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message-group ${msg.from === user.id ? 'text-right' : 'text-left'}`}>
                        <div className={`message ${
                            msg.type === 'system' ? 'system-message' :
                            msg.type === 'error' ? 'error-message' :
                            msg.from === user.id ? 'user-message' : 'assistant-message'
                        }`}>
                            {/* Conditional Rendering: Show Product Card, Markdown, or Text */}
                            {(msg.type === 'product' && msg.productCard) ? (
                                <Link to={`/product/${msg.productCard.productId}`} className="product-card-link">
                                    <div className="product-card">
                                        <img src={msg.productCard.image} alt={msg.productCard.name} className="product-card-image" />
                                        <div className="product-card-info">
                                            <p className="product-card-name">{msg.productCard.name}</p>
                                            <p className="product-card-price">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(msg.productCard.price)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <div className="message-content">
                                                        {(() => {
                    // 🧠 Bước 1: Lấy content gốc
                    let content: any = msg.content;

                    // 🔹 Nếu là string JSON → parse thành object
                    if (typeof content === "string") {
                        try {
                        const parsed = JSON.parse(content);
                        if (parsed && typeof parsed === "object") {
                            content = parsed;
                        }
                        } catch {
                        // không parse được → giữ nguyên text
                        }
                    }

                    // 🧩 === Trường hợp 1: có final_response (multi-intent) ===
                    const finalResponse = content?.final_response;
                    if (finalResponse && typeof finalResponse === "object") {
                        return Object.entries(finalResponse).map(([intent, res]: any, idx) => {
                            // 🔧 Parse markdown link [text](url) → tách link ra mảng res.links
                            if ((!res.links || !Array.isArray(res.links)) && typeof res.text === "string") {
                                // Regex đơn giản bắt tất cả các markdown links, kể cả lồng
                                const linkMatches = [...res.text.matchAll(/\[([^\]]+)\]\([^)]+\/[^\s)]+\)/g)];
                              
                                if (linkMatches.length > 0) {
                                  res.links = linkMatches
                                    .map(m => {
                                      const innerMatch = m[0].match(/\(([^)]+)\)$/);
                                      return innerMatch ? innerMatch[1] : null;
                                    })
                                    .filter(Boolean);
                                }
                              }
                    
                            // ✅ Phải return JSX ở đây
                            return (
                                <div key={idx} className="mb-3">
                                    <div className="font-semibold text-blue-600 capitalize mb-1">
                                        {intent.replace("_", " ")}
                                    </div>
                    
                                    {/* Nội dung text */}
                                    <div
                                className="text-gray-800"
                                dangerouslySetInnerHTML={{
                                    __html: marked.parse(res?.text || ""),
                                }}
                                />
                    
                                    {/* Links */}
                                    {Array.isArray(res.links) && res.links.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {res.links.map((link: string, i: number) => {
                                                if (!link || typeof link !== "string") return null;
                    
                                                if (link.startsWith("/product/")) {
                                                    const productId = link.split("/product/")[1]?.trim().replace(/\/$/, "");
                                                    if (!productId) return null;
                                                    console.log("Rendering MiniProductCard for ID:", productId);
                                                    return (
                                                        <MiniProductCard
                                                            key={`${productId}-${i}`}
                                                            productId={productId}
                                                        />
                                                    );
                                                }
                    
                                                return (
                                                    <a
                                                        key={i}
                                                        href={link}
                                                        className="text-blue-500 hover:underline break-all"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {link}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    }

                    // 🧩 === Trường hợp 2: có message (safety_violation hoặc lỗi hệ thống) ===
                    if (typeof content?.message === "string") {
                        return (
                        <div className="text-red-600 font-medium">
                            {content.message}
                        </div>
                        );
                    }

                    // 🧩 === Trường hợp 3: chỉ là text thường ===
                    if (typeof content === "string") {
                        return <div dangerouslySetInnerHTML={{ __html: content }} />;
                    }

                    // 🧩 === Fallback ===
                    return renderMessageContent(String(content || ""));
                    })()}
                                    </div>

                            )}
                            
                            {msg.attachments?.map((attachment, i) => (
                                <div key={i} className="attachment-preview">
                                    {attachment.type === 'image' ? (
                                        <img 
                                            src={attachment.url} 
                                            alt={attachment.name}
                                            className="image-attachment"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="file-attachment">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                            </svg>
                                            <span>{attachment.name}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="message-timestamp">
                                {/* Safety Check for Timestamp */}
                                {msg.timestamp && !isNaN(new Date(msg.timestamp).getTime()) 
                                    ? format(new Date(msg.timestamp), 'HH:mm')
                                    : '...'}
                                
                                {msg.status && msg.from === user.id && (
                                    <span className="message-status ml-1">
                                        {msg.status === 'sent' && '✓'}
                                        {msg.status === 'delivered' && '✓✓'}
                                        {msg.status === 'read' && <span className="text-blue-400">✓✓</span>}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* ✨ BƯỚC 3: Hiển thị UI "AI đang suy nghĩ..." */}
                {isAiThinking && (
                    <div className="message-group text-left">
                        <div className="message assistant-message">
                            {/* Tái sử dụng component typing-indicator có sẵn */}
                            <div className="typing-indicator">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        </div>
                    </div>
                )}

                {isTyping && (
                    <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
    
            <div className="chat-input-container">
                {showEmojiPicker && (
                    <div className="emoji-picker-container">
                        <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </div>
                )}
                <div className="chat-input-wrapper">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="action-button"
                        title="Add emoji"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="action-button"
                        title="Attach file"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <textarea
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            if (mode === 'pharmacist' && ws?.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ 
                                    type: 'typing',
                                    userId: user.id 
                                }));
                            }
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder={isUploading ? 'Uploading files...' : 'Type your message...'}
                        className="chat-input"
                        disabled={isUploading}
                    />
                    {selectedFiles.length > 0 && (
                        <div className="selected-files">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="selected-file">
                                    <span>{file.name}</span>
                                    <button
                                        onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                                        className="remove-file-button"
                                        title="Remove file"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={handleSend}
                        className="send-button"
                        disabled={isUploading}
                        title="Send message"
                    >
                        {isUploading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M2.293 9.293a1 1 0 011.414 0L10 15.586l6.293-6.293a1 1 0 111.414 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg> 
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ChatPopupWindow;
