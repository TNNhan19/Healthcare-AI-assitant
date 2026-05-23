import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import './HealthNewsPage.css'; // Import the new CSS file
import { Link } from "react-router-dom";

interface Article {
  source: {
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  content: string;
}

const HealthNewsPage: React.FC = () => {
  const [topHeadlines, setTopHeadlines] = useState<Article[]>([]);
  const [allNews, setAllNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 6;
  const maxArticles = 50;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const NEWS_API_BASE = (import.meta as any).env?.VITE_NEWS_API_BASE_URL || 'http://localhost:5173';
        const response = await fetch(`${NEWS_API_BASE}/api/v1/health-news`);
        const data = await response.json();
        
        if (response.ok) {
          // Kiểm tra data.articles có tồn tại không
          if (data.articles && Array.isArray(data.articles)) {
            setAllNews(data.articles);
            setTopHeadlines(data.articles.slice(0, 5));
          } else if (data.data && Array.isArray(data.data)) {
            // Trường hợp API mới trả về dữ liệu trong trường data
            setAllNews(data.data);
            setTopHeadlines(data.data.slice(0, 5));
          } else {
            // Nếu không có dữ liệu phù hợp, đặt mảng rỗng
            setAllNews([]);
            setTopHeadlines([]);
            setError('No articles found in the response');
          }
        } else {
          setError(data.message || 'Failed to fetch news');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        // Đảm bảo các mảng không undefined khi có lỗi
        setAllNews([]);
        setTopHeadlines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Đảm bảo allNews luôn là một mảng trước khi thực hiện filter
  const filteredNews = Array.isArray(allNews) ? allNews.filter(article =>
    article?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (article?.description && article.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  // Pagination
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredNews.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(filteredNews.length / articlesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Health News</h1>
            <p className="text-xl text-gray-600">Stay updated with the latest health news and medical breakthroughs</p>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Health News</h1>
            <p className="text-xl text-gray-600">Stay updated with the latest health news and medical breakthroughs</p>
          </div>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Health News</h1>
          <p className="text-xl text-gray-600">Stay updated with the latest health news and medical breakthroughs</p>
        </div>

        {/* Search Bar */}
        <div className="mb-12 max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search health news..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
            />
          </div>
        </div>

        {/* Top Headlines Section with new CSS styles */}
        <section className="section mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-blue-500 inline-block">
            Tin nổi bật
          </h2>
          {topHeadlines.length > 0 ? (
            <ul className="cards">
              {topHeadlines.slice(0, 6).map((article, index) => (
                <li key={index} className="card">
                  <div className="visual">
                    {article.urlToImage && (
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="img"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <div className="content">
                    <div className="content-wrapper">
                      <h3 className="title">{article.title}</h3>
                      <p className="desc">{article.description}</p>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="flex items-center mr-4">
                        <User className="h-4 w-4 mr-1" />
                        {article.author || (article.source && article.source.name) || 'Unknown'}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {article.publishedAt ? formatDate(article.publishedAt) : 'Unknown date'}
                      </span>
                    </div>
                    <Link 
                      to={`/article-detail?url=${encodeURIComponent(article.url)}`} 
                      className="card-link"
                    >
                      Read more
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 text-center py-8">No top headlines available at the moment.</p>
          )}
        </section>

        {/* All Health News Section */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-green-500 inline-block">
            Tin sức khỏe mới nhất
          </h2>
          {currentArticles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentArticles.map((article, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {article.urlToImage && (
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      <Link 
                        to={`/article-detail?url=${encodeURIComponent(article.url)}`} 
                        className="hover:text-blue-600 transition-colors"
                      >
                        {article.title}
                      </Link>
                    </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">{article.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="flex items-center mr-4">
                          <User className="h-4 w-4 mr-1" />
                          {article.author || (article.source && article.source.name) || 'Unknown'}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {article.publishedAt ? formatDate(article.publishedAt) : 'Unknown date'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-md ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => paginate(pageNumber)}
                          className={`px-4 py-2 rounded-md ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-md ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-600 text-center py-8">No health news articles found.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default HealthNewsPage;