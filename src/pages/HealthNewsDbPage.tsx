import React, { useState, useEffect } from 'react';
import healthNewsService, { HealthNews } from '../services/healthNewsService';
import { Link } from 'react-router-dom';
import { Calendar, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Component phân trang
const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  const maxPagesToShow = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      
      {startPage > 1 && (
        <>
          <button 
            onClick={() => onPageChange(1)} 
            className="px-3 py-1 rounded-md hover:bg-gray-100"
          >
            1
          </button>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}
      
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded-md ${
            currentPage === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <button 
            onClick={() => onPageChange(totalPages)} 
            className="px-3 py-1 rounded-md hover:bg-gray-100"
          >
            {totalPages}
          </button>
        </>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

// Component hiển thị thẻ danh mục
const CategoryFilter: React.FC<{
  categories: string[];
  selected: string;
  onChange: (category: string) => void;
}> = ({ categories, selected, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className={`px-3 py-1 text-sm rounded-full ${
          selected === '' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
        }`}
        onClick={() => onChange('')}
      >
        Tất cả
      </button>
      
      {categories.map(category => (
        <button
          key={category}
          className={`px-3 py-1 text-sm rounded-full ${
            selected === category ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

// Component thẻ tin tức
const NewsCard: React.FC<{ news: HealthNews }> = ({ news }) => {
  const formatDate = (date: Date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/health-news-db/${news._id}`}>
        {news.urlToImage && (
          <img
            src={news.urlToImage}
            alt={news.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/640x360?text=Health+News';
            }}
          />
        )}
        
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{news.title}</h3>
          
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{news.description}</p>
          
          <div className="flex flex-wrap items-center text-xs text-gray-500 gap-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(news.publishedAt)}</span>
            </div>
            
            {news.author && (
              <div className="flex items-center gap-1">
                <span>By {news.author}</span>
              </div>
            )}
            
            {news.category && (
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                <span>{news.category}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

const HealthNewsDbPage: React.FC = () => {
  const [news, setNews] = useState<HealthNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 12
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Hàm lấy danh sách tin tức
  const fetchNews = async (page = 1, category = selectedCategory) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = { 
        page, 
        limit: pagination.limit,
        ...(category && { category })
      };
      
      const res = await healthNewsService.getHealthNews(params);
      
      if (res.success) {
        setNews(res.data);
        setPagination({
          ...pagination,
          currentPage: res.pagination.currentPage,
          totalPages: res.pagination.totalPages,
          total: res.pagination.total
        });
      } else {
        setError('Không thể tải tin tức. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi khi tải tin tức sức khỏe:', error);
      setError('Đã xảy ra lỗi khi tải tin tức. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      const res = await healthNewsService.getHealthNewsCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh mục tin tức:', error);
    }
  };

  // Handler cho việc thay đổi trang
  const handlePageChange = (page: number) => {
    fetchNews(page);
  };

  // Handler cho việc thay đổi danh mục
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchNews(1, category);
  };

  // Handler để thủ công tải tin tức từ News API (chỉ cho admin)
  const handleFetchFromNewsApi = async () => {
    try {
      setLoading(true);
      const res = await healthNewsService.fetchFromNewsApi();
      alert(`Đã tải tin tức từ News API: ${res.message || JSON.stringify(res)}`);
      // Làm mới danh sách tin tức sau khi tải
      fetchNews();
    } catch (error) {
      console.error('Lỗi khi tải tin tức từ News API:', error);
      alert('Lỗi khi tải tin tức từ News API. Có thể bạn không có quyền hoặc API không khả dụng.');
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi component được mount
  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tin tức sức khỏe (Database)</h1>
        <p className="text-gray-600">Cập nhật thông tin mới nhất về sức khỏe và y tế</p>
      </div>
      
      {/* Admin actions */}
      <div className="mb-6">
        <button 
          onClick={handleFetchFromNewsApi}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          Tải tin tức từ News API
        </button>
      </div>
      
      {/* Filter theo danh mục */}
      {categories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Danh mục</h2>
          <CategoryFilter 
            categories={categories} 
            selected={selectedCategory} 
            onChange={handleCategoryChange} 
          />
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg text-center">
          {error}
        </div>
      ) : news.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">Không tìm thấy tin tức nào. Bạn có thể tải tin tức từ News API bằng nút phía trên.</p>
        </div>
      ) : (
        <>
          {/* Grid hiển thị danh sách tin tức */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map(item => (
              <NewsCard key={item._id} news={item} />
            ))}
          </div>
          
          {/* Phân trang */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default HealthNewsDbPage;