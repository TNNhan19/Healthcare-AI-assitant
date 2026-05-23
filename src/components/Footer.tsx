import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import ChaosFooter from './ChaosFooter';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'Giới thiệu', href: '/about' },
      { name: 'Tin tức', href: '/news' },
      { name: 'Tuyển dụng', href: '/careers' },
      { name: 'Liên hệ', href: '/contact' }
    ],
    products: [
      { name: 'Thuốc kê đơn', href: '/products?category=prescription' },
      { name: 'Thuốc không kê đơn', href: '/products?category=otc' },
      { name: 'Thực phẩm chức năng', href: '/products?category=supplements' },
      { name: 'Thiết bị y tế', href: '/products?category=medical-devices' }
    ],
    services: [
      { name: 'Tư vấn sức khỏe', href: '/services/consultation' },
      { name: 'Đặt lịch khám', href: '/services/appointments' },
      { name: 'Giao hàng tận nhà', href: '/services/delivery' },
      { name: 'Hỗ trợ 24/7', href: '/services/support' }
    ],
    support: [
      { name: 'Hướng dẫn mua hàng', href: '/help/shopping-guide' },
      { name: 'Chính sách đổi trả', href: '/help/return-policy' },
      { name: 'Bảo mật thông tin', href: '/help/privacy' },
      { name: 'Điều khoản sử dụng', href: '/help/terms' }
    ]
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-300">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-green-500/30 via-blue-600/30 to-transparent" />

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-lg">HC</span>
              </div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                HealthCare
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-8">
              Cung cấp thuốc và sản phẩm sức khỏe chất lượng cao với dịch vụ tận tâm, 
              đảm bảo sức khỏe tốt nhất cho mọi gia đình Việt Nam.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-green-400" />
                <span>1900-6035</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-blue-400" />
                <span>contact@healthcare.com</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-3 text-purple-400" />
                <span>123 Nguyễn Huệ, Quận 1, TP.HCM</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-pink-400" />
                <span>24/7 - Hỗ trợ mọi lúc</span>
              </div>
            </div>
          </div>

          {/* Dynamic Link Sections */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social & Copyright */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-4 mb-6 md:mb-0">
            <ChaosFooter />
          </div>
          <div className="text-gray-500 text-sm">
            © {currentYear} <span className="text-white">HealthCare</span>. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative bg-gray-950/70 backdrop-blur-sm border-t border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-3 md:mb-0">
            <Link to="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Điều khoản sử dụng</Link>
            <Link to="/help/cookies" className="hover:text-white transition-colors">Chính sách cookie</Link>
          </div>
          <p className="text-center md:text-right">
            Được cấp phép bởi Bộ Y tế - Giấy phép số: 12345/GP-BYT
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
