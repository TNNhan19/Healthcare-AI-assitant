const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
router.get('/',requireRole(['admin','pharmacist']), stockController.getStockEntries);
router.post('/',requireRole(['admin','pharmacist']), stockController.createStockEntry);
router.put('/:id',requireRole(['admin','pharmacist']), stockController.updateStockEntry);

module.exports = router;
