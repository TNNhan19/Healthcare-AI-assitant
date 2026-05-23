import axios from 'axios';
import { API_BASE_URL } from '../config';

// Interface định nghĩa cấu trúc dữ liệu tin tức sức khỏe
export interface HealthNews {
  _id: string;
  title: string;
  description: string;
  content: string;
  urlToImage: string;
  source: {
    id: string;
    name: string;
  };
  author: string;
  publishedAt: Date;
  url: string;
  category: string;
  slug: string;
  isActive: boolean;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Service class để gọi API tin tức sức khỏe
class HealthNewsService {
  // Lấy danh sách tin tức với phân trang và lọc
  async getHealthNews(params?: { page?: number, limit?: number, category?: string }) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/health-news`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching health news:', error);
      throw error;
    }
  }

  // Lấy tin tức từ API trực tiếp (phương thức cũ)
  async getNewsFromDirectApi() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/health-news/direct-api`);
      return response.data;
    } catch (error) {
      console.error('Error fetching news from direct API:', error);
      throw error;
    }
  }

  // Lấy chi tiết một tin tức theo ID hoặc slug
  async getHealthNewsById(id: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/health-news/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching health news with id ${id}:`, error);
      throw error;
    }
  }

  // Lấy danh sách các danh mục tin tức
  async getHealthNewsCategories() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/health-news/categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching health news categories:', error);
      throw error;
    }
  }
  
  // Admin: Lấy tin tức từ News API và lưu vào database
  async fetchFromNewsApi() {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/health-news/fetch-from-api`);
      return response.data;
    } catch (error) {
      console.error('Error fetching from News API:', error);
      throw error;
    }
  }
}

export const healthNewsService = new HealthNewsService();
export default healthNewsService;