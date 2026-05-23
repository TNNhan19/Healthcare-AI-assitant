const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.get('/available-slots', appointmentController.getAvailableTimeSlots);

// Protected routes
router.use(authMiddleware);

// Admin routes (cần đặt trước param routes)
router.get('/admin/statistics', appointmentController.getAppointmentStatistics);
router.get('/admin/all', appointmentController.listAllAppointments);

// Create new appointment
router.post('/', appointmentController.createAppointment);

// Get user's appointments
router.get('/', appointmentController.getUserAppointments);

// Get appointment by ID
router.get('/:appointmentId', appointmentController.getAppointmentById);

// Update appointment
router.put('/:appointmentId', appointmentController.updateAppointment);

// Cancel appointment
router.patch('/:appointmentId/cancel', appointmentController.cancelAppointment);

module.exports = router;
