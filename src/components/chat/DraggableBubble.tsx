import React from 'react';

interface ChatBubbleProps {
    onClick: () => void;
    unreadMessages: number;
    position: { x: number; y: number };
    onDragEnd: (position: { x: number; y: number }) => void;
}

const DraggableBubble: React.FC<ChatBubbleProps> = ({ onClick, unreadMessages, position, onDragEnd }) => {
    const bubbleRef = React.useRef<HTMLDivElement>(null);
    const dragInfo = React.useRef({
        isDragging: false,
        wasDragged: false,
        startX: 0,
        startY: 0,
        initialLeft: 0,
        initialTop: 0,
    });

    const onMouseDown = (e: React.MouseEvent) => {
        if (!bubbleRef.current) return;
        
        dragInfo.current.isDragging = true;
        dragInfo.current.wasDragged = false;
        dragInfo.current.startX = e.clientX;
        dragInfo.current.startY = e.clientY;
        dragInfo.current.initialLeft = position.x;
        dragInfo.current.initialTop = position.y;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!dragInfo.current.isDragging) return;

        const dx = e.clientX - dragInfo.current.startX;
        const dy = e.clientY - dragInfo.current.startY;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            dragInfo.current.wasDragged = true;
        }

        const bubbleSize = 60;
        let newX = dragInfo.current.initialLeft + dx;
        let newY = dragInfo.current.initialTop + dy;

        // Constrain to viewport
        newX = Math.max(0, Math.min(newX, window.innerWidth - bubbleSize));
        newY = Math.max(0, Math.min(newY, window.innerHeight - bubbleSize));

        if (bubbleRef.current) {
            bubbleRef.current.style.left = `${newX}px`;
            bubbleRef.current.style.top = `${newY}px`;
        }
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (!dragInfo.current.wasDragged) {
            onClick();
        } else if (bubbleRef.current) {
            onDragEnd({
                x: parseInt(bubbleRef.current.style.left),
                y: parseInt(bubbleRef.current.style.top)
            });
        }

        dragInfo.current.isDragging = false;
        dragInfo.current.wasDragged = false;
    };

    React.useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    return (
        <div
            ref={bubbleRef}
            className="chat-bubble-draggable"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                position: 'fixed',
                zIndex: 1000,
                cursor: 'pointer',
                backgroundColor: '#3B82F6',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'transform 0.2s ease',
            }}
            onMouseDown={onMouseDown}
            title="Chat with AI Assistant"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                style={{ width: '32px', height: '32px' }}
            >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8.4 8.4z" />
            </svg>
            {unreadMessages > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        backgroundColor: '#EF4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                    }}
                >
                    {unreadMessages}
                </div>
            )}
        </div>
    );
};

export default DraggableBubble;