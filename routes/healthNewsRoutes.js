const express = require('express');
const router = express.Router();
const { 
  getHealthNews,
  fetchAndSaveNews,
  getAllHealthNews,
  getHealthNewsById,
  getHealthNewsCategories
} = require('../controllers/healthNewsController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route công khai - không cần đăng nhập
router.get('/direct-api', getHealthNews); // Route cũ để tương thích ngược
router.get('/', getAllHealthNews); // Lấy tin từ database
router.get('/categories', getHealthNewsCategories); // Lấy danh mục
router.get('/:id', getHealthNewsById); // Lấy chi tiết

// Route bảo vệ - cần quyền admin
router.post('/fetch-from-api', authMiddleware, fetchAndSaveNews); // Lấy tin từ API và lưu vào DB

module.exports = router;