const axios = require('axios');
const mongoose = require('mongoose');
const HealthNews = require('../models/healthNewsModel');

// Lấy tin tức trực tiếp từ API (giữ lại cho tương thích ngược)
const getHealthNews = async (req, res) => {
  try {
    const API_KEY = process.env.VITE_NEWS_API_KEY || '9e6216cf85d24c568f07a0ccfb209d1f';
    const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&category=health&apiKey=${API_KEY}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tin tức từ API và lưu vào cơ sở dữ liệu
const fetchAndSaveNews = async (req, res) => {
  try {
    // Lấy tin tức mới từ API
    const API_KEY = process.env.VITE_NEWS_API_KEY || '9e6216cf85d24c568f07a0ccfb209d1f';
    const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&category=health&apiKey=${API_KEY}`);
    const newsArticles = response.data.articles;
    
    // Đếm số bài viết đã xử lý và lưu thành công
    let savedCount = 0;
    let existingCount = 0;
    
    // Biến đổi dữ liệu và lưu vào database
    for (const article of newsArticles) {
      // Kiểm tra xem bài viết đã tồn tại trong DB chưa (dựa vào URL)
      const existingArticle = await HealthNews.findOne({ url: article.url });
      
      if (!existingArticle) {
        // Tạo bài viết mới
        const healthNews = new HealthNews({
          title: article.title,
          description: article.description,
          content: article.content,
          urlToImage: article.urlToImage,
          source: {
            id: article.source?.id || null,
            name: article.source?.name || 'Unknown Source'
          },
          author: article.author,
          publishedAt: article.publishedAt || new Date(),
          url: article.url,
          category: 'Health' // Mặc định là Health, có thể thay đổi sau
        });
        
        // Lưu vào DB
        await healthNews.save();
        savedCount++;
      } else {
        existingCount++;
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Đã tải ${newsArticles.length} bài viết. Lưu mới ${savedCount} bài, ${existingCount} bài đã tồn tại.`
    });
  } catch (error) {
    console.error('Lỗi khi tải và lưu tin tức:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải và lưu tin tức',
      error: error.message
    });
  }
};

// Lấy tất cả tin tức từ cơ sở dữ liệu với phân trang và lọc
const getAllHealthNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Lọc theo danh mục nếu có
    const filter = { isActive: true };
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Query với phân trang
    const news = await HealthNews.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Đếm tổng số bài viết để phân trang
    const total = await HealthNews.countDocuments(filter);
    
    return res.status(200).json({
      success: true,
      data: news,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy tin tức sức khỏe:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tin tức sức khỏe',
      error: error.message
    });
  }
};

// Lấy chi tiết một tin tức theo ID hoặc slug
const getHealthNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem id có phải là ObjectId hợp lệ không
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, isActive: true };
    } else {
      query = { slug: id, isActive: true };
    }
    
    const news = await HealthNews.findOne(query);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin tức'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết tin tức:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết tin tức',
      error: error.message
    });
  }
};

// Lấy danh sách các danh mục tin tức
const getHealthNewsCategories = async (req, res) => {
  try {
    // Lấy tất cả các danh mục duy nhất từ tin tức
    const categories = await HealthNews.distinct('category', { isActive: true });
    
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh mục tin tức:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh mục tin tức',
      error: error.message
    });
  }
};

module.exports = { 
  getHealthNews,
  fetchAndSaveNews,
  getAllHealthNews,
  getHealthNewsById,
  getHealthNewsCategories
};