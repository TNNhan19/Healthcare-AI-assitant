const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// API lấy lịch sử hội thoại giữa user và pharmacist
router.get('/history', chatController.getChatHistory);

// API lấy danh sách các cuộc hội thoại của dược sĩ
router.get('/conversations/:pharmacistId', chatController.getPharmacistConversations);

module.exports = router;
