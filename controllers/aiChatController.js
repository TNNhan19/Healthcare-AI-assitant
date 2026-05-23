const AIConversation = require('../models/aiConversationModel');
const axios = require('axios');
const mongoose = require('mongoose');

// --- Helper Functions ---
const getOrCreateConversation = async (userId, conversationId) => {
    // If a valid conversationId is provided, try to find it.
    if (conversationId) {
        // Ensure it's a valid ObjectId to prevent CastError
        if (mongoose.Types.ObjectId.isValid(conversationId)) {
            const conversation = await AIConversation.findOne({ _id: conversationId, userId });
            if (conversation) return conversation;
        }
    }
    // If no ID is provided, or if the provided ID is invalid or doesn't belong to the user,
    // create a new conversation.
    return AIConversation.create({ userId, messages: [] });
};

// --- API Controllers ---

// POST /api/v1/ai-chat/save
exports.saveAiChat = async (req, res) => {
    const userId = req.user.id;
    const { conversationId, userMessage, aiMessage } = req.body;

    if (!userMessage || !aiMessage) {
        return res.status(400).json({ error: 'User message and AI message are required.' });
    }

    try {
        const conversation = await getOrCreateConversation(userId, conversationId);

        conversation.messages.push({ from: 'user', content: userMessage });
        conversation.messages.push({ from: 'ai', content: aiMessage });

        // Update title if it's a new conversation
        if (conversation.messages.length === 2) {
            conversation.title = userMessage.substring(0, 50);
        }
        
        await conversation.save();

        res.json({
            success: true,
            conversationId: conversation._id
        });

    } catch (error) {
        console.error('Error saving AI conversation:', error);
        res.status(500).json({ error: 'Failed to save conversation.' });
    }
};

// GET /api/v1/ai-chat/history (Get all conversation summaries for a user)
exports.getAiChatHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        const conversations = await AIConversation.find({ userId })
            .sort({ updatedAt: -1 })
            .select('title updatedAt'); // Only select fields needed for the sidebar

        res.json({ history: conversations });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch AI chat history list.' });
    }
};

// GET /api/v1/ai-chat/history/:conversationId (Get messages for a specific conversation)
exports.getConversationMessages = async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;
    try {
        const conversation = await AIConversation.findOne({ _id: conversationId, userId });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found.' });
        }
        res.json({ messages: conversation.messages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversation messages.' });
    }
};


// DELETE /api/v1/ai-chat/history/:conversationId
exports.clearAiChatHistory = async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;
    try {
        const result = await AIConversation.deleteOne({ _id: conversationId, userId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Conversation not found or you do not have permission to delete it.' });
        }
        res.json({ success: true, message: 'Conversation deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete conversation.' });
    }
};
