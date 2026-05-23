import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại trang chủ
          </Link>
          <div className="flex items-center mb-4">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Chính sách bảo mật</h1>
          </div>
          <p className="text-gray-600">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="h-6 w-6 text-blue-600 mr-2" />
              Giới thiệu
            </h2>
            <p className="text-gray-700 leading-relaxed">
              HealthCare cam kết bảo vệ quyền riêng tư và thông tin cá nhân của người dùng. 
              Chính sách bảo mật này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ 
              thông tin của bạn khi sử dụng dịch vụ của chúng tôi.
            </p>
          </section>

          {/* Information Collection */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="h-6 w-6 text-blue-600 mr-2" />
              Thông tin chúng tôi thu thập
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Thông tin cá nhân</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Họ tên, email, số điện thoại</li>
                  <li>Địa chỉ giao hàng</li>
                  <li>Ngày sinh, giới tính</li>
                  <li>Thông tin thanh toán (được mã hóa)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Thông tin sử dụng</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Lịch sử mua hàng và đơn hàng</li>
                  <li>Thông tin tư vấn sức khỏe</li>
                  <li>Lịch hẹn khám bệnh</li>
                  <li>Dữ liệu truy cập website</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <UserCheck className="h-6 w-6 text-blue-600 mr-2" />
              Cách chúng tôi sử dụng thông tin
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Cung cấp và cải thiện dịch vụ y tế</li>
              <li>Xử lý đơn hàng và giao hàng</li>
              <li>Tư vấn sức khỏe và lịch hẹn</li>
              <li>Gửi thông báo quan trọng về sức khỏe</li>
              <li>Bảo mật và ngăn chặn gian lận</li>
              <li>Tuân thủ các quy định pháp luật</li>
            </ul>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="h-6 w-6 text-blue-600 mr-2" />
              Bảo vệ dữ liệu
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Chúng tôi sử dụng các biện pháp bảo mật tiên tiến để bảo vệ thông tin của bạn:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Mã hóa SSL/TLS cho tất cả dữ liệu truyền tải</li>
                <li>Mã hóa dữ liệu nhạy cảm trong cơ sở dữ liệu</li>
                <li>Kiểm soát truy cập nghiêm ngặt</li>
                <li>Giám sát bảo mật 24/7</li>
                <li>Đào tạo nhân viên về bảo mật dữ liệu</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Chia sẻ thông tin
            </h2>
            <p className="text-gray-700 mb-4">
              Chúng tôi không bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn với bên thứ ba, 
              trừ các trường hợp sau:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Với sự đồng ý rõ ràng của bạn</li>
              <li>Để cung cấp dịch vụ y tế (bác sĩ, dược sĩ)</li>
              <li>Tuân thủ yêu cầu pháp lý</li>
              <li>Bảo vệ quyền lợi và an toàn của người dùng</li>
            </ul>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Quyền của người dùng
            </h2>
            <p className="text-gray-700 mb-4">
              Bạn có quyền:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Truy cập và xem thông tin cá nhân</li>
              <li>Chỉnh sửa thông tin không chính xác</li>
              <li>Xóa tài khoản và dữ liệu cá nhân</li>
              <li>Rút lại sự đồng ý xử lý dữ liệu</li>
              <li>Xuất dữ liệu cá nhân</li>
              <li>Khiếu nại về việc xử lý dữ liệu</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Liên hệ
            </h2>
            <p className="text-gray-700">
              Nếu bạn có câu hỏi về chính sách bảo mật này, vui lòng liên hệ:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@healthcare.com<br />
                <strong>Điện thoại:</strong> 1900-6035<br />
                <strong>Địa chỉ:</strong> 123 Nguyễn Huệ, Quận 1, TP.HCM
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
