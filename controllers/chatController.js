const Conversation = require('../models/conversationModel');
const User = require('../models/userModel'); // Assuming you have a User model

// Get chat history for a specific conversation between a user and a pharmacist
exports.getChatHistory = async (req, res) => {
    const { userId, pharmacistId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'Missing user ID' });
    }

    try {
        // Case 1: User is fetching their entire chat history with all pharmacists
        if (pharmacistId === 'pharmacist') {
            const conversations = await Conversation.find({ participants: userId })
                .sort({ lastMessageAt: 'asc' })
                .populate('messages.senderId', 'userName email userType');

            // Flatten all messages from all conversations into a single history array
            const allMessages = conversations.flatMap(conv => 
                conv.messages.map(msg => ({
                    ...msg.toObject(),
                    // Remap sender 'from' to be consistent for the user's view
                    from: msg.senderId._id.toString() === userId ? userId : 'pharmacist'
                }))
            );
            
            // Sort all messages by timestamp to ensure chronological order
            allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            return res.json({ history: allMessages });
        } 
        
        // Case 2: A specific conversation history is requested (e.g., by a pharmacist)
        else if (pharmacistId) {
            const conversation = await Conversation.findOne({
                participants: { $all: [userId, pharmacistId] }
            }).populate('messages.senderId', 'userName email');

            if (!conversation) {
                return res.json({ history: [] });
            }
            // Map senderId for pharmacist's view
            const history = conversation.messages.map(msg => ({
                ...msg.toObject(),
                role: msg.senderId._id.toString() === pharmacistId ? 'pharmacist' : 'user'
            }));
            return res.json({ history });
        }

        return res.status(400).json({ error: 'Invalid request parameters' });

    } catch (err) {
        console.error('Error fetching chat history:', err);
        res.status(500).json({ error: 'Error fetching chat history' });
    }
};

// Get all conversations for a specific pharmacist
exports.getPharmacistConversations = async (req, res) => {
    const { pharmacistId } = req.params;
    if (!pharmacistId) {
        return res.status(400).json({ error: 'Missing pharmacistId' });
    }
    try {
        const conversations = await Conversation.find({ participants: pharmacistId })
            .populate('participants', 'userName email userType')
            .sort({ lastMessageAt: -1 });

        // Format the response to be easily consumable by the frontend
        const formattedConversations = conversations.map(conv => {
            const otherParticipant = conv.participants.find(p => p._id.toString() !== pharmacistId);
            return {
                conversationId: conv._id,
                user: {
                    id: otherParticipant._id,
                    email: otherParticipant.email,
                    name: otherParticipant.userName
                },
                lastMessage: conv.messages[conv.messages.length - 1] || null
            };
        });

        res.json({ conversations: formattedConversations });
    } catch (err) {
        console.error('Error fetching pharmacist conversations:', err);
        res.status(500).json({ error: 'Error fetching conversations' });
    }
};
