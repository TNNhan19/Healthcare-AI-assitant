import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Truck, Clock, Users, X, Activity, ShoppingCart, Heart, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import BMIChart from '../components/BmiCalculator';
import ProductCard from '../components/ProductCard';
import { ProductFrontend, productService } from "../services/productService";
import doctorImg from "../images/doctor.jpg";

const categories = [
  { name: 'Thực phẩm chức năng', icon: Heart },
  { name: 'Dược mỹ phẩm', icon: Sparkles },
  { name: 'Chăm sóc cá nhân', icon: Users },
  { name: 'Thiết bị, dụng cụ y tế', icon: Activity },
];

const testimonials = [
  {
    quote: "Sản phẩm chính hãng, giao hàng cực nhanh. Tôi rất hài lòng với dịch vụ tư vấn của nhà thuốc.",
    author: "Chị Minh Anh",
    location: "Quận 1, TP.HCM"
  },
  {
    quote: "Giá cả hợp lý, lại còn có nhiều chương trình khuyến mãi. Chắc chắn sẽ tiếp tục ủng hộ.",
    author: "Anh Quốc Bảo",
    location: "Hà Nội"
  },
  {
    quote: "Website dễ sử dụng, đặt hàng đơn giản. Dược sĩ tư vấn rất nhiệt tình và chuyên nghiệp.",
    author: "Cô Thanh Mai",
    location: "Đà Nẵng"
  }
];

const HomePage: React.FC = () => {
  const [isBmiModalOpen, setIsBmiModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<ProductFrontend[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: Shield,
      title: 'Sản phẩm chính hãng',
      description: 'Cam kết 100% sản phẩm có nguồn gốc rõ ràng, được cấp phép.'
    },
    {
      icon: Truck,
      title: 'Giao hàng nhanh chóng',
      description: 'Giao hàng toàn quốc 24-48h, miễn phí cho đơn từ 500k.'
    },
    {
      icon: Clock,
      title: 'Hỗ trợ 24/7',
      description: 'Đội ngũ dược sĩ chuyên môn cao sẵn sàng tư vấn mọi lúc.'
    }
  ];

  useEffect(() => {
    if (activeCategory) {
      const fetchCategoryProducts = async () => {
        setIsLoadingProducts(true);
        try {
          const res = await productService.getProductsByCategory(activeCategory, { sort: "paid", limit: 8 });
          setCategoryProducts(res.products);
        } catch (err) {
          console.error(err);
          setCategoryProducts([]);
        } finally {
          setIsLoadingProducts(false);
        }
      };
      fetchCategoryProducts();
    }
  }, [activeCategory]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isBmiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative animate-fade-in-down">
            <button
              onClick={() => setIsBmiModalOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 transition-colors"
            >
              <X size={28} />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Chỉ số khối cơ thể (BMI)</h2>
            <BMIChart />
          </div>
        </div>
      )}

      <section className="bg-gradient-to-r from-blue-500/90 to-teal-400/80 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-28 md:py-40 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 drop-shadow-lg">
              Giải Pháp Sức Khỏe Toàn Diện
            </h1>
            <p className="text-lg md:text-2xl mb-10 text-blue-50 max-w-xl mx-auto md:mx-0 leading-relaxed">
              Cung cấp dược phẩm, thực phẩm chức năng và sản phẩm chăm sóc sức khỏe chính hãng với dịch vụ tận tâm.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
              <Link
                to="/products"
                className="bg-yellow-400 text-blue-900 px-10 py-4 rounded-full font-bold text-xl hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
              >
                <ShoppingCart className="mr-2 h-6 w-6" />
                Mua sắm ngay
              </Link>
              <Link
                to="/contact"
                className="bg-white/20 backdrop-blur-sm border-2 border-white/50 text-white px-10 py-4 rounded-full font-semibold text-xl hover:bg-white hover:text-blue-800 transition-colors shadow-lg"
              >
                Nhận tư vấn
              </Link>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <img
              src={doctorImg}
              alt="Healthcare Doctor"
              className="w-[420px] md:w-[560px] rounded-3xl border border-white/30 shadow-2xl object-cover floating"
            />
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {features.map((feature, index) => (
              <div key={index} className="p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Khám Phá Danh Mục</h2>
            <p className="text-lg text-gray-600">Tìm kiếm sản phẩm bạn cần một cách dễ dàng.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`group text-center p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-2 ${
                  activeCategory === category.name
                    ? "bg-blue-600 text-white shadow-xl"
                    : "bg-gray-50 hover:bg-blue-600 hover:shadow-xl"
                }`}
              >
                <category.icon
                  className={`h-12 w-12 mx-auto mb-4 ${
                    activeCategory === category.name
                      ? "text-white"
                      : "text-blue-600 group-hover:text-white"
                  }`}
                />
                <h3
                  className={`font-semibold ${
                    activeCategory === category.name
                      ? "text-white"
                      : "text-gray-800 group-hover:text-white"
                  }`}
                >
                  {category.name}
                </h3>
              </button>
            ))}
          </div>

          {activeCategory && (
            <div className="mt-8">
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Sản phẩm {activeCategory}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Sử dụng các nút mũi tên hoặc kéo để xem thêm sản phẩm
                  </p>
                </div>
                
                {categoryProducts.length > 3 && (
                  <div className="flex gap-2">
                    <button
                      onClick={scrollLeft}
                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                      aria-label="Cuộn sang trái"
                    >
                      <ChevronLeft className="h-5 w-5 text-blue-600" />
                    </button>
                    <button
                      onClick={scrollRight}
                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                      aria-label="Cuộn sang phải"
                    >
                      <ChevronRight className="h-5 w-5 text-blue-600" />
                    </button>
                  </div>
                )}
              </div>
              
              {isLoadingProducts ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Đang tải sản phẩm...</span>
                </div>
              ) : categoryProducts.length > 0 ? (
                <div className="relative">
                  <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
                      {categoryProducts.map((product) => (
                        <div key={product.id} className="flex-shrink-0 w-72">
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {categoryProducts.length > 3 && (
                    <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không tìm thấy sản phẩm nào trong danh mục này.</p>
                </div>
              )}
              
              <div className="text-center mt-6">
                <Link
                  to={`/products?category=${activeCategory}`}
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Khám phá thêm →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Công cụ sức khỏe hữu ích</h2>
              <p className="text-gray-600 mb-6">Kiểm tra chỉ số khối cơ thể (BMI) của bạn để hiểu rõ hơn về tình trạng sức khỏe và nhận lời khuyên phù hợp.</p>
              <button
                onClick={() => setIsBmiModalOpen(true)}
                className="bg-green-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors flex items-center justify-center mx-auto md:mx-0 text-lg shadow-md"
              >
                <Activity className="mr-3 h-6 w-6" />
                Kiểm tra BMI ngay
              </button>
            </div>
            <div className="flex-shrink-0">
              <Activity size={100} className="text-green-400"/>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Khách Hàng Nói Gì Về Chúng Tôi</h2>
            <p className="text-lg text-gray-600">Sự hài lòng của bạn là động lực lớn nhất của chúng tôi.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
                <p className="text-gray-600 italic mb-4">"{item.quote}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mr-4">
                    <Users className="text-blue-600"/>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.author}</p>
                    <p className="text-sm text-gray-500">{item.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-700 to-cyan-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Sẵn sàng chăm sóc sức khỏe của bạn?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Khám phá hàng ngàn sản phẩm chất lượng cao và nhận tư vấn từ các chuyên gia hàng đầu.
          </p>
          <Link
            to="/products"
            className="bg-yellow-400 text-blue-900 px-10 py-4 rounded-full font-bold text-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg inline-block"
          >
            Bắt đầu mua sắm
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;