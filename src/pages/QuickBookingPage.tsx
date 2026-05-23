import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, User, Phone, Mail, Stethoscope, MapPin, AlertCircle } from 'lucide-react';

interface AppointmentForm {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  department: string;
  doctor: string;
  symptoms: string;
  notes: string;
  priority: string;
}

const QuickBookingPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<AppointmentForm>({
    patientName: user?.userName || '',
    patientPhone: user?.phone || '',
    patientEmail: user?.email || '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: 'consultation',
    department: 'general',
    doctor: '',
    symptoms: '',
    notes: '',
    priority: 'medium'
  });

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appointmentTypes = [
    { value: 'consultation', label: 'Tư vấn khám bệnh' },
    { value: 'checkup', label: 'Khám sức khỏe định kỳ' },
    { value: 'emergency', label: 'Khám cấp cứu' },
    { value: 'followup', label: 'Tái khám' }
  ];

  const departments = [
    { value: 'general', label: 'Khoa Tổng hợp' },
    { value: 'cardiology', label: 'Tim mạch' },
    { value: 'dermatology', label: 'Da liễu' },
    { value: 'neurology', label: 'Thần kinh' },
    { value: 'orthopedics', label: 'Chỉnh hình' },
    { value: 'pediatrics', label: 'Nhi khoa' },
    { value: 'gynecology', label: 'Phụ khoa' },
    { value: 'ophthalmology', label: 'Mắt' },
    { value: 'dental', label: 'Răng hàm mặt' },
    { value: 'other', label: 'Khác' }
  ];

  const priorities = [
    { value: 'low', label: 'Thấp' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'high', label: 'Cao' },
    { value: 'emergency', label: 'Cấp cứu' }
  ];

  // Get available time slots when date changes
  useEffect(() => {
    if (formData.appointmentDate) {
      fetchAvailableTimeSlots();
    }
  }, [formData.appointmentDate]);

  const fetchAvailableTimeSlots = async () => {
    try {
      const response = await fetch(`/api/v1/appointments/available-slots?date=${formData.appointmentDate}`);
      const result = await response.json();
      
      if (result.success) {
        setAvailableTimeSlots(result.data.availableTimeSlots);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Vui lòng đăng nhập để đặt lịch khám');
      return;
    }

    if (!formData.patientName || !formData.patientPhone || !formData.appointmentDate || !formData.appointmentTime) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        alert('Đặt lịch khám thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
        setFormData({
          patientName: user?.userName || '',
          patientPhone: user?.phone || '',
          patientEmail: user?.email || '',
          appointmentDate: '',
          appointmentTime: '',
          appointmentType: 'consultation',
          department: 'general',
          doctor: '',
          symptoms: '',
          notes: '',
          priority: 'medium'
        });
      } else {
        alert('Có lỗi xảy ra: ' + result.message);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Có lỗi xảy ra khi đặt lịch khám');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AppointmentForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Đặt lịch khám nhanh</h1>
        <p className="text-gray-600">Đặt lịch khám với bác sĩ chuyên khoa của chúng tôi</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Họ và tên *
              </label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Số điện thoại *
              </label>
              <input
                type="tel"
                value={formData.patientPhone}
                onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </label>
              <input
                type="email"
                value={formData.patientEmail}
                onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mức độ ưu tiên
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Ngày khám *
              </label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Giờ khám *
              </label>
              <select
                value={formData.appointmentTime}
                onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Chọn giờ khám</option>
                {availableTimeSlots.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại khám
              </label>
              <select
                value={formData.appointmentType}
                onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {appointmentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Stethoscope className="h-4 w-4 mr-2" />
                Khoa khám
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Symptoms and Notes */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Triệu chứng (nếu có)
              </label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => handleInputChange('symptoms', e.target.value)}
                placeholder="Mô tả các triệu chứng bạn đang gặp phải..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú khác
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Thông tin bổ sung hoặc yêu cầu đặc biệt..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Đặt lịch khám'}
            </button>
          </div>
        </form>

        {/* Information Notice */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Lưu ý quan trọng:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Vui lòng đến trước giờ hẹn 15 phút để làm thủ tục</li>
                <li>• Mang theo giấy tờ tùy thân và bảo hiểm y tế (nếu có)</li>
                <li>• Nếu có đơn thuốc cũ, vui lòng mang theo</li>
                <li>• Có thể hủy lịch hẹn trước 24 giờ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickBookingPage;
