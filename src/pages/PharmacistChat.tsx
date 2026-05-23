import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiMessageSquare, FiSearch, FiHelpCircle } from 'react-icons/fi';
import './PharmacistChat.css';

// --- Types ---
type ProductCardData = {
    productId: string;
    name: string;
    image: string;
    price: number;
};

type ChatMessage = {
  role: 'user' | 'pharmacist';
  content?: string; // Fallback text - Make content optional
  messageType?: 'text' | 'product';
  productCard?: ProductCardData;
};

type User = {
  id: string;
  email: string;
};

type Conversations = {
  [userId: string]: ChatMessage[];
};

type Product = {
    _id: string;
    name: string;
    price: number;
    imageUrl: string; // Use the correct field name for the image
    description: string;
};

type FAQ = {
    question: string;
    answer: string;
};

const getToken = (): string | null => localStorage.getItem('pharmacist_token');

// --- Main Component ---
const PharmacistChat: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversations>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [activeTool, setActiveTool] = useState<'search' | 'faq' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [faqItems, setFaqItems] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [conversations, selectedUserId]);

  // --- Logic ---
  const handleProductSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    try {
        const res = await fetch(`/api/v1/products/search?q=${encodeURIComponent(searchTerm)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setSearchResults(data.products || []);
    } catch (error) {
        console.error("Product search error:", error);
        setSearchResults([]);
    } finally {
        setIsLoading(false);
    }
  };

  const sendMessage = (messagePayload: Partial<ChatMessage> & { messageType: 'text' | 'product' }) => {
    if (!selectedUserId || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
        alert("Please select a conversation first.");
        return;
    }
    const message = {
        type: 'pharmacist_reply',
        toUserId: selectedUserId,
        ...messagePayload
    };
    ws.current.send(JSON.stringify(message));
    setConversations(prev => ({
        ...prev,
        [selectedUserId]: [...(prev[selectedUserId] || []), { role: 'pharmacist', ...messagePayload }],
    }));
  };

  const handleSendReply = () => {
    if (!inputValue.trim()) return;
    sendMessage({ messageType: 'text', content: inputValue });
    setInputValue('');
  };

  const sendProductCard = (product: Product) => {
    sendMessage({
        messageType: 'product',
        content: `Đã gửi sản phẩm: ${product.name}`, // Fallback text
        productCard: {
            productId: product._id,
            name: product.name,
            image: product.imageUrl || '/placeholder.png', // Use correct field and add fallback
            price: product.price,
        }
    });
  };

  // --- Data & WebSocket ---
  useEffect(() => {
    const token = getToken();
    if (!token) { console.error("Token not found."); return; }

    const fetchInitialData = async () => {
        try {
            const pharmacistId = JSON.parse(atob(token.split('.')[1])).id;
            const res = await fetch(`/api/v1/chat/conversations/${pharmacistId}`);
            if (!res.ok) throw new Error(`Server responded with ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data.conversations)) {
                setUsers(data.conversations.map(c => c.user).filter(Boolean));
            }
        } catch (err) { console.error("Failed to fetch initial conversations:", err); }
    };

    const fetchFAQs = () => setFaqItems([
        { question: "Liều dùng Paracetamol?", answer: "Người lớn: 500-1000mg mỗi 4-6 giờ..." },
    ]);

    fetchInitialData();
    fetchFAQs();

    const connect = () => {
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/chat'}?token=${token}`;
      ws.current = new WebSocket(wsUrl);
      ws.current.onopen = () => console.log('WS connected');
      ws.current.onclose = () => setTimeout(connect, 3000);
      ws.current.onerror = (err) => { console.error('WS error:', err); ws.current?.close(); };
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'user_message') {
            const fromUser = data.from;
            setConversations(prev => ({
              ...prev,
              [fromUser.id]: [...(prev[fromUser.id] || []), { role: 'user', content: data.message }],
            }));
            setUsers(prev => prev.find(u => u.id === fromUser.id) ? prev : [...prev, fromUser]);
            if (!selectedUserId) setSelectedUserId(fromUser.id);
          }
        } catch (error) { console.error('Error parsing WS message:', error); }
      };
    };
    connect();
    return () => ws.current?.close();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    const fetchHistory = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const pharmacistId = JSON.parse(atob(token.split('.')[1])).id;
        const res = await fetch(`/api/v1/chat/history?userId=${selectedUserId}&pharmacistId=${pharmacistId}`);
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data.history)) {
          // CRITICAL FIX: Map the raw history data to the ChatMessage type the component expects
          const historyMessages = data.history.map((msg: any) => ({
            role: msg.senderId._id.toString() === pharmacistId ? 'pharmacist' : 'user',
            content: msg.message,
            messageType: msg.messageType || 'text',
            productCard: msg.productCard,
          }));
          setConversations(prev => ({ ...prev, [selectedUserId]: historyMessages }));
        }
      } catch (err) { console.error('Failed to fetch chat history:', err); }
    };
    fetchHistory();
  }, [selectedUserId]);

  // --- Render ---
  const renderUserList = () => (
    <div className="user-list-sidebar">
      <h2>Conversations</h2>
      <div className="user-list">
        {users.map(user => (
          <div key={user.id} className={`user-item ${selectedUserId === user.id ? 'selected' : ''}`} onClick={() => setSelectedUserId(user.id)}>
            <div className="user-avatar">{user.profile }</div>
            <div className="user-email">{user.email || 'Unknown User'}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChatArea = () => {
    const selectedUser = users.find(u => u.id === selectedUserId);
    return (
        <div className="chat-area">
        {selectedUserId && selectedUser ? (
            <>
            <div className="chat-header">Chatting with: {selectedUser.email}</div>
            <div className="chat-messages">
                {(conversations[selectedUserId] || []).map((msg, index) => {
                    const isProduct = msg.messageType === 'product' && msg.productCard;
                    return (
                        <div key={index} className={`message-bubble ${msg.role} ${isProduct ? 'contains-product' : ''}`}>
                            {isProduct ? (
                                <a href={`/product/${msg.productCard!.productId}`} target="_blank" rel="noopener noreferrer" className="product-card-link">
                                    <div className="product-card">
                                        <img src={msg.productCard!.image} alt={msg.productCard!.name} className="product-card-image" />
                                        <div className="product-card-info">
                                            <p className="product-card-name">{msg.productCard!.name}</p>
                                            <p className="product-card-price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(msg.productCard!.price)}</p>
                                        </div>
                                    </div>
                                </a>
                            ) : msg.content}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-area">
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendReply()} placeholder="Type your reply..."/>
                <button onClick={handleSendReply}><FiSend /></button>
            </div>
            </>
        ) : (
            <div className="no-conversation-selected">
                <FiMessageSquare size={48} />
                <h2>Welcome!</h2>
                <p>Select a conversation to start.</p>
            </div>
        )}
        </div>
    );
  };

  const renderSupportTools = () => (
    <div className="support-tools-sidebar">
        <div className="tool-header">
            <h3>Support Tools</h3>
            <div className="tool-icons">
                <button onClick={() => setActiveTool(t => t === 'search' ? null : 'search')} className={activeTool === 'search' ? 'active' : ''}><FiSearch /></button>
                <button onClick={() => setActiveTool(t => t === 'faq' ? null : 'faq')} className={activeTool === 'faq' ? 'active' : ''}><FiHelpCircle /></button>
            </div>
        </div>
        <div className="tool-content">
            {activeTool === 'search' && (
                <div className="product-search">
                    <h4>Product Search</h4>
                    <div className="search-input">
                        <input type="text" placeholder="Enter product name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleProductSearch()}/>
                        <button onClick={handleProductSearch} disabled={isLoading}>{isLoading ? '...' : <FiSearch />}</button>
                    </div>
                    <div className="search-results">
                        {searchResults.map(product => (
                            <div key={product._id} className="product-item">
                                <img src={product.imageUrl || '/placeholder.png'} alt={product.name} />
                                <div className="product-info">
                                    <p className="product-item-name">{product.name}</p>
                                    <p className="product-item-price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</p>
                                </div>
                                <button className="send-info-btn" onClick={() => sendProductCard(product)}>Send</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {activeTool === 'faq' && (
                <div className="faq-list">
                    <h4>FAQs</h4>
                    {faqItems.map((faq, index) => (
                        <div key={index} className="faq-item">
                            <p><strong>Q:</strong> {faq.question}</p>
                            <button onClick={() => sendMessage({ messageType: 'text', content: faq.answer })}>Send Answer</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="pharmacist-chat-container">
      {renderUserList()}
      {renderChatArea()}
      {renderSupportTools()}
    </div>
  );
};

export default PharmacistChat;