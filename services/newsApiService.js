const axios = require('axios');
require('dotenv').config();

// Khóa API từ biến môi trường
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2';

// Danh sách các nguồn tin tức y tế để tìm kiếm
const HEALTH_SOURCES = [
  'medical-news-today',
  'healthline',
  'webmd'
];

/**
 * Service để tương tác với News API
 */
class NewsApiService {
  /**
   * Tìm kiếm các tin tức liên quan đến sức khỏe
   */
  async fetchHealthNews() {
    try {
      // Sử dụng các từ khóa về sức khỏe và y tế để tìm kiếm
      const healthKeywords = 'health OR healthcare OR medical OR medicine OR wellness OR disease OR treatment OR nutrition OR fitness OR mental health';
      
      // Sử dụng API để tìm kiếm tin tức liên quan đến sức khỏe từ nguồn tiếng Anh
      const response = await axios.get(`${NEWS_API_URL}/everything`, {
        params: {
          q: healthKeywords,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 100, // Lấy tối đa 100 bài viết
          apiKey: NEWS_API_KEY
        }
      });
      
      if (response.data && response.data.articles) {
        return response.data.articles;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching news from News API:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Tìm kiếm tin tức hàng đầu về sức khỏe
   */
  async fetchTopHealthNews() {
    try {
      // Tìm kiếm tin tức hàng đầu về sức khỏe trong nước
      const response = await axios.get(`${NEWS_API_URL}/top-headlines`, {
        params: {
          category: 'health',
          country: 'us', // Có thể thay đổi mã quốc gia
          pageSize: 20,
          apiKey: NEWS_API_KEY
        }
      });

      if (response.data && response.data.articles) {
        return response.data.articles;
      }

      return [];
    } catch (error) {
      console.error('Error fetching top health news:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new NewsApiService();