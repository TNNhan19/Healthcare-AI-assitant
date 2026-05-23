const WebSocket = require('ws');
const Conversation = require('../models/conversationModel'); // Use the new Conversation model

class WebSocketManager {
    constructor(server) {
        this.wss = new WebSocket.Server({ noServer: true });
        this.clients = new Map();
        this.pharmacists = new Map();
        this.users = new Map();

        server.on('upgrade', (request, socket, head) => {
            const { pathname } = new URL(request.url, `http://${request.headers.host}`);
          
            // ✅ Chỉ chấp nhận WebSocket ở đường dẫn /ws/chat
            if (pathname === '/ws/chat') {
              this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, request);
              });
            } else {
              socket.destroy(); // từ chối upgrade ở route khác
            }
          });
        this.setupConnections();
        this.startHeartbeat();
    }

    setupConnections() {
        const jwt = require('jsonwebtoken');
        // Map pharmacistId => Set<userId> (danh sách user đang chat với pharmacist)
        this.pharmacistConversations = new Map();
        this.wss.on('connection', (ws, req) => {
            if (ws.isPharmacist) {
                console.log(`[WS] Pharmacist connected: ${ws.clientId}`);
            } else {
                console.log(`[WS] User connected: ${ws.clientId}`);
            }
            const url = require('url');
            const parsedUrl = url.parse(req.url, true);
            const token = parsedUrl.query.token;
            if (!token) {
                ws.close(4001, 'No token');
                return;
            }
            let user;
            try {
                user = jwt.verify(token, process.env.JWT_SECRET);
                console.log('[WS] Token verified:', user);
            } catch (err) {
                console.log('[WS] Token verify error:', err.message);
                ws.close(4002, 'Invalid token');
                return;
            }
            ws.user = user;
            ws.clientId = user.id;
            ws.isPharmacist = (user.userType === 'pharmacist' || user.usertype === 'pharmacist');
            ws.isAlive = true;

            if (ws.isPharmacist) {
                this.pharmacists.set(ws.clientId, ws);
                // Khởi tạo danh sách hội thoại nếu chưa có
                if (!this.pharmacistConversations.has(ws.clientId)) {
                    this.pharmacistConversations.set(ws.clientId, new Set());
                }
                // Gửi tất cả hội thoại chờ (participants chỉ có user, chưa có pharmacist này)
                (async () => {
                    try {
                        const Conversation = require('../models/conversationModel');
                        // Tìm các conversation chỉ có 1 participant (user) và có message trong 7 ngày gần đây
                        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        const pending = await Conversation.find({ $expr: { $eq: [{ $size: '$participants' }, 1] }, lastMessageAt: { $gte: sevenDaysAgo } });
                        for (const conv of pending) {
                            // Nếu pharmacist này chưa là participant thì thêm vào
                            if (!conv.participants.map(String).includes(String(ws.clientId))) {
                                conv.participants.push(ws.clientId);
                                await conv.save();
                            }
                            // Gửi tóm tắt hội thoại chờ cho pharmacist
                            try {
                                if (ws.readyState === WebSocket.OPEN) {
                                    // Get unread messages for this conversation
                                    const unreadMessages = conv.messages.filter(m => 
                                        !m.status || m.status === 'sent' || m.status === 'delivered'
                                    );

                                    const lastMessage = conv.messages[conv.messages.length - 1];
                                    
                                    ws.send(JSON.stringify({
                                        type: 'pending_conversation',
                                        conversationId: conv._id,
                                        lastMessage: lastMessage ? {
                                            ...lastMessage.toObject(),
                                            isNewMessage: true,
                                            timestamp: lastMessage.timestamp || new Date().toISOString()
                                        } : null,
                                        unreadCount: unreadMessages.length,
                                        participantUserId: conv.participants.find(p => String(p) !== String(ws.clientId)) || null
                                    }));

                                    // Send all unread messages in this conversation
                                    if (unreadMessages.length > 0) {
                                        ws.send(JSON.stringify({
                                            type: 'unread_messages',
                                            conversationId: conv._id,
                                            messages: unreadMessages.map(msg => ({
                                                ...msg.toObject(),
                                                isNewMessage: true,
                                                timestamp: msg.timestamp || new Date().toISOString()
                                            }))
                                        }));
                                    }
                                }
                            } catch (e) {
                                console.error('Error notifying pharmacist about pending conversation', e.message || e);
                            }
                        }
                    } catch (e) {
                        console.error('Error while attaching pharmacist to pending conversations', e.message || e);
                    }
                })();
            } else {
                this.users.set(ws.clientId, ws);
                // When a user connects, deliver any pending messages sent to them while they were offline
                (async () => {
                    try {
                        const userId = ws.clientId;
                        // Find conversations where this user is a participant and there are messages from others with status != 'read'
                        const pendingConvs = await Conversation.find({ participants: userId });
                        for (const conv of pendingConvs) {
                            // collect messages that are from others and not read
                            const unreadMsgs = conv.messages.filter(m => String(m.senderId) !== String(userId) && m.status !== 'read');
                            if (unreadMsgs.length > 0) {
                                // send unread messages to user
                                try {
                                    if (ws.readyState === WebSocket.OPEN) {
                                        ws.send(JSON.stringify({ type: 'pending_messages', conversationId: conv._id, messages: unreadMsgs }));
                                    }
                                } catch (e) {
                                    console.error('Error sending pending messages to user', e.message || e);
                                }

                                // mark them as delivered
                                let changed = false;
                                for (const m of conv.messages) {
                                    if (String(m.senderId) !== String(userId) && m.status === 'sent') {
                                        m.status = 'delivered';
                                        changed = true;
                                    }
                                }
                                if (changed) {
                                    await conv.save();
                                    // notify other participants (e.g., pharmacists) about delivery
                                    for (const participantId of conv.participants) {
                                        const pid = String(participantId);
                                        if (pid === String(userId)) continue;
                                        const pws = this.pharmacists.get(pid) || this.users.get(pid);
                                        if (pws && pws.readyState === WebSocket.OPEN) {
                                            try {
                                                pws.send(JSON.stringify({ type: 'message_status_update', conversationId: conv._id, status: 'delivered' }));
                                            } catch (e) {}
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Error delivering pending messages on user connect', e.message || e);
                    }
                })();
            }

            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleMessage(ws, data);
                } catch (error) {
                    console.error('Message handling error:', error);
                    this.sendError(ws, 'Invalid message format');
                }
            });

            ws.on('close', () => {
                if (ws.isPharmacist) {
                    console.log(`[WS] Pharmacist disconnected: ${ws.clientId}`);
                } else {
                    console.log(`[WS] User disconnected: ${ws.clientId}`);
                }
                this.handleDisconnection(ws);
            });
        });
    }

    startHeartbeat() {
        setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    this.handleDisconnection(ws);
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    }

    async handleMessage(ws, data) {
        // User sends a message to a pharmacist
        if (data.type === 'user_message' && !ws.isPharmacist) {
            const pharmacistsArr = Array.from(this.pharmacists.values()).filter(p => p.readyState === WebSocket.OPEN);

            const newMessage = {
                senderId: ws.clientId,
                senderEmail: ws.user.email,
                messageType: 'text', // Assume text for user messages for now
                message: data.message,
                attachments: data.attachments || []
            };

            try {
                // Persist the message in Conversation regardless of pharmacist availability
                let conversation = null;

                // If there is at least one pharmacist online, try to link to that pharmacist, otherwise create conversation with user only and let pharmacist join later
                if (pharmacistsArr.length > 0) {
                    const pharmacist = pharmacistsArr[0];
                    conversation = await Conversation.findOne({ participants: { $all: [ws.clientId, pharmacist.clientId] } });
                    if (conversation) {
                        conversation.messages.push(newMessage);
                        conversation.lastMessageAt = new Date();
                        await conversation.save();
                    } else {
                        conversation = await Conversation.create({
                            participants: [ws.clientId, pharmacist.clientId],
                            messages: [newMessage]
                        });
                    }

                    // forward to the connected pharmacist
                    try {
                        pharmacist.send(JSON.stringify({
                            type: 'user_message',
                            from: { id: ws.clientId, email: ws.user.email },
                            message: data.message,
                            conversationId: conversation._id,
                            timestamp: new Date().toISOString(), // Add timestamp
                            status: 'delivered',
                            isNewMessage: true, // Flag for new message notification
                            messageId: conversation.messages[conversation.messages.length - 1]._id // Add messageId
                        }));
                    } catch (e) {
                        console.error('Error forwarding user_message to pharmacist via WS:', e.message || e);
                    }
                } else {
                    // No pharmacist online: create or append to a conversation with only the user as participant
                    conversation = await Conversation.findOne({ participants: { $all: [ws.clientId] } });
                    if (conversation) {
                        conversation.messages.push(newMessage);
                        conversation.lastMessageAt = new Date();
                        await conversation.save();
                    } else {
                        conversation = await Conversation.create({ participants: [ws.clientId], messages: [newMessage] });
                    }

                    // Try push fallback to pharmacists
                    try {
                        const pushService = require('./pushService');
                        const User = require('../models/userModel');
                        const pharmacists = await User.find({ userType: 'pharmacist', 'pushSubscriptions.0': { $exists: true } }).lean();
                        for (const ph of pharmacists) {
                            try {
                                await pushService.sendNotificationToUser(ph._id, { title: 'Tin nhắn mới', body: data.message || 'Bạn có một tin nhắn mới', data: { from: ws.clientId, conversationId: conversation._id } });
                            } catch (e) {
                                console.error('Push to pharmacist failed', e);
                            }
                        }
                    } catch (e) {
                        console.warn('pushService not available or error while trying to notify pharmacists:', e.message || e);
                    }

                    // Inform sender that message is queued for pharmacists
                    try {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'queued', message: 'Message saved and will be delivered to pharmacists when available', conversationId: conversation._id }));
                        }
                    } catch (e) {}
                }
            } catch (err) {
                console.error('Error saving user message:', err);
                this.sendError(ws, 'Could not send message.');
            }
        }
        // Pharmacist replies to a user
        else if (data.type === 'pharmacist_reply' && ws.isPharmacist) {
            console.log('Received pharmacist reply:', data); // Debug log

            // Get message content from either content or message field
            const messageContent = data.content || data.message;

            // Validate and build the message
            if (data.messageType === 'text' && !messageContent) {
                this.sendError(ws, 'Text messages must include a message content');
                return;
            }

            // Build the message and persist it first so it's available for delivery later
            const newMessage = {
                senderId: ws.clientId,
                senderEmail: ws.user.email,
                messageType: data.messageType || 'text',
                message: data.messageType === 'text' ? messageContent : '',
                productCard: data.messageType === 'product' ? data.productCard : undefined,
                attachments: data.attachments || [],
                status: 'sent'
            };

            try {
                // find or create conversation and append the message
                let conversation = await Conversation.findOne({ participants: { $all: [ws.clientId, data.toUserId] } });
                if (conversation) {
                    conversation.messages.push(newMessage);
                    conversation.lastMessageAt = new Date();
                    await conversation.save();
                } else {
                    conversation = await Conversation.create({ participants: [ws.clientId, data.toUserId], messages: [newMessage] });
                }

                // Retrieve the saved message subdocument (should be the last one)
                const savedMessage = conversation.messages[conversation.messages.length - 1];

                const userSocket = this.users.get(data.toUserId);

                if (userSocket && userSocket.readyState === WebSocket.OPEN) {
                    // Try to deliver immediately over WS
                    try {
                        const messageToSend = {
                            type: 'pharmacist_reply',
                            conversationId: conversation._id,
                            messageId: savedMessage._id,
                            from: ws.clientId,
                            message: savedMessage.message, // This will contain the message from either content or message field
                            messageType: savedMessage.messageType,
                            productCard: savedMessage.productCard,
                            attachments: savedMessage.attachments || [],
                            timestamp: new Date().toISOString(),
                            status: 'delivered'
                        };
                        console.log('Sending message to user:', messageToSend); // Debug log
                        userSocket.send(JSON.stringify(messageToSend));

                        // mark as delivered and persist
                        savedMessage.status = 'delivered';
                        await conversation.save();

                        // notify participants about message delivery (include message id)
                        for (const participantId of conversation.participants) {
                            const pid = String(participantId);
                            if (pid === String(data.toUserId)) continue; // don't notify the recipient
                            const pws = this.pharmacists.get(pid) || this.users.get(pid);
                            if (pws && pws.readyState === WebSocket.OPEN) {
                                try {
                                    pws.send(JSON.stringify({ type: 'message_status_update', conversationId: conversation._id, messageId: savedMessage._id, status: 'delivered' }));
                                } catch (e) {
                                    // ignore send errors to other sockets
                                }
                            }
                        }

                        // Acknowledge to pharmacist that message was sent & delivered
                        if (ws.readyState === WebSocket.OPEN) {
                            try { ws.send(JSON.stringify({ type: 'reply_sent', conversationId: conversation._id, message: savedMessage })); } catch (e) {}
                        }
                    } catch (e) {
                        console.error('Error delivering pharmacist reply over WS', e.message || e);
                        // We'll fallback to push below
                    }
                } else {
                    // User offline: attempt push fallback so they get notified, but message is persisted as 'sent' for later delivery
                    try {
                        const pushService = require('./pushService');
                        (async () => {
                            try {
                                await pushService.sendNotificationToUser(data.toUserId, { title: 'Tin nhắn mới từ dược sĩ', body: data.message || 'Bạn có tin nhắn mới', data: { from: ws.clientId, conversationId: conversation._id, messageId: savedMessage._id } });
                            } catch (e) {
                                console.error('Push to user failed', e.message || e);
                            }
                        })();
                    } catch (e) {
                        console.warn('pushService not available or error', e.message || e);
                    }

                    // Inform pharmacist that reply was saved (queued)
                    if (ws.readyState === WebSocket.OPEN) {
                        try { ws.send(JSON.stringify({ type: 'reply_saved', conversationId: conversation._id, message: savedMessage })); } catch (e) {}
                    }
                }
            } catch (err) {
                console.error('Error saving pharmacist reply:', err);
                this.sendError(ws, 'Could not send reply.');
            }
        }
        // Client requests to mark messages read in a conversation
        else if (data.type === 'mark_read' && data.conversationId && data.userId) {
            try {
                const conv = await Conversation.findById(data.conversationId);
                if (!conv) return;
                let changed = false;
                for (const m of conv.messages) {
                    if (String(m.senderId) !== String(data.userId) && m.status !== 'read') {
                        m.status = 'read';
                        changed = true;
                    }
                }
                if (changed) {
                    await conv.save();
                    // notify all participants about read status
                    for (const participantId of conv.participants) {
                        const pid = String(participantId);
                        const pws = this.pharmacists.get(pid) || this.users.get(pid);
                        if (pws && pws.readyState === WebSocket.OPEN) {
                            try {
                                pws.send(JSON.stringify({ type: 'message_status_update', conversationId: conv._id, status: 'read' }));
                            } catch (e) {}
                        }
                    }
                }
            } catch (e) {
                console.error('Error handling mark_read', e.message || e);
            }
        }
    }

    handleDisconnection(ws) {
        if (ws.isPharmacist) {
            this.pharmacists.delete(ws.clientId);
        } else {
            this.users.delete(ws.clientId);
        }
    }

    sendError(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'error',
                message: message
            }));
        }
    }
    getPharmacistSocket() {
        // Lấy một pharmacist bất kỳ đang online
        for (const pharmacist of this.pharmacists.values()) {
            if (pharmacist.readyState === WebSocket.OPEN) return pharmacist;
        }
        return null;
    }
}

module.exports = WebSocketManager;
