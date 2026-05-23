const express = require('express');
const router = express.Router();
const {
    handleAiChat,
    getAiChatHistory,
    getConversationMessages, // Import new controller
    clearAiChatHistory,
    saveAiChat // Import new controller
} = require('../controllers/aiChatController');
const authMiddleware = require('../middlewares/authMiddleware');

// Use authentication middleware for all AI chat routes
router.use(authMiddleware);

// POST a message to a conversation (this route is now for saving)
router.post('/save', saveAiChat);

// GET the list of all conversation summaries
router.get('/history', getAiChatHistory);

// GET all messages for a specific conversation
router.get('/history/:conversationId', getConversationMessages);

// DELETE a specific conversation
router.delete('/history/:conversationId', clearAiChatHistory);

module.exports = router;
