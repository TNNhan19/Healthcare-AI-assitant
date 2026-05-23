import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DraggableBubble from '../components/chat/DraggableBubble';
import ChatPopupWindow from '../components/chat/ChatPopupWindow';
import { useAuth } from '../context/AuthContext';

const ChatPage: React.FC = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Map user from AuthContext to required ChatPopupWindow shape
    const chatUser = user
        ? {
            id: user._id || '',
            name: user.userName || user.nickname || user.email || 'User',
            token: localStorage.getItem('user_token') || localStorage.getItem('admin_token') || localStorage.getItem('pharmacist_token') || '',
            role: user.userType || user.usertype || 'client',
        }
        : null;

    const handleBubbleClick = () => {
        setIsChatOpen(true);
        setUnreadCount(0);
    };

    const handleNewMessage = () => {
        if (!isChatOpen) {
            setUnreadCount(prev => prev + 1);
        }
    };

    const handleCloseChatWindow = () => {
        setIsChatOpen(false);
    };

    // Store the service URL for optional redirect
    const chatbotServiceUrl = (import.meta as any).env?.VITE_CHATBOT_SERVICE_URL;

    const openFullscreenChat = () => {
        if (chatbotServiceUrl) {
            window.open(chatbotServiceUrl, '_blank');
        }
    };

    return (
        <div className="relative h-screen">
            {/* Main Chat Interface */}
            {chatUser && (
                <div className={`flex-1 ${isChatOpen ? 'hidden md:block' : 'hidden'}`}>
                    <div className="h-screen flex flex-col">
                        <div className="flex-1 p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-4">
                                <h1 className="text-2xl font-bold">Health Care Chat</h1>
                                {chatbotServiceUrl && (
                                    <button
                                        onClick={openFullscreenChat}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        Open Full Version
                                    </button>
                                )}
                            </div>
                            <ChatPopupWindow
                                isOpen={true}
                                onClose={() => {}}
                                user={chatUser}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Chat Components */}
            {chatUser && (
                <div className="fixed bottom-4 right-4 flex flex-col items-end space-y-4">
                    {isChatOpen && (
                        <ChatPopupWindow
                            isOpen={true}
                            onClose={handleCloseChatWindow}
                            user={chatUser}
                        />
                    )}
                    <DraggableBubble
                        onClick={handleBubbleClick}
                        unreadMessages={unreadCount}
                        position={{ x: 0, y: 0 }}
                        onDragEnd={() => {}}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatPage;


