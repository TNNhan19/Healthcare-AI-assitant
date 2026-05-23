import PageBackground from '../components/PageBackground';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import type { Product } from '../context/CartContext';
import { productService, ProductFrontend } from '../services/productService';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<ProductFrontend | null>(null);
  const [loading, setLoading] = useState(true);

  // Popup state
  const [showDetails, setShowDetails] = useState(false);
  const [showProductInfo, setShowProductInfo] = useState(false);
  const [showUsageGuideImage, setShowUsageGuideImage] = useState(false);
  
  // Thêm biến cờ để theo dõi đã tăng lượt xem hay chưa, tránh việc tăng nhiều lần
  const [viewCounted, setViewCounted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        // Lấy thông tin sản phẩm
        const res = await productService.getProductById(id!);
        const productData = productService.transformProductToProduct(res.data);
        setProduct(productData);
        
        // Tăng lượt xem sản phẩm chỉ một lần khi truy cập trang chi tiết
        if (!viewCounted) {
          try {
            await productService.incrementViewCount(id!);
            setViewCounted(true); // Đánh dấu đã tăng lượt xem
          } catch (viewError) {
            console.error("Lỗi khi cập nhật lượt xem:", viewError);
          }
        }
      } catch (error) {
        setProduct(null);
      }
      setLoading(false);
    };
    if (id) fetchProduct();
  }, [id, viewCounted]);

  const formatPrice = (price: number | string) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));

  // Chuẩn hóa ProductFrontend sang Cart Product (đủ field bắt buộc)
  const toCartProduct = (p: ProductFrontend): Product & { stockEntryId: string } => ({
    id: p.id,
    name: p.name,
    price: Number(p.price) || 0,
    unitPrice: undefined,
    originalPrice: undefined,
    image: p.image || p.imageUrl || '',
    category: p.main_category || p.sub_category || 'Khác',
    description: p.description || '',
    rating: 0,
    reviews: 0,
    inStock: true,
    prescription: undefined,
    ingredients: p.thanhPhan,
    dosage: undefined,
    sideEffects: undefined,
    manufacturer: p.manufacturer,
    soDangKy: p.soDangKy,
    dangBaoChe: p.dangBaoChe,
    dongGoi: p.dongGoi || p.packaging,
    hanSuDung: p.hanSuDung || p.expiryDate,
    quocGia: p.quocGia || p.country,
    linkChiTiet: p.linkChiTiet,
    main_category: p.main_category,
    sub_category: p.sub_category,
    giaThuoc: undefined,
    packaging: p.packaging,
    packagingOptions: undefined,
    stockEntryId: p.id || 'default-stock-id',
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-blue-600">Đang tải...</span>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-12 text-red-600">Không tìm thấy sản phẩm.</div>;
  }

  // Render details
  const renderDetailsRows = () => {
    if (!product.details || typeof product.details !== 'object') return null;
    return Object.entries(product.details).map(([key, value]) => (
      <div key={`details-${key}`} className="flex items-center justify-between py-4 px-6 hover:bg-blue-50 transition-colors duration-200">
        <span className="font-medium text-gray-700">{key}</span>
        <span className="text-gray-600 text-right max-w-md">{String(value)}</span>
      </div>
    ));
  };

  // Render product_info content with rich formatting when it's a string
  const renderProductInfoContent = () => {
    const info = product.product_info as any;
    if (!info) return null;

    if (typeof info === 'object') {
      return (
        <table className="w-full border border-gray-200 rounded">
          <tbody>
            {Object.entries(info).map(([key, value]) => (
              <tr key={`productinfo-${key}`}>
                <td className="font-medium pr-4 py-1 align-top text-gray-700">{key}</td>
                <td className="py-1 text-gray-700">{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    const text = String(info || '').trim();
    if (!text) return null;

    type Section = { title: string; body: string };
    const sections: Section[] = [];
    const regex = /(^|\n)\s*(\d+)\.\s*([^\n:]+):?/g;
    let match: RegExpExecArray | null;
    const indices: { pos: number; title: string }[] = [];

    while ((match = regex.exec(text)) !== null) {
      const pos = match.index + (match[1] ? match[1].length : 0);
      indices.push({ pos, title: match[3].trim() });
    }

    if (indices.length) {
      for (let i = 0; i < indices.length; i++) {
        const start = indices[i].pos;
        const end = i < indices.length - 1 ? indices[i + 1].pos : text.length;
        const title = indices[i].title;
        const afterTitleLineBreak = text.indexOf('\n', start);
        const rawBody =
          afterTitleLineBreak !== -1 && afterTitleLineBreak < end
            ? text.slice(afterTitleLineBreak + 1, end)
            : text.slice(start, end).replace(/^\s*\d+\.\s*[^\n:]+:?\s*/, '');
        const body = rawBody.trim();
        sections.push({ title, body });
      }
    } else {
      sections.push({ title: 'Thông tin sản phẩm', body: text });
    }

    const renderBody = (body: string) => {
      const lines = body
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length > 1) {
        return (
          <ul className="list-disc pl-5 space-y-1">
            {lines.map((l, idx) => (
              <li key={idx} className="text-gray-700">
                {l}
              </li>
            ))}
          </ul>
        );
      }

      return <p className="text-gray-700 whitespace-pre-line">{body}</p>;
    };

    return (
      <div className="space-y-4 leading-relaxed break-words">
        {sections.map((sec, idx) => (
          <section key={idx}>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{sec.title}</h3>
            {renderBody(sec.body)}
          </section>
        ))}
      </div>
    );
  };
  
  // Modal component
  const Modal: React.FC<{ show: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({
    show,
    onClose,
    title,
    children,
  }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-all duration-200 transform hover:scale-110"
              aria-label="Đóng"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white to-gray-50">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageBackground>
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <a href="/" className="hover:text-blue-600 transition-colors">Trang chủ</a>
          <span>/</span>
          <a href="/products" className="hover:text-blue-600 transition-colors">Thực phẩm chức năng</a>
          <span>/</span>
          <a href="#" className="hover:text-blue-600 transition-colors">Hỗ trợ điều trị</a>
          <span>/</span>
          <span className="text-gray-900 font-medium">Hỗ trợ điều trị tiểu đường</span>
        </nav>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Ảnh sản phẩm - Bên trái */}
            <div className="space-y-4">
              {/* Ảnh chính */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-center h-96">
                <img
                  src={product.image || product.imageUrl}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              {/* Thumbnail images */}
              <div className="flex space-x-2">
                <div className="w-16 h-16 border-2 border-blue-500 rounded-lg p-1 cursor-pointer">
                  <img
                    src={product.image || product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-500">Màu mã sản phẩm có thể thay đổi theo lô hàng</p>
            </div>

            {/* Thông tin sản phẩm - Bên phải */}
            <div className="space-y-6">
              {/* Tên sản phẩm */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-2">
                  {product.name}
                </h1>
                
                {/* Mã sản phẩm và đánh giá */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <span>{product.soDangKy || '00049148'}</span>
                  
                </div>
              </div>

              {/* Giá */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {product.price && Number(product.price) > 0 ? formatPrice(product.price) : '960.000đ'} / Hộp
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Chọn đơn vị tính</span>
                  <button className="bg-blue-600 text-white px-4 py-1 rounded text-sm">Hộp</button>
                </div>
              </div>

              {/* Thông tin sản phẩm */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Tên chính hãng</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{product.manufacturer || 'Thực phẩm bảo vệ sức khỏe MEDSULIN PLUS'}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Danh mục</span>
                  </div>
                  <div>
                    <a href="#" className="text-blue-600 hover:underline">{product.main_category || 'Hỗ trợ điều trị tiểu đường'}</a>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Số đăng ký</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{product.soDangKy || '445/2025/ĐKSP'}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Dạng bào chế</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{product.dosageForm || 'Viên nang cứng'}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Quy cách</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{product.packaging || 'Hộp 60 Viên'}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Nhà sản xuất</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{product.manufacturer || 'GENSEI CO.,LTD'}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Nước sản xuất</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{product.country || 'Nhật Bản'}</span>
                  </div>
                </div>
                
                {/* Xem hướng dẫn sử dụng chi tiết */}
                <div className="pt-2">
                <a 
                  href={product.linkChiTiet ? `https://www.nhathuocankhang.com/${product.linkChiTiet}` : '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm flex items-center"
                >
                  <span>Xem hướng dẫn sử dụng chi tiết</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                </div>
                </div>
              {/* Thành phần */}
              {product.thanhPhan && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Thành phần</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.thanhPhan}</p>
                </div>
              )}

              {/* Nút hành động */}
              <div className="flex flex-wrap gap-3 pt-4">
                {product.details && (
                  <button
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-blue-100 border border-gray-300 hover:border-blue-300 px-4 py-2 rounded-lg text-gray-700 hover:text-blue-700 font-medium transition-all duration-200"
                    onClick={() => setShowDetails(true)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Chi tiết sản phẩm</span>
                  </button>
                )}
                {product.product_info && (
                  <button
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-green-100 border border-gray-300 hover:border-green-300 px-4 py-2 rounded-lg text-gray-700 hover:text-green-700 font-medium transition-all duration-200"
                    onClick={() => setShowProductInfo(true)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Thông tin sản phẩm</span>
                  </button>
                )}
                {product.usageGuideImage && (
                  <button
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-purple-100 border border-gray-300 hover:border-purple-300 px-4 py-2 rounded-lg text-gray-700 hover:text-purple-700 font-medium transition-all duration-200"
                    onClick={() => setShowUsageGuideImage(true)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Hình ảnh hướng dẫn</span>
                  </button>
                )}
              </div>

              {/* Nút thêm vào giỏ */}
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg text-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => addToCart(toCartProduct(product))}
                disabled={!product.price || Number(product.price) <= 0}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <span>Thêm vào giỏ hàng</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Các popup */}
      <Modal show={showDetails} onClose={() => setShowDetails(false)} title="Chi tiết sản phẩm">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 divide-y divide-gray-100">
            {renderDetailsRows()}
          </div>
        </div>
      </Modal>
      
      <Modal show={showProductInfo} onClose={() => setShowProductInfo(false)} title="Thông tin sản phẩm">
        <div className="prose prose-blue max-w-none">
          {renderProductInfoContent()}
        </div>
      </Modal>
      
      <Modal show={showUsageGuideImage} onClose={() => setShowUsageGuideImage(false)} title="Hình ảnh hướng dẫn sử dụng">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            <div className="relative bg-white rounded-2xl p-4 shadow-lg">
              <img
                src={product.usageGuideImage}
                alt="Hướng dẫn sử dụng"
                className="w-full max-w-2xl rounded-xl border-2 border-gray-100 cursor-zoom-in transition-transform duration-300 hover:scale-105"
                onClick={() => window.open(product.usageGuideImage, '_blank')}
                title="Nhấn để mở ảnh trong tab mới"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-500 bg-blue-50 px-4 py-2 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm font-medium">Nhấn vào ảnh để mở trong tab mới</span>
          </div>
        </div>
      </Modal>
    </div>
    </PageBackground>
  );
};

export default ProductDetailPage;