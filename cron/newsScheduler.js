const cron = require('node-cron');
const HealthNews = require('../models/healthNewsModel');
const axios = require('axios');

// Hàm để lấy và lưu tin tức từ API
const fetchAndSaveNewsFromApi = async () => {
  try {
    console.log('🔄 Đang tải tin tức từ News API...');
    
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
    
    console.log(`✅ Hoàn thành cập nhật tin tức: ${savedCount} bài mới, ${existingCount} bài đã tồn tại.`);
    
    return {
      success: true,
      savedCount,
      existingCount,
      totalCount: newsArticles.length
    };
  } catch (error) {
    console.error('❌ Lỗi khi tự động cập nhật tin tức:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Lịch chạy cron job: 8 giờ sáng mỗi ngày
// Format: phút giờ ngày tháng thứ
const scheduleNewsUpdate = () => {
  // Schedule tác vụ chạy lúc 8:00 sáng mỗi ngày
  cron.schedule('0 8 * * *', async () => {
    console.log('🕗 Bắt đầu cập nhật tin tức tự động...');
    await fetchAndSaveNewsFromApi();
  });
  
  console.log('📅 Đã lên lịch cập nhật tin tức tự động lúc 8:00 sáng mỗi ngày');
};

// Khởi động ngay khi chạy server (tùy chọn)
const initializeNewsData = async () => {
  try {
    // Kiểm tra xem đã có tin tức nào trong DB chưa
    const newsCount = await HealthNews.countDocuments();
    
    // Nếu chưa có tin tức nào, tải từ API
    if (newsCount === 0) {
      console.log('🏁 Khởi tạo dữ liệu tin tức lần đầu...');
      await fetchAndSaveNewsFromApi();
    } else {
      console.log(`✓ DB đã có ${newsCount} tin tức, không cần khởi tạo`);
    }
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo dữ liệu tin tức:', error);
  }
};

module.exports = { 
  scheduleNewsUpdate, 
  initializeNewsData,
  fetchAndSaveNewsFromApi
};