const express = require('express');
const {
    createProductController,
    getAllProductsController,
    getProductByIdController,
    getProductCategoriesController,
    getMainCategoriesController,
    getSubcategoriesController,
    deleteProductController,
    updateProductController,
    getProductsByCategoryController,
    incrementViewCountController,
    searchProductsController
} = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

const router = express.Router();

// Get all products with pagination and search
router.get('/', getAllProductsController);
router.get('/category/:category', getProductsByCategoryController);

// Categories phải để trước
router.get('/categories/all', getProductCategoriesController);
router.get('/categories/main', getMainCategoriesController);
router.get('/categories/sub/:mainCategory', getSubcategoriesController);
router.get('/search', searchProductsController);
// Get product by ID (để cuối cùng)
router.get('/:id', getProductByIdController);

// Create new product
router.post('/create', authMiddleware, requireRole(['admin','pharmacist']), createProductController);

// Update product
router.put('/:id', authMiddleware, requireRole(['admin','pharmacist']), updateProductController);

// Delete product
router.delete('/:id', authMiddleware, requireRole(['admin','pharmacist']), deleteProductController);

// Cập nhật lượt xem
router.post('/:id/view', incrementViewCountController);

module.exports = router;
