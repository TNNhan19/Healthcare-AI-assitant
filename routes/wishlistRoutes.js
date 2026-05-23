const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
    getWishlistController,
    addToWishlistController,
    removeFromWishlistController
} = require('../controllers/wishlistController');

const router = express.Router();

// GET WISHLIST
router.get('/', authMiddleware, getWishlistController);

// ADD TO WISHLIST
router.post('/', authMiddleware, addToWishlistController);

// REMOVE FROM WISHLIST
router.delete('/:productId', authMiddleware, removeFromWishlistController);

module.exports = router;