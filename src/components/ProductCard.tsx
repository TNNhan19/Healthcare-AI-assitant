import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, ShoppingBag, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ProductFrontend } from '../services/productService';

interface ProductCardProps {
  product: ProductFrontend;
  viewMode?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid' }) => {
  const { addToCart } = useCart();
  const [imageLoading, setImageLoading] = useState(true);

  const formatPrice = (price: number | string) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));

  const StatInfo = () => (
    <div className="flex items-center space-x-4 text-gray-500 text-sm mt-2">
      <span className="flex items-center space-x-1">
        <Eye className="h-4 w-4" />
        <span>{product.view?.toLocaleString() || 0}</span>
      </span>
      <span className="flex items-center space-x-1">
        <ShoppingBag className="h-4 w-4" />
        <span>{product.paid?.toLocaleString() || 0}</span>
      </span>
    </div>
  );

  const handleAddToCart = () => {
    if (!product.price || Number(product.price) <= 0) {
      alert('Sản phẩm chưa có giá');
      return;
    }
    addToCart({ ...product });
  };

  const renderButton = () => (
    <button
      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-xl 
                 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 mt-3 flex items-center justify-center shadow-md"
      onClick={handleAddToCart}
      disabled={!product.price || Number(product.price) <= 0}
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      Thêm vào giỏ
    </button>
  );

  return (
    <div
      className="bg-gradient-to-br from-white via-gray-50 to-blue-50 border border-gray-200 rounded-2xl 
                 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1"
    >
      {/* Ảnh */}
      <Link to={`/product/${product.id}`} className="relative group">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />
      </Link>

      {/* Nội dung */}
      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="font-semibold text-gray-900 line-clamp-2 text-base mb-1">
          {product.name}
        </Link>

        {/* Rating demo */}
        <div className="flex items-center text-yellow-500 mb-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < (product.rating || 4) ? 'fill-current' : 'stroke-current'}`} />
          ))}
        </div>

        <StatInfo />

        {/* Giá */}
        <div className="mt-auto">
          {product.price && Number(product.price) > 0 ? (
            <span className="text-lg font-bold text-blue-600">{formatPrice(product.price)}</span>
          ) : (
            <span className="text-base font-semibold text-gray-500">Liên hệ</span>
          )}
        </div>

        {renderButton()}
      </div>
    </div>
  );
};

export default ProductCard;
