import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const TermsOfServicePage: React.FC = () => {
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
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Điều khoản dịch vụ</h1>
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
              <Scale className="h-6 w-6 text-blue-600 mr-2" />
              Giới thiệu
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Chào mừng bạn đến với HealthCare. Điều khoản dịch vụ này quy định việc sử dụng 
              nền tảng dịch vụ y tế trực tuyến của chúng tôi. Bằng cách sử dụng dịch vụ, 
              bạn đồng ý tuân thủ các điều khoản này.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Mô tả dịch vụ
            </h2>
            <p className="text-gray-700 mb-4">
              HealthCare cung cấp các dịch vụ sau:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Mua sắm sản phẩm y tế và dược phẩm</li>
              <li>Tư vấn sức khỏe từ dược sĩ</li>
              <li>Đặt lịch khám bệnh</li>
              <li>Giao hàng tận nhà</li>
              <li>Thông tin y tế và sức khỏe</li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              Trách nhiệm của người dùng
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Thông tin chính xác</h3>
                <p className="text-gray-700">
                  Bạn cam kết cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký và sử dụng dịch vụ.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sử dụng hợp pháp</h3>
                <p className="text-gray-700">
                  Bạn chỉ được sử dụng dịch vụ cho mục đích hợp pháp và không được vi phạm pháp luật.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bảo mật tài khoản</h3>
                <p className="text-gray-700">
                  Bạn có trách nhiệm bảo vệ thông tin đăng nhập và thông báo ngay lập tức nếu phát hiện vi phạm.
                </p>
              </div>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <XCircle className="h-6 w-6 text-red-600 mr-2" />
              Các hành vi bị cấm
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
              <li>Gian lận, lừa đảo hoặc cung cấp thông tin sai sự thật</li>
              <li>Xâm phạm quyền sở hữu trí tuệ của người khác</li>
              <li>Phát tán virus, malware hoặc mã độc hại</li>
              <li>Spam, gửi thư rác hoặc quảng cáo không được phép</li>
              <li>Hành vi quấy rối hoặc đe dọa người khác</li>
            </ul>
          </section>

          {/* Medical Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
              Tuyên bố miễn trừ y tế
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-gray-700 font-medium mb-2">
                ⚠️ Lưu ý quan trọng:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Dịch vụ tư vấn không thay thế cho việc khám bệnh trực tiếp</li>
                <li>Thông tin y tế chỉ mang tính chất tham khảo</li>
                <li>Luôn tham khảo ý kiến bác sĩ trước khi sử dụng thuốc</li>
                <li>Trong trường hợp khẩn cấp, hãy gọi 115 hoặc đến bệnh viện gần nhất</li>
              </ul>
            </div>
          </section>

          {/* Payment and Refunds */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Thanh toán và hoàn tiền
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Phương thức thanh toán</h3>
                <p className="text-gray-700">
                  Chúng tôi chấp nhận thanh toán qua thẻ tín dụng, chuyển khoản ngân hàng, 
                  ví điện tử và thanh toán khi nhận hàng.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chính sách hoàn tiền</h3>
                <p className="text-gray-700">
                  Hoàn tiền trong vòng 7 ngày nếu sản phẩm bị lỗi, không đúng mô tả hoặc 
                  không được giao đúng hạn. Một số sản phẩm y tế có thể không được hoàn tiền.
                </p>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Giới hạn trách nhiệm
            </h2>
            <p className="text-gray-700">
              HealthCare không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
              <li>Việc sử dụng sai mục đích dịch vụ</li>
              <li>Thông tin không chính xác từ người dùng</li>
              <li>Gián đoạn dịch vụ do lý do khách quan</li>
              <li>Thiệt hại gián tiếp hoặc hậu quả</li>
            </ul>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Bảo mật thông tin
            </h2>
            <p className="text-gray-700">
              Việc thu thập và sử dụng thông tin cá nhân được quy định trong 
              <Link to="/privacy" className="text-blue-600 hover:text-blue-800 ml-1">
                Chính sách bảo mật
              </Link> của chúng tôi.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Thay đổi điều khoản
            </h2>
            <p className="text-gray-700">
              Chúng tôi có quyền cập nhật điều khoản dịch vụ này. Thay đổi sẽ có hiệu lực 
              ngay khi được đăng tải trên website. Việc tiếp tục sử dụng dịch vụ sau khi 
              thay đổi được coi là chấp nhận điều khoản mới.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Liên hệ
            </h2>
            <p className="text-gray-700">
              Nếu bạn có câu hỏi về điều khoản dịch vụ, vui lòng liên hệ:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@healthcare.com<br />
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

export default TermsOfServicePage;
