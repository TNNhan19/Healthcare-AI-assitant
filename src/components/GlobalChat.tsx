import React, { useState } from 'react';
import DraggableBubble from './chat/DraggableBubble';
import ChatPopupWindow from './chat/ChatPopupWindow';
import { useAuth } from '../context/AuthContext';

const GlobalChat: React.FC = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();
    const [bubblePosition, setBubblePosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });

    const chatUser = user
        ? {
            id: user._id || '',
            name: user.userName || user.nickname || user.email || 'User',
            token: localStorage.getItem('user_token') || localStorage.getItem('admin_token') || localStorage.getItem('pharmacist_token') || '',
            role: user.userType || (user as any).usertype || 'client',
        }
        : null;

    const handleBubbleClick = () => {
        setIsChatOpen(prev => !prev);
        if (!isChatOpen) {
            setUnreadCount(0);
        }
    };

    const handleNewMessage = () => {
        if (!isChatOpen) {
            setUnreadCount(prev => prev + 1);
        }
    };

    const handleCloseChatWindow = () => {
        setIsChatOpen(false);
    };
    
    const handleDragEnd = (position: { x: number; y: number }) => {
        setBubblePosition(position);
    };

    // Do not render the bubble chat for pharmacists
    if (!chatUser || chatUser.role === 'pharmacist') {
        return null;
    }

    return (
        <>
            {isChatOpen && (
                <ChatPopupWindow
                    isOpen={isChatOpen}
                    onClose={handleCloseChatWindow}
                    user={chatUser}
                    onNewMessage={handleNewMessage}
                />
            )}
            <DraggableBubble
                onClick={handleBubbleClick}
                unreadMessages={unreadCount}
                position={bubblePosition}
                onDragEnd={handleDragEnd}
            />
        </>
    );
};

export default GlobalChat;
