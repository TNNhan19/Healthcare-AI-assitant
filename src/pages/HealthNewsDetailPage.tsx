import React, { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { User, Calendar, Tag, ArrowLeft } from "lucide-react";
import healthNewsService from '../services/healthNewsService';

function ArticleDetail() {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const query = new URLSearchParams(location.search);
  const url = query.get("url");

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Nếu có ID, lấy tin tức từ DB
    if (id) {
      const fetchNewsDetail = async () => {
        setLoading(true);
        try {
          const res = await healthNewsService.getHealthNewsById(id);
          if (res.success) {
            setContent(res.data);
            setError(null);
          } else {
            setError(res.message || 'Không thể tải chi tiết tin tức');
            setContent(null);
          }
        } catch (err) {
          console.error('Lỗi khi tải chi tiết tin tức:', err);
          setError('Không thể tải tin tức. Vui lòng thử lại sau.');
          setContent(null);
        } finally {
          setLoading(false);
        }
      };
      fetchNewsDetail();
    }
    // Nếu có URL, sử dụng Mercury Parser (cách cũ)
    else if (url) {
      setLoading(true);
      fetch(`/api/v1/fetch-article?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(data => setContent(data))
        .catch(() => setError("Failed to load article"))
        .finally(() => setLoading(false));
    }
  }, [id, url]);

  const formatDate = (date: string | Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg text-center">
          {error || 'Không tìm thấy tin tức'}
        </div>
        <div className="mt-4 text-center">
          <a href="/health-news-db" className="inline-flex items-center text-blue-600 hover:underline">
            Quay lại danh sách tin tức
          </a>
        </div>
      </div>
    );
  }

  // Mercury Parser format
  const isMercuryFormat = !content._id && content.lead_image;

  // Xử lý các trường cho cả 2 định dạng
  const title = isMercuryFormat ? content.title : content.title;
  const imageUrl = isMercuryFormat ? content.lead_image : content.urlToImage;
  const articleContent = isMercuryFormat ? content.content : content.content;
  const author = isMercuryFormat ? (content.author || "Unknown author") : content.author;
  const date = isMercuryFormat ? content.date : content.publishedAt;
  const source = isMercuryFormat ? null : content.source?.name;
  const category = isMercuryFormat ? null : content.category;
  const originalUrl = isMercuryFormat ? url : content.url;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link with better styling */}
        {id && (
          <div className="mb-8">
            <a 
              href="/health-news-db" 
              className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="font-medium">Quay lại danh sách tin tức</span>
            </a>
          </div>
        )}

        <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Lead Image in full width */}
          {imageUrl && (
            <div className="w-full h-[400px] md:h-[500px] relative">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              {/* Gradient overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          <div className="relative px-6 md:px-12 py-8 md:py-12">
            {/* Category tag */}
            {category && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Tag className="h-4 w-4 mr-1" />
                  {category}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
              {title}
            </h1>

            {/* Meta information with better organization */}
            <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-gray-600 border-b border-gray-100 pb-6">
              {date && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{formatDate(date)}</span>
                </div>
              )}
              
              {author && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{author}</span>
                </div>
              )}
              
              {source && (
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">Nguồn:</span>
                  <span className="font-medium">{source}</span>
                </div>
              )}
            </div>

            {/* Description with better visibility */}
            {!isMercuryFormat && content.description && (
              <div className="text-lg text-gray-700 mb-8 leading-relaxed font-medium bg-blue-50 p-6 rounded-xl">
                {content.description}
              </div>
            )}

            {/* Article Content with improved typography */}
            <div
              className="article-content mx-auto text-gray-800 leading-relaxed
                prose prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-gray-900 prose-headings:leading-tight
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-base prose-p:leading-relaxed prose-p:mb-6
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-blockquote:border-l-4 prose-blockquote:border-blue-200
                prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700
                prose-img:rounded-xl prose-img:shadow-lg
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(articleContent) }}
            />

            {/* Source link with improved visibility */}
            {originalUrl && (
              <div className="mt-12 pt-6 border-t border-gray-100">
                <a
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 font-semibold shadow-sm hover:shadow-md"
                >
                  <span>Đọc bài viết gốc</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

export default ArticleDetail;