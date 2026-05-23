import React, { useState, useEffect } from 'react';
import { User, Package, Heart, Settings, MapPin, CreditCard, Bell, Shield, Calendar, Clock, RotateCw, AlertTriangle } from 'lucide-react';
import StyledRadio from '../components/StyledRadio';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, Link } from 'react-router-dom';

const AccountPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [dob, setDob] = useState('');
  const [profile, setProfilePicture] = useState<string | null>(null);
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState(''); // Add state for gender
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);  

  // Orders UI states and helpers
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    paymentMethod: 'cash',
    notes: ''
  });
  const paymentMethods = [
    { id: 'cash', name: 'Thanh toán khi nhận hàng' },
    { id: 'credit_card', name: 'Thẻ tín dụng/ghi nợ' },
    { id: 'momo', name: 'MoMo' },
    { id: 'zalopay', name: 'ZaloPay' },
    { id: 'shopeepay', name: 'ShopeePay' },
    { id: 'banking', name: 'Chuyển khoản' },
  ];

  const mapboxToken = (import.meta as any).env?.VITE_MAPBOX_TOKEN as string | undefined;
  const [editCoords, setEditCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
  address: "",
  city: "",
  district: "",
  ward: "",
  lat: null,
  lng: null,
});

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const canCancel = (status: string) => !['delivered', 'cancelled'].includes(status);
  const canEdit = (status: string) => !['processing', 'shipped', 'delivered', 'cancelled'].includes(status);
  // Ham goi MapBox
  const fetchSuggestions = async (value: string) => {
    try {
      if (!value) {
        setSuggestions([]);
        return;
      }
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          value
        )}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}&country=VN&limit=5`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };
  const buildAddressQuery = (f: typeof editForm) => {
    const parts = [f.address, f.ward, f.district, f.city, 'Việt Nam'].filter(Boolean);
    return parts.join(', ');
  };

  const geocodeFromEditAddress = async () => {
    if (!mapboxToken) {
      setLocationError('Cần cấu hình VITE_MAPBOX_TOKEN để geocode. Bạn có thể nhập lat/lng thủ công.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    try {
      const query = encodeURIComponent(buildAddressQuery(editForm));
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}&limit=1&country=VN&language=vi`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setEditCoords({ lat, lng });
      } else {
        setLocationError('Không tìm thấy toạ độ cho địa chỉ đã nhập.');
      }
    } catch (e) {
      setLocationError('Lỗi khi xác định vị trí từ địa chỉ.');
    } finally {
      setIsLocating(false);
    }
  };
  const handleSetDefault = async (addressId: string) => {
  try {
    setLoading(true);
      const res = await fetch('/api/v1/user/address/default', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ addressId })
    });
    const result = await res.json();
    if (result.success) {
      alert('Cập nhật địa chỉ mặc định thành công');
      await fetchAddresses();
    } else {
      alert(result.message || 'Không thể cập nhật địa chỉ mặc định');
    }
  } catch (error) {
    console.error('Error setting default address:', error);
    alert('Lỗi khi cập nhật địa chỉ mặc định');
  } finally {
    setLoading(false);
  }
};

  const openEdit = (order: any) => {
    setEditOrderId(order._id);
    setExpandedOrderId(order._id);
    setEditForm({
      fullName: order.shippingAddress?.fullName || '',
      phone: order.shippingAddress?.phone || '',
      address: order.shippingAddress?.address || '',
      city: order.shippingAddress?.city || '',
      district: order.shippingAddress?.district || '',
      ward: order.shippingAddress?.ward || '',
      paymentMethod: order.paymentMethod || 'cash',
      notes: order.notes || ''
    });
    setEditCoords({ lat: order.shippingCoords?.lat ?? null, lng: order.shippingCoords?.lng ?? null });
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Bạn có chắc muốn hủy đơn này?')) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const result = await res.json();
      if (result.success) {
        await fetchOrders();
      } else {
        alert(result.message || 'Không thể hủy đơn');
      }
    } catch (e: any) {
      alert('Lỗi khi hủy đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (orderId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/orders/${orderId}/reorder`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const result = await res.json();
      if (result.success) {
        alert('Đã tạo đơn mua lại');
        await fetchOrders();
      } else {
        alert(result.message || 'Không thể mua lại');
      }
    } catch (e: any) {
      alert('Lỗi khi mua lại');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const body: any = {
        shippingAddress: {
          fullName: editForm.fullName,
          phone: editForm.phone,
          address: editForm.address,
          city: editForm.city,
          district: editForm.district,
          ward: editForm.ward
        },
        notes: editForm.notes,
        paymentMethod: editForm.paymentMethod
      };
      if (editCoords.lat !== null && editCoords.lng !== null) {
        body.shippingCoords = { lat: editCoords.lat, lng: editCoords.lng };
      }
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (result.success) {
        setEditOrderId(null);
        await fetchOrders();
      } else {
        alert(result.message || 'Không thể cập nhật đơn');
      }
    } catch (e: any) {
      alert('Lỗi khi cập nhật đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Set dob from user data when component mounts
  useEffect(() => {
    if (user?.dob) {
      const date = new Date(user.dob);
      setDob(date.toISOString().split('T')[0]);
    }
    if (user?.gender) {
      setGender(user.gender);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'appointments') {
      fetchAppointments();
    } else if (activeTab === 'wishlist') {
      fetchWishlist();
    } else if (activeTab === 'addresses') {
      fetchAddresses();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      console.debug('fetchOrders using token:', token ? `${token.substring(0,8)}...` : null);
      if (!token) {
        setError('Bạn chưa đăng nhập — vui lòng đăng nhập để xem đơn hàng.');
        setOrders([]);
        return;
      }

      const response = await fetch('/api/v1/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/appointments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setAppointments(result.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/wishlist', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setWishlist(result.wishlist);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/user/getUser', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setAddresses(result.user.address);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Get values from input fields
      const updatedUserName = (document.querySelector('input[type="text"][placeholder="Enter your full name"]') as HTMLInputElement)?.value || user?.userName || '';
      const updatedNickname = (document.querySelector('input[type="text"][placeholder="Enter your nickname"]') as HTMLInputElement)?.value || user?.nickname || '';
      const updatedEmail = (document.querySelector('input[type="email"][placeholder="Enter your email"]') as HTMLInputElement)?.value || user?.email || '';
      const updatedPhone = (document.querySelector('input[type="tel"][placeholder="Enter your phone number"]') as HTMLInputElement)?.value || user?.phone || '';
      const updatedGender = gender; // Use state value for gender
      const updatedAddress = (document.querySelector('input[type="text"][placeholder="Enter your address"]') as HTMLInputElement)?.value || user?.defaultAddress || '';
      const updatedHfToken = (document.querySelector('input[id="hf-token"]') as HTMLInputElement)?.value || '';

      const formData = new FormData();
      formData.append('userId', user?._id || '');
      formData.append('userName', updatedUserName);
      formData.append('nickname', updatedNickname);
      formData.append('email', updatedEmail);
      formData.append('phone', updatedPhone);
      formData.append('gender', updatedGender);
      formData.append('dob', dob);
      formData.append('defaultAddress', updatedAddress);
      formData.append('huggingFaceToken', updatedHfToken); // Add token to form data
      if (profile) {
        formData.append('profile', profile);
      }

      const token = localStorage.getItem('user_token') || localStorage.getItem('admin_token') || localStorage.getItem('pharmacist_token');
      
      console.log("Retrieved token:", token); // DEBUG: Log the token
      if (!token) {
        alert("Authentication error: No token found. Please log in again.");
        return;
      }

      const response = await fetch('/api/v1/user/update-user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

        if (result.success) {
            alert('Profile updated successfully');
            // Update user data in AuthContext and localStorage
            const updatedUser = { ...user, ...result.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.location.reload(); // Reload to reflect changes
        } else {
        alert('Failed to update profile: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating your profile.');
    }
  };
  
  const getToken = () => {
    // Check common localStorage keys used across the app
    const keys = [
      'user_token',
      'admin_token',
      'pharmacist_token',
      'token',
      'access_token',
      'auth_token'
    ];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    // Also check nested user object (if app stored user JSON)
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const u = JSON.parse(userJson as string);
        if (u?.token) return u.token;
        if (u?.access_token) return u.access_token;
      }
    } catch (e) {
      // ignore parse errors
    }
    console.warn('No auth token found in localStorage (checked common keys). Requests may return 401.');
    return null;
  };

  // Notification state for user
  const [userNotification, setUserNotification] = useState<string | null>(null);

  // Setup WebSocket for user notifications (order status updates)
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const WS_PORT = (import.meta as any).env?.VITE_WS_PORT || 8002;
    const wsUrl = `ws://localhost:${WS_PORT}/?token=${token}`;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl as string);
    } catch (e) {
      console.error('WS connect error (user):', e);
    }
    if (!ws) return;
    ws.onopen = () => {
      console.log('User WS connected');
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'order_status_update') {
          const d = msg.data || {};
          const text = `Đơn #${String(d.orderId).slice(-6)} đã cập nhật: ${d.orderStatus || ''}`;
          setUserNotification(text);
          // Refresh order list if on orders tab
          if (activeTab === 'orders') fetchOrders();
          // auto-dismiss
          setTimeout(() => setUserNotification(null), 7000);
        }
      } catch (err) {
        console.error('Error parsing WS message (user):', err);
      }
    };
    ws.onclose = () => {
      console.log('User WS disconnected');
    };
    ws.onerror = (err) => {
      console.error('User WS error', err);
    };
    return () => { try { ws && ws.close(); } catch (e) {} };
  }, [activeTab]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... (lấy dữ liệu từ form)

    try {
      const token = getToken();
      if (!token) {
        alert('Authentication error. Please log in again.');
        return;
      }
      
      const formData = new FormData();
      // ... (append dữ liệu vào formData)

      const response = await fetch('/api/v1/user/update-user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert('Profile updated successfully');
        // Update user data in AuthContext and localStorage
        const updatedUser = { ...user, ...result.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.location.reload(); // Reload to reflect changes
      } else {
        alert('Failed to update profile: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating your profile.');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'orders', name: 'Orders', icon: Package },
    { id: 'appointments', name: 'Appointments', icon: Calendar },
    { id: 'wishlist', name: 'Wishlist', icon: Heart },
    { id: 'addresses', name: 'Addresses', icon: MapPin },
    { id: 'payment', name: 'Payment', icon: CreditCard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'delete-account', name: 'Delete Account', icon: AlertTriangle },
  ];

  useEffect(() => {
    // If redirected after OAuth with incomplete profile, show tooltip/banner
    const incomplete = localStorage.getItem('profileIncomplete') === '1';
    if (incomplete) {
      setActiveTab('profile');
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
       return (
         <div className="space-y-6">
           {localStorage.getItem('profileIncomplete') === '1' && (
             <div className="p-4 rounded border border-yellow-300 bg-yellow-50 text-yellow-800">
               Vui lòng hoàn thiện hồ sơ (họ tên, số điện thoại, địa chỉ) để sử dụng đầy đủ tính năng mua sắm.
             </div>
           )}
           <h2 className="text-2xl font-bold">Profile Information</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Full Name
               </label>
               <input
                 type="text"
                 defaultValue={user?.userName || ''}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 placeholder="Enter your full name"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Nickname
               </label>
               <input
                 type="text"
                 defaultValue={user?.nickname || ''}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 placeholder="Enter your nickname"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Gender
               </label>
               <StyledRadio
                 name="gender"
                 options={[
                   { value: 'male', label: 'Male' },
                   { value: 'female', label: 'Female' },
                   { value: 'other', label: 'Other' },
                 ]}
                 selectedValue={gender}
                 onChange={setGender}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Email
               </label>
               <input
                 type="email"
                 defaultValue={user?.email || ''}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 placeholder="Enter your email"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Phone
               </label>
               <input
                 type="tel"
                 defaultValue={user?.phone || ''}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 placeholder="Enter your phone number"
               />
             </div>
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Date of Birth
               </label>
               <input
                 type="date"
                 value={dob}
                 onChange={(e) => setDob(e.target.value)}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
               />
             </div>
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Address
               </label>
               <input
                 type="text"
                 defaultValue={user?.defaultAddress || ''}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 placeholder="Enter your address"
               />
             </div>
             <div className="md:col-span-2">
                <label htmlFor="hf-token" className="block text-sm font-medium text-gray-700 mb-2">
                    Hugging Face API Token
                </label>
                <input
                    type="password"
                    id="hf-token"
                    defaultValue={user?.huggingFaceToken || ''}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your Hugging Face token (e.g., hf_...)"
                />
                <p className="text-xs text-gray-500 mt-1">Your token is used for AI chat features and is stored securely.</p>
             </div>
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Profile Picture
               </label>
               <input
                 type="file"
                 accept="image/*"
                 onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setProfilePicture(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  } else {
                    setProfilePicture(null);
                  }
                }}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
               />
               {(profile || (user && user.profile)) && (
                 <div className="mt-2">
                   <img
                     src={profile || (user && user.profile) || ''}
                     alt="Current profile"
                     className="w-16 h-16 rounded-full object-cover"
                   />
                 </div>
               )}
             </div>
           </div>
           <button
             onClick={handleSaveChanges}
             className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
           >
             Save Changes
           </button>
         </div>
       );

      case 'orders':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Order History</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600">Start shopping to see your order history here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => {
                  const statusClass =
                    order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800';
                  const isExpanded = expandedOrderId === order._id;
                  const isEditing = editOrderId === order._id;
                  return (
                    <div key={order._id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">#{order._id.slice(-8).toUpperCase()}</h3>
                          <p className="text-gray-600">Ordered on {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClass}`}>
                          {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                        </span>
                      </div>

                      {/* Summary row */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{order.items.length} items</span>
                        <span className="font-semibold">{formatPrice(order.totalAmount)}</span>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap gap-2 justify-end">
                        <button
                          className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
                          onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                        >
                          {isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                        </button>
                        <button
                          onClick={() => handleReorder(order._id)}
                        >
                          <RotateCw className="h-4 w-4 mr-1" /> Mua lại
                        </button>
                      </div>

                      {/* Details */}
                      {isExpanded && (
                        <div className="mt-6 border-t pt-4 space-y-4">
                          {/* Items list */}
                          <div className="space-y-3">
                            {order.items.map((it: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3">
                                <img src={it.image} alt={it.name} className="w-12 h-12 rounded object-cover border" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    <Link to={`/product/${it.productId}`} className="text-blue-600 hover:underline">{it.name}</Link>
                                  </div>
                                  <div className="text-sm text-gray-600">Số lượng: {it.quantity}</div>
                                </div>
                                <div className="text-right text-sm font-medium">{formatPrice(it.price * it.quantity)}</div>
                              </div>
                            ))}
                          </div>

                          {/* Shipping and payment */}
                          {!isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded">
                                <div className="font-semibold mb-2">Địa chỉ giao hàng</div>
                                <div className="text-sm text-gray-700 space-y-1">
                                  <div>{order.shippingAddress?.fullName}</div>
                                  <div>{order.shippingAddress?.phone}</div>
                                  <div>{order.shippingAddress?.address}</div>
                                  <div>{order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.city}</div>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-4 rounded">
                                <div className="font-semibold mb-2">Thanh toán & Giao hàng</div>
                                <div className="text-sm text-gray-700 space-y-1">
                                  <div>Phương thức: {order.paymentMethod}</div>
                                  <div>Phí vận chuyển: {order.shippingCost === 0 ? 'Miễn phí' : formatPrice(order.shippingCost)}</div>
                                  <div>Tạm tính: {formatPrice(order.subtotal)}</div>
                                  <div className="font-medium">Tổng: {formatPrice(order.totalAmount)}</div>
                                  {typeof order.shippingDistanceKm === 'number' && <div>Khoảng cách: {order.shippingDistanceKm.toFixed(2)} km</div>}
                                  {order.estimatedDelivery && <div>Ước tính giao: {new Date(order.estimatedDelivery).toLocaleDateString('vi-VN')}</div>}
                                </div>
                              </div>
                              {order.notes && (
                                <div className="md:col-span-2 bg-yellow-50 p-4 rounded text-sm text-yellow-800">
                                  Ghi chú: {order.notes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-4 rounded space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                              <input className="w-full px-3 py-2 border rounded" value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
                              </div>
                              <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                              <input className="w-full px-3 py-2 border rounded" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                              </div>
                              <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                              <textarea className="w-full px-3 py-2 border rounded" rows={2} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
                              </div>
                              <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành</label>
                              <input className="w-full px-3 py-2 border rounded" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} />
                              </div>
                              <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                              <input className="w-full px-3 py-2 border rounded" value={editForm.district} onChange={e => setEditForm({ ...editForm, district: e.target.value })} />
                              </div>
                              <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã</label>
                              <input className="w-full px-3 py-2 border rounded" value={editForm.ward} onChange={e => setEditForm({ ...editForm, ward: e.target.value })} />
                              </div>
                              <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                              <select className="w-full px-3 py-2 border rounded" value={editForm.paymentMethod} onChange={e => setEditForm({ ...editForm, paymentMethod: e.target.value })}>
                              {paymentMethods.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                              </select>
                              </div>
                              <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                              <textarea className="w-full px-3 py-2 border rounded" rows={2} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                              </div>
                              <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Toạ độ giao hàng (tuỳ chọn)</label>
                              <div className="flex items-end gap-2">
                              <div>
                              <span className="block text-xs text-gray-600 mb-1">Lat</span>
                              <input type="number" step="any" className="px-3 py-2 border rounded" value={editCoords.lat ?? ''} onChange={(e)=> setEditCoords({ ...editCoords, lat: e.target.value ? parseFloat(e.target.value) : null })} />
                              </div>
                              <div>
                              <span className="block text-xs text-gray-600 mb-1">Lng</span>
                              <input type="number" step="any" className="px-3 py-2 border rounded" value={editCoords.lng ?? ''} onChange={(e)=> setEditCoords({ ...editCoords, lng: e.target.value ? parseFloat(e.target.value) : null })} />
                              </div>
                              <button type="button" onClick={geocodeFromEditAddress} disabled={isLocating} className="px-3 py-2 border rounded bg-white hover:bg-gray-50">{isLocating ? 'Đang lấy toạ độ...' : 'Tính theo địa chỉ'}</button>
                              <button type="button" onClick={()=> setEditCoords({ lat: null, lng: null })} className="px-3 py-2 border rounded bg-white hover:bg-gray-50">Xoá toạ độ</button>
                              </div>
                              {!mapboxToken && <div className="text-xs text-gray-500 mt-1">Cần cấu hình VITE_MAPBOX_TOKEN để geocode theo địa chỉ. Có thể nhập lat/lng thủ công.</div>}
                              {locationError && <div className="text-sm text-red-600 mt-1">{locationError}</div>}
                              </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button className="px-4 py-2 border rounded" onClick={() => setEditOrderId(null)}>Hủy</button>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => handleUpdateOrder(order._id)}>Lưu thay đổi</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'appointments':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Appointments</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading appointments...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
                <p className="text-gray-600">Book an appointment to see your schedule here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment: any) => (
                  <div key={appointment._id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{appointment.patientName}</h3>
                        <div className="flex items-center text-gray-600 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(appointment.appointmentDate).toLocaleDateString('vi-VN')}
                          <span className="mx-2">•</span>
                          <Clock className="h-4 w-4 mr-1" />
                          {appointment.appointmentTime}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Department:</span> {appointment.department}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Type:</span> {appointment.appointmentType}
                      </p>
                      {appointment.symptoms && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Symptoms:</span> {appointment.symptoms}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'wishlist':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Wishlist</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading wishlist...</p>
              </div>
            ) : wishlist.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
                <p className="text-gray-600">Add items to your wishlist to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlist.map((item: any) => (
                  <div key={item._id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4">
                        <img src={item.productImage[0]} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.name}</h3>
                    <p className="text-blue-600 font-bold mb-3">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(item.price)}
                    </p>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "addresses":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Saved Addresses</h2>
            </div>

            {/* Add New Address Form */}
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-3">Thêm địa chỉ mới</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    fetchSuggestions(e.target.value);
                  }}
                  placeholder="Nhập địa chỉ"
                  className="w-full border rounded p-2"
                />

                {suggestions.length > 0 && (
                  <ul className="border rounded bg-white shadow mt-1 max-h-48 overflow-y-auto">
                    {suggestions.map((item) => (
                      <li
                        key={item.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setQuery(item.place_name);
                          setSuggestions([]);

                          const [lng, lat] = item.center;
                          const selected = {
                            address: item.place_name,
                            city:
                              item.context?.find((c: any) =>
                                c.id.startsWith("place")
                              )?.text || "",
                            district:
                              item.context?.find((c: any) =>
                                c.id.startsWith("district")
                              )?.text || "",
                            ward:
                              item.context?.find((c: any) =>
                                c.id.startsWith("neighborhood")
                              )?.text || "",
                            lat,
                            lng,
                          };

                          setNewAddress((prev) => ({ ...prev, ...selected }));
                        }}
                      >
                        {item.place_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={newAddress.phone || ""}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Nhập số điện thoại"
                  className="w-full border rounded p-2"
                />
              </div>

              <button
                onClick={handleAddAddress}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Lưu địa chỉ
              </button>
            </div>

            {/* Hiển thị danh sách địa chỉ đã lưu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className={`border rounded-lg p-4 ${
                    address._id === defaultAddress ? "border-green-500" : ""
                  }`}
                >
                  <p className="font-medium">{address.address}</p>
                  <p className="text-sm text-gray-500">
                    {address.city}, {address.district}, {address.ward}
                  </p>
                  <p className="text-sm">📞 {address.phone}</p>

                  {address._id === defaultAddress ? (
                    <span className="text-green-600 font-semibold text-sm">
                      Mặc định
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(address._id)}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                    >
                      Đặt làm mặc định
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'delete-account':
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-red-800 mb-2">
                    Xóa tài khoản vĩnh viễn
                  </h2>
                  <p className="text-red-700 mb-4">
                    Hành động này sẽ xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn. 
                    Không thể hoàn tác sau khi xóa.
                  </p>
                  <Link
                    to="/delete-account"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium inline-flex items-center"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Xóa tài khoản
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Các lựa chọn khác
              </h3>
              <p className="text-blue-700 mb-4">
                Trước khi xóa tài khoản, bạn có thể:
              </p>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Chỉnh sửa thông tin cá nhân</li>
                <li>Thay đổi mật khẩu</li>
                <li>Liên hệ hỗ trợ để được tư vấn</li>
                <li>Xuất dữ liệu trước khi xóa</li>
              </ul>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">{tabs.find(tab => tab.id === activeTab)?.name}</h2>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={user?.profile || 'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-image-182145777.jpg'}
                alt="User Avatar"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold">
                  {user?.userName}
                </h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
      {/* Toast notification for order status updates */}
      {userNotification && (
        <div className="fixed right-6 top-6 z-50">
          <div className="bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
            {userNotification}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;