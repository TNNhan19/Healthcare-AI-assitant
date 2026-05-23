const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Admin/pharmacist routes (đặt trước các route có parameter để tránh conflict)
router.get('/admin/statistics', requireRole(['admin']), orderController.getOrderStatistics);
router.get('/admin/all', requireRole(['admin','pharmacist']), orderController.listAllOrders);

// Get user statistics (for admin to view user details)
router.get('/user/:userId/stats', requireRole(['admin']), orderController.getUserStats);

// Create new order
router.post('/create', orderController.createOrder);

// Get user's order history
router.get('/', orderController.getUserOrders);

// Cancel order
router.patch('/:orderId/cancel', orderController.cancelOrder);

// Reorder an existing order
router.post('/:orderId/reorder', orderController.reorder);

// Update order details (edit before processing)
router.patch('/:orderId', orderController.updateOrderDetails);

// Get order by ID
router.get('/:orderId', orderController.getOrderById);

// Admin/pharmacist routes với parameters
router.patch('/:orderId/status', requireRole(['admin','pharmacist']), orderController.updateOrderStatus);
router.put('/:id/cancel', requireRole(['user', 'admin', 'pharmacist']), orderController.cancelOrder);

module.exports = router;

// ...existing code...
