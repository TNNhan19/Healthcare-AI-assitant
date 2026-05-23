const userModel = require('../models/userModel');
const productModel = require('../models/productModel');

// Get user's wishlist
const getWishlistController = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).populate('wishlist');
        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).send({
            success: true,
            wishlist: user.wishlist
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error fetching wishlist',
            error: error.message
        });
    }
};

// Add to wishlist
const addToWishlistController = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId);
            await user.save();
        }
        res.status(200).json({ success: true, message: 'Added to wishlist' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding to wishlist', error });
    }
};

// Remove from wishlist
const removeFromWishlistController = async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.wishlist = user.wishlist.filter(item => item.toString() !== productId);
        await user.save();
        res.status(200).json({ success: true, message: 'Removed from wishlist' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error removing from wishlist', error });
    }
};


module.exports = {
    getWishlistController,
    addToWishlistController,
    removeFromWishlistController
};