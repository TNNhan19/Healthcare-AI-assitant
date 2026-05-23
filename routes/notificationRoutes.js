const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

// List notifications for current user or by role
router.use(authMiddleware);
router.get('/', notificationController.listNotifications);
router.patch('/:id/read', notificationController.markRead);
// Clear notifications for current user or role (mark read)
router.post('/clear', notificationController.clearNotifications);

module.exports = router;
