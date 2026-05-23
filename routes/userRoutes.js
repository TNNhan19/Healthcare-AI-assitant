const express = require('express');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const {
  getUserController,
  updatePasswordController,
  resetPasswordController,
  deleteAccountController,
  updateUserController,
  adminUpdateUserController,
  addAddressController,
  setDefaultAddressController,
  getAllUsersController,
  createUserController
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Chỉ hỗ trợ các định dạng ảnh: jpeg, jpg, png, gif'));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

// GET USER
router.get('/getUser', authMiddleware, getUserController);
router.get('/', authMiddleware, getAllUsersController);

// CREATE USER (Admin only)
router.post('/create', authMiddleware, createUserController);

// UPDATE USER (Admin only)
router.patch('/:id', authMiddleware, adminUpdateUserController);

// UPDATE USER
// UPDATE PROFILE (with file upload)
// Route to update user profile, handles file upload for profile picture
router.put(
  '/update-user',
  authMiddleware, // Middleware for authentication
  upload.single('profile'), // Middleware for handling single file upload named 'profile'
  [
    // Validation middleware
    body('userName').optional().trim().escape(),
    body('dob').optional().isISO8601().toDate().withMessage('DOB must be a valid date'),
    // Note: 'profile' is uploaded as a file via multer; no URL validation here
  ],
  updateUserController // Controller function to handle the request
);
router.post('/updatePassword', authMiddleware, updatePasswordController);
router.post('/resetPassword', authMiddleware, resetPasswordController);
router.delete('/deleteAccount/:id', authMiddleware, deleteAccountController);
router.post("/address", authMiddleware, addAddressController);
router.patch("/address/default", authMiddleware, setDefaultAddressController);

module.exports = router;