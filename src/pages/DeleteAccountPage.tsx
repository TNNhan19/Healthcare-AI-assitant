import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DeleteAccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'XÓA TÀI KHOẢN') {
      setError('Vui lòng nhập chính xác "XÓA TÀI KHOẢN" để xác nhận');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/api/v1/users/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Logout user
        logout();
        navigate('/', { 
          state: { 
            message: 'Tài khoản của bạn đã được xóa thành công' 
          } 
        });
      } else {
        setError(data.message || 'Có lỗi xảy ra khi xóa tài khoản');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      setError('Có lỗi xảy ra khi xóa tài khoản. Vui lòng thử lại sau.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cần đăng nhập</h1>
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập để truy cập trang này.</p>
          <Link
            to="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/account"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại tài khoản
          </Link>
          <div className="flex items-center mb-4">
            <Trash2 className="h-8 w-8 text-red-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Xóa tài khoản</h1>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Cảnh báo: Hành động này không thể hoàn tác
              </h2>
              <p className="text-red-700">
                Việc xóa tài khoản sẽ xóa vĩnh viễn tất cả dữ liệu của bạn bao gồm:
              </p>
            </div>
          </div>
        </div>

        {/* What will be deleted */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <XCircle className="h-6 w-6 text-red-600 mr-2" />
            Dữ liệu sẽ bị xóa
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Thông tin cá nhân</p>
                <p className="text-sm text-gray-600">Họ tên, email, số điện thoại, địa chỉ</p>
              </div>
            </li>
            <li className="flex items-start">
              <XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Lịch sử đơn hàng</p>
                <p className="text-sm text-gray-600">Tất cả đơn hàng đã đặt và lịch sử mua sắm</p>
              </div>
            </li>
            <li className="flex items-start">
              <XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Lịch hẹn và tư vấn</p>
                <p className="text-sm text-gray-600">Lịch hẹn khám bệnh và lịch sử tư vấn</p>
              </div>
            </li>
            <li className="flex items-start">
              <XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Dữ liệu sức khỏe</p>
                <p className="text-sm text-gray-600">Thông tin sức khỏe và hồ sơ y tế</p>
              </div>
            </li>
            <li className="flex items-start">
              <XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Tài khoản và quyền truy cập</p>
                <p className="text-sm text-gray-600">Không thể đăng nhập hoặc khôi phục tài khoản</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Alternatives */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
            <CheckCircle className="h-6 w-6 text-blue-600 mr-2" />
            Các lựa chọn khác
          </h2>
          <div className="space-y-3">
            <p className="text-blue-800">
              Trước khi xóa tài khoản, bạn có thể:
            </p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Tạm thời vô hiệu hóa tài khoản thay vì xóa vĩnh viễn</li>
              <li>Xóa một số thông tin cá nhân không cần thiết</li>
              <li>Liên hệ hỗ trợ để được tư vấn</li>
              <li>Xuất dữ liệu trước khi xóa tài khoản</li>
            </ul>
            <div className="mt-4">
              <Link
                to="/account"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-3"
              >
                Quay lại tài khoản
              </Link>
              <Link
                to="/contact"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Liên hệ hỗ trợ
              </Link>
            </div>
          </div>
        </div>

        {/* Confirmation */}
        {!showConfirm ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Xác nhận xóa tài khoản
            </h2>
            <p className="text-gray-700 mb-6">
              Nếu bạn chắc chắn muốn xóa tài khoản, hãy click vào nút bên dưới để tiếp tục.
            </p>
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium"
            >
              Tôi muốn xóa tài khoản
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Xác nhận cuối cùng
            </h2>
            <p className="text-gray-700 mb-4">
              Để xác nhận việc xóa tài khoản, vui lòng nhập chính xác:
            </p>
            <div className="mb-4">
              <code className="bg-gray-100 px-3 py-2 rounded text-lg font-mono">
                XÓA TÀI KHOẢN
              </code>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Nhập: XÓA TÀI KHOẢN"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== 'XÓA TÀI KHOẢN'}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa tài khoản vĩnh viễn
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                  setError('');
                }}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteAccountPage;
