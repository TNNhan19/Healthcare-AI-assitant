import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Package, BarChart3, Settings, 
  Plus, Edit, Trash, Eye, Search, Filter,
  UserCheck, UserX, ShoppingCart, DollarSign,
  AlertCircle, CheckCircle, Grid3X3, List, Clock, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';

// Declare global window property for search timeout
declare global {
  interface Window {
    searchTimeout: number;
  }
}

interface AdminDashboardProps {}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [productViewMode, setProductViewMode] = useState<'grid' | 'table'>('grid');
  const [usersData, setUsersData] = useState<any>({ data: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 } });
  const [userFilters, setUserFilters] = useState<{ q: string; type: string; active: string }>({ q: '', type: '', active: '' });
  const [ordersData, setOrdersData] = useState<{ data: any[]; pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number } }>({ 
    data: [], 
    pagination: { 
      currentPage: 1, 
      totalPages: 1, 
      totalItems: 0, 
      itemsPerPage: 20 
    } 
  });
  const [orderFilters, setOrderFilters] = useState<{ q: string; status: string }>({ q: '', status: '' });
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Modal states for detail views
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
  // User modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // User statistics state
  const [userStats, setUserStats] = useState<{ [userId: string]: { totalOrders: number; totalSpent: number } }>({});

  // Categories data (you should fetch this from API or define statically)
  const categories = {
    'thuc-pham-chuc-nang': ['vitamin-khoang-chat', 'ho-tro-tieu-hoa', 'bo-nao', 'bo-tro-xuong-khop', 'bo-gan-thanh-nhiet', 'lam-dep-giam-can', 'ho-tro-tim-mach'],
    'duoc-my-pham': ['duong-da-duong-moi', 'tri-mun-ngua-seo-mo-tham'],
    'cham-soc-ca-nhan': ['cham-soc-rang-mieng', 'cham-soc-mat-tai-mui-hong'],
    'thiet-bi-dung-cu-y-te': ['bong-gon-bang-gac-gang-tay', 'mieng-dan-giam-dau-ha-sot', 'nuoc-muoi-dung-dich-sat-trung']
  };

  // Category mapping functions
  const categorySlugToName = {
    'thuc-pham-chuc-nang': 'Thực phẩm chức năng',
    'duoc-my-pham': 'Dược mỹ phẩm', 
    'cham-soc-ca-nhan': 'Chăm sóc cá nhân',
    'thiet-bi-dung-cu-y-te': 'Thiết bị, dụng cụ y tế'
  };

  const subCategorySlugToName = {
    // Thực phẩm chức năng
    'vitamin-khoang-chat': 'Vitamin và khoáng chất',
    'ho-tro-tieu-hoa': 'Hỗ trợ tiêu hóa',
    'bo-nao': 'Bổ não',
    'bo-tro-xuong-khop': 'Bổ trợ xương khớp',
    'bo-gan-thanh-nhiet': 'Bổ gan, thanh nhiệt',
    'lam-dep-giam-can': 'Làm đẹp, giảm cân',
    'ho-tro-tim-mach': 'Hỗ trợ tim mạch',
    // Dược mỹ phẩm
    'duong-da-duong-moi': 'Dưỡng da, dưỡng môi',
    'tri-mun-ngua-seo-mo-tham': 'Trị mụn, ngừa sẹo, mờ thâm',
    // Chăm sóc cá nhân
    'cham-soc-rang-mieng': 'Chăm sóc răng miệng',
    'cham-soc-mat-tai-mui-hong': 'Chăm sóc mắt, tai, mũi, họng',
    // Thiết bị, dụng cụ y tế
    'bong-gon-bang-gac-gang-tay': 'Bông gòn, băng gạc, găng tay',
    'mieng-dan-giam-dau-ha-sot': 'Miếng dán, giảm đau, hạ sốt',
    'nuoc-muoi-dung-dich-sat-trung': 'Nước muối, dung dịch, dung dịch sát trùng'
  };

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (userFilters.q) params.set('q', userFilters.q);
      if (userFilters.type) params.set('type', userFilters.type);
      if (userFilters.active) params.set('active', userFilters.active);
      const res = await fetch(`/api/v1/user?${params.toString()}`, { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } });
      const json = await res.json();
      if (json.success) setUsersData(json);
      else alert(json.message || 'Không thể tải danh sách người dùng');
    } catch (e) {
      console.error('load users error', e);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, body: any) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/user/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) await loadUsers(usersData.pagination.currentPage);
      else alert(json.message || 'Cập nhật người dùng thất bại');
    } catch (e) {
      console.error('update user error', e);
    } finally {
      setLoading(false);
    }
  };

  // Load user statistics (orders and spending)
  const loadUserStats = async (userId: string) => {
    try {
      console.log('Loading stats for user:', userId);
      
      // Try to fetch user's orders from API
      const response = await fetch(`/api/v1/orders/user/${userId}/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('User stats API response:', result);
        
        if (result.success) {
          const stats = {
            totalOrders: result.data.totalOrders || 0,
            totalSpent: result.data.totalSpent || 0
          };
          
          setUserStats(prev => ({
            ...prev,
            [userId]: stats
          }));
          
          return stats;
        }
      }
      
      console.log('User stats API failed, falling back to orderService');
      // Fallback: Load all orders and filter by user
      const allOrders = await orderService.getOrders();
      console.log(`Loaded ${allOrders.length} total orders for filtering`);
      
      // Filter orders by user ID
      const userOrders = allOrders.filter((order: any) => 
        order.user?._id === userId || order.user?.id === userId || order.userId === userId
      );
      
      console.log(`Found ${userOrders.length} orders for user ${userId}`);
      
      // Calculate statistics
      // Count orders (exclude cancelled orders)
      const validOrders = userOrders.filter((order: any) => 
        order.orderStatus !== 'cancelled'
      );
      
      // Calculate total spent (only from delivered orders)
      const deliveredOrders = userOrders.filter((order: any) => 
        order.orderStatus === 'delivered'
      );
      
      const totalOrders = validOrders.length;
      const totalSpent = deliveredOrders.reduce((sum: number, order: any) => 
        sum + (order.totalAmount || 0), 0
      );
      
      console.log(`User ${userId} stats: ${totalOrders} orders, ${totalSpent} spent`);
      
      const stats = { totalOrders, totalSpent };
      
      // Update state
      setUserStats(prev => ({
        ...prev,
        [userId]: stats
      }));
      
      return stats;
      
    } catch (err) {
      console.error('Error loading user stats:', err);
      return { totalOrders: 0, totalSpent: 0 };
    }
  };

  // Products state and loaders
  const [productQuery, setProductQuery] = useState('');
  const [productsData, setProductsData] = useState<{ data: any[]; pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number } }>({ data: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 } });
  const [productLoading, setProductLoading] = useState(false);

  // Helper function to safely calculate pagination numbers
  const safePaginationNumber = (num: any, fallback = 0) => {
    const parsed = parseInt(String(num));
    return isNaN(parsed) || parsed < 0 ? fallback : parsed;
  };

  // Reset filters functions
  const resetUserFilters = useCallback(() => {
    // Reset state immediately
    setUserFilters({ q: '', type: '', active: '' });
    // Small delay to ensure state is updated before reload
    setTimeout(() => {
      loadUsers(1);
    }, 50);
  }, []);

  const resetProductFilters = useCallback(() => {
    // Reset state immediately
    setProductQuery('');
    // Small delay to ensure state is updated before reload
    setTimeout(() => {
      loadProducts(1);
    }, 50);
  }, []);

  const resetOrderFilters = useCallback(() => {
    // Reset state immediately
    setOrderFilters({ q: '', status: '' });
    // Small delay to ensure state is updated before reload
    setTimeout(() => {
      loadOrders(1);
    }, 50);
  }, []);

  const loadProducts = async (page = 1) => {
    try {
      setProductLoading(true);
      const res = await productService.getProducts({ page, limit: 20, search: productQuery });
      setProductsData(res);
    } catch (e) {
      console.error('load products error', e);
    } finally {
      setProductLoading(false);
    }
  };

  const loadOrders = async (page = 1) => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${localStorage.getItem('admin_token')}` };
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (orderFilters.q) params.set('q', orderFilters.q);
      if (orderFilters.status) params.set('status', orderFilters.status);
      
      const res = await fetch(`/api/v1/orders/admin/all?${params.toString()}`, { headers });
      const json = await res.json();
      
      console.log('Orders API Response:', json); // Debug log
      
      if (json.success && json.data) {
        // Chuyển đổi từ API response format sang format mong đợi
        const paginationData = {
          currentPage: safePaginationNumber(json.pagination?.currentPage, page),
          totalPages: safePaginationNumber(json.pagination?.totalPages, 1),
          totalItems: safePaginationNumber(json.pagination?.totalOrders || json.pagination?.totalItems, 0),
          itemsPerPage: safePaginationNumber(json.pagination?.itemsPerPage, 20)
        };
        
        console.log('Converted pagination:', paginationData); // Debug log
        
        setOrdersData({
          data: json.data || [],
          pagination: paginationData
        });
      } else {
        console.error('Load orders failed:', json.message);
        setOrdersData({ 
          data: [], 
          pagination: { 
            currentPage: 1, 
            totalPages: 1, 
            totalItems: 0, 
            itemsPerPage: 20 
          } 
        });
      }
    } catch (e) {
      console.error('load orders error', e);
      setOrdersData({ 
        data: [], 
        pagination: { 
          currentPage: 1, 
          totalPages: 1, 
          totalItems: 0, 
          itemsPerPage: 20 
        } 
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) return;
    try {
      setProductLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/v1/products/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Delete product error:', errorText);
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        if (!json.success) {
          alert(json.message || 'Xóa sản phẩm thất bại');
          return;
        }
      }
      
      alert('Xóa sản phẩm thành công!');
      await loadProducts(productsData.pagination.currentPage);
    } catch (e) {
      console.error('delete product error', e);
      if (e instanceof Error) {
        alert(`Lỗi xóa sản phẩm: ${e.message}`);
      } else {
        alert('Có lỗi xảy ra khi xóa sản phẩm');
      }
    } finally {
      setProductLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/v1/user/deleteAccount/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Delete user error:', errorText);
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        if (!json.success) {
          alert(json.message || 'Xóa người dùng thất bại');
          return;
        }
      }
      
      alert('Xóa người dùng thành công!');
      await loadUsers(usersData.pagination.currentPage);
    } catch (e) {
      console.error('delete user error', e);
      if (e instanceof Error) {
        alert(`Lỗi xóa người dùng: ${e.message}`);
      } else {
        alert('Có lỗi xảy ra khi xóa người dùng');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add Product function
  const handleAddProduct = useCallback(async (formData: any) => {
    try {
      setProductLoading(true);
      const token = localStorage.getItem('admin_token');
      
      // Check if token exists
      if (!token) {
        alert('Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.');
        window.location.href = '/auth';
        return;
      }
      
      // Debug frontend data
      console.log('=== FRONTEND STOCK DEBUG ===');
      console.log('Raw form stock input:', formData.stock);
      console.log('Type of form stock:', typeof formData.stock);
      console.log('Parsed stock value:', parseInt(formData.stock));
      console.log('ParseFloat result:', parseFloat(formData.stock));
      console.log('============================');
      
      const productPayload = {
        // Basic required fields
        name: formData.name || '',
        soDangKy: formData.soDangKy || '',
        main_category: categorySlugToName[formData.main_category as keyof typeof categorySlugToName] || formData.main_category || '',
        sub_category: subCategorySlugToName[formData.sub_category as keyof typeof subCategorySlugToName] || formData.sub_category || '',
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        
        // Complete product information - maintain all fields with null if empty
        description: formData.description || null,
        imageUrl: formData.imageUrl || null,
        linkChiTiet: formData.linkChiTiet || null,
        usageGuideHref: formData.usageGuideHref || null,
        usageGuideImage: formData.usageGuideImage || null,
        
        // Company and manufacturing info
        congTy: formData.congTy || null,
        congTyDangKy: formData.congTyDangKy || null,
        congTySanXuat: formData.congTySanXuat || null,
        brand: formData.brand || formData.thuongHieu || null,
        quocGia: formData.quocGia || null,
        
        // Product specification details
        dangBaoChe: formData.dangBaoChe || null,
        dongGoi: formData.dongGoi || formData.cachDongGoi || null,
        hanSuDung: formData.hanSuDung || formData.hanDung || null,
        thanhPhan: formData.thanhPhan || formData.hoatChatChinh || null,
        huongDan: formData.huongDan || null,
        
        // Alternative field names for compatibility
        hoatChatChinh: formData.hoatChatChinh || null,
        thuongHieu: formData.thuongHieu || null,
        nhaSanXuat: formData.nhaSanXuat || null,
        cachDongGoi: formData.cachDongGoi || null,
        hanDung: formData.hanDung || null,
        
        // Stats and status
        paid: parseInt(formData.paid) || 0,
        view: parseInt(formData.view) || 0,
        embedding_status: formData.embedding_status || 'pending',
        
        // Product info object
        product_info: {
          ingredients: formData.product_info?.ingredients || null,
          usage: formData.product_info?.usage || null,
          dosage: formData.product_info?.dosage || null,
          sideEffects: formData.product_info?.sideEffects || null,
          contraindications: formData.product_info?.contraindications || null,
          storage: formData.product_info?.storage || null
        },
        
        // Details object for extensibility
        details: {
          thanhPhanChinh: formData.hoatChatChinh || null,
          thuongHieu: formData.thuongHieu || null,
          nhaSanXuat: formData.nhaSanXuat || null,
          quocGia: formData.quocGia || null,
          cachDongGoi: formData.cachDongGoi || null,
          hanDung: formData.hanDung || null,
          dangBaoChe: formData.dangBaoChe || null,
          congTy: formData.congTy || null,
          congTyDangKy: formData.congTyDangKy || null,
          congTySanXuat: formData.congTySanXuat || null,
          huongDan: formData.huongDan || null,
          linkChiTiet: formData.linkChiTiet || null,
          usageGuideHref: formData.usageGuideHref || null,
          usageGuideImage: formData.usageGuideImage || null
        }
      };

      // Debug payload
      console.log('Original form data:', formData);
      console.log('Category conversion:', formData.main_category, '->', productPayload.main_category);
      console.log('Sub-category conversion:', formData.sub_category, '->', productPayload.sub_category);
      console.log('Final payload:', productPayload);
      console.log('Token exists:', !!token);
      console.log('Token preview:', token.substring(0, 20) + '...');

      console.log('Starting API call to:', '/api/v1/products/create');
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token ? token.substring(0, 20) + '...' : 'NO_TOKEN'}`
      });
      console.log('Request body:', JSON.stringify(productPayload, null, 2));

      const res = await fetch('/api/v1/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productPayload)
      });

      console.log('Response status:', res.status, res.statusText);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      // Check if response is OK and content-type is JSON
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server response error:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error === 'jwt malformed' || errorJson.message === 'Token verification failed') {
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            // Redirect to login or clear token
            localStorage.removeItem('admin_token');
            window.location.href = '/auth';
            return;
          }
          throw new Error(errorJson.message || `HTTP ${res.status}: ${res.statusText}`);
        } catch (parseError) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await res.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error('Server không trả về JSON response');
      }

      const json = await res.json();
      
      // Debug response
      console.log('API Response:', json);
      console.log('Response success:', json.success);
      console.log('Response message:', json.message);
      console.log('Response error:', json.error);
      
      if (json.success) {
        alert('Thêm sản phẩm thành công!');
        setShowAddProductModal(false);
        await loadProducts(1);
      } else {
        const errorMessage = json.message || json.error || 'Thêm sản phẩm thất bại';
        console.error('API returned success: false');
        console.error('Full API response:', json);
        console.error('Error message:', errorMessage);
        console.error('Error details:', json.error);
        console.error('Error code:', json.errorCode);
        console.error('Validation details:', json.details);
        
        if (json.error === 'jwt malformed' || json.message === 'Token verification failed') {
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          localStorage.removeItem('admin_token');
          window.location.href = '/auth';
          return;
        }
        
        // Show more detailed error to user based on error code
        if (json.errorCode === 'DUPLICATE_KEY') {
          alert(`❌ ${json.message}`);
        } else if (json.errorCode === 'VALIDATION_ERROR') {
          alert(`❌ Dữ liệu không hợp lệ:\n${(json.details || []).join('\n')}`);
        } else if (json.errorCode === 'SERVER_ERROR') {
          alert(`❌ Lỗi server: ${json.message}`);
        } else if (json.error && json.message) {
          alert(`❌ Lỗi: ${json.message}\nChi tiết: ${json.error}`);
        } else {
          alert(`❌ ${errorMessage}`);
        }
      }
    } catch (e) {
      console.error('add product error', e);
      if (e instanceof Error) {
        if (e.message.includes('JSON')) {
          alert('Lỗi server: Không thể kết nối đến API. Vui lòng kiểm tra server backend.');
        } else {
          alert(`Có lỗi xảy ra: ${e.message}`);
        }
      } else {
        alert('Có lỗi xảy ra khi thêm sản phẩm');
      }
    } finally {
      setProductLoading(false);
    }
  }, []);

  // Edit Product function
  const handleEditProduct = useCallback(async (formData: any) => {
    try {
      setProductLoading(true);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        alert('Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.');
        window.location.href = '/auth';
        return;
      }
      
      const productPayload = {
        // Basic required fields
        name: formData.name || '',
        soDangKy: formData.soDangKy || '',
        main_category: categorySlugToName[formData.main_category as keyof typeof categorySlugToName] || formData.main_category || '',
        sub_category: subCategorySlugToName[formData.sub_category as keyof typeof subCategorySlugToName] || formData.sub_category || '',
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        
        // Complete product information - maintain all fields with null if empty
        description: formData.description || null,
        imageUrl: formData.imageUrl || null,
        linkChiTiet: formData.linkChiTiet || null,
        usageGuideHref: formData.usageGuideHref || null,
        usageGuideImage: formData.usageGuideImage || null,
        
        // Company and manufacturing info
        congTy: formData.congTy || null,
        congTyDangKy: formData.congTyDangKy || null,
        congTySanXuat: formData.congTySanXuat || null,
        brand: formData.brand || formData.thuongHieu || null,
        quocGia: formData.quocGia || null,
        
        // Product specification details
        dangBaoChe: formData.dangBaoChe || null,
        dongGoi: formData.dongGoi || formData.cachDongGoi || null,
        hanSuDung: formData.hanSuDung || formData.hanDung || null,
        thanhPhan: formData.thanhPhan || formData.hoatChatChinh || null,
        huongDan: formData.huongDan || null,
        
        // Alternative field names for compatibility
        hoatChatChinh: formData.hoatChatChinh || null,
        thuongHieu: formData.thuongHieu || null,
        nhaSanXuat: formData.nhaSanXuat || null,
        cachDongGoi: formData.cachDongGoi || null,
        hanDung: formData.hanDung || null,
        
        // Stats and status
        paid: parseInt(formData.paid) || 0,
        view: parseInt(formData.view) || 0,
        embedding_status: formData.embedding_status || 'pending',
        
        // Product info object
        product_info: {
          ingredients: formData.product_info?.ingredients || null,
          usage: formData.product_info?.usage || null,
          dosage: formData.product_info?.dosage || null,
          sideEffects: formData.product_info?.sideEffects || null,
          contraindications: formData.product_info?.contraindications || null,
          storage: formData.product_info?.storage || null
        },
        
        // Details object for extensibility
        details: {
          thanhPhanChinh: formData.hoatChatChinh || null,
          thuongHieu: formData.thuongHieu || null,
          nhaSanXuat: formData.nhaSanXuat || null,
          quocGia: formData.quocGia || null,
          cachDongGoi: formData.cachDongGoi || null,
          hanDung: formData.hanDung || null,
          dangBaoChe: formData.dangBaoChe || null,
          congTy: formData.congTy || null,
          congTyDangKy: formData.congTyDangKy || null,
          congTySanXuat: formData.congTySanXuat || null,
          huongDan: formData.huongDan || null,
          linkChiTiet: formData.linkChiTiet || null,
          usageGuideHref: formData.usageGuideHref || null,
          usageGuideImage: formData.usageGuideImage || null
        }
      };

      console.log('Updating product with ID:', editingProduct._id);
      console.log('Update payload:', productPayload);

      const res = await fetch(`/api/v1/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productPayload)
      });

      console.log('Update response status:', res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server response error:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error === 'jwt malformed' || errorJson.message === 'Token verification failed') {
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            localStorage.removeItem('admin_token');
            window.location.href = '/auth';
            return;
          }
          throw new Error(errorJson.message || `HTTP ${res.status}: ${res.statusText}`);
        } catch (parseError) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await res.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error('Server không trả về JSON response');
      }

      const json = await res.json();
      console.log('Update API Response:', json);
      
      if (json.success) {
        alert('Cập nhật sản phẩm thành công!');
        setShowEditProductModal(false);
        setEditingProduct(null);
        await loadProducts(productsData.pagination.currentPage);
      } else {
        const errorMessage = json.message || json.error || 'Cập nhật sản phẩm thất bại';
        console.error('API returned success: false');
        console.error('Error message:', errorMessage);
        
        if (json.error === 'jwt malformed' || json.message === 'Token verification failed') {
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          localStorage.removeItem('admin_token');
          window.location.href = '/auth';
          return;
        }
        
        alert(`❌ ${errorMessage}`);
      }
    } catch (e) {
      console.error('edit product error', e);
      if (e instanceof Error) {
        if (e.message.includes('JSON')) {
          alert('Lỗi server: Không thể kết nối đến API. Vui lòng kiểm tra server backend.');
        } else {
          alert(`Có lỗi xảy ra: ${e.message}`);
        }
      } else {
        alert('Có lỗi xảy ra khi cập nhật sản phẩm');
      }
    } finally {
      setProductLoading(false);
    }
  }, [editingProduct, productsData.pagination.currentPage]);

  // Function to open edit modal
  const openEditProductModal = useCallback((product: any) => {
    setEditingProduct(product);
    setShowEditProductModal(true);
  }, []);

  // User management functions
  const handleAddUser = useCallback(async (formData: any) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        alert('Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.');
        window.location.href = '/auth';
        return;
      }

      const userPayload = {
        userName: formData.userName || '',
        email: formData.email || '',
        phone: formData.phone || '',
        userType: formData.userType || 'client',
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        password: formData.password || '',
        addresses: formData.addresses || []
      };

      console.log('Creating user with payload:', userPayload);

      const res = await fetch('/api/v1/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userPayload)
      });

      console.log('Create user response status:', res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server response error:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error === 'jwt malformed' || errorJson.message === 'Token verification failed') {
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            localStorage.removeItem('admin_token');
            window.location.href = '/auth';
            return;
          }
          throw new Error(errorJson.message || `HTTP ${res.status}: ${res.statusText}`);
        } catch (parseError) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await res.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error('Server không trả về JSON response');
      }

      const json = await res.json();
      console.log('Create user API Response:', json);
      
      if (json.success) {
        alert('Thêm người dùng thành công!');
        setShowAddUserModal(false);
        await loadUsers(1);
      } else {
        const errorMessage = json.message || json.error || 'Thêm người dùng thất bại';
        console.error('API returned success: false');
        console.error('Error message:', errorMessage);
        
        if (json.error === 'jwt malformed' || json.message === 'Token verification failed') {
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          localStorage.removeItem('admin_token');
          window.location.href = '/auth';
          return;
        }
        
        alert(`❌ ${errorMessage}`);
      }
    } catch (e) {
      console.error('add user error', e);
      if (e instanceof Error) {
        if (e.message.includes('JSON')) {
          alert('Lỗi server: Không thể kết nối đến API. Vui lòng kiểm tra server backend.');
        } else {
          alert(`Có lỗi xảy ra: ${e.message}`);
        }
      } else {
        alert('Có lỗi xảy ra khi thêm người dùng');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEditUser = useCallback(async (formData: any) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        alert('Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.');
        window.location.href = '/auth';
        return;
      }

      const userPayload: any = {
        userName: formData.userName || '',
        email: formData.email || '',
        phone: formData.phone || '',
        userType: formData.userType || 'client',
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        address: formData.address || '' // Gửi address thay vì addresses
      };

      // Only include password if it's provided
      if (formData.password && formData.password.trim() !== '') {
        userPayload.password = formData.password;
      }

      console.log('Updating user with ID:', editingUser._id);
      console.log('Update payload:', userPayload);

      const res = await fetch(`/api/v1/user/${editingUser._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userPayload)
      });

      console.log('Update user response status:', res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server response error:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error === 'jwt malformed' || errorJson.message === 'Token verification failed') {
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            localStorage.removeItem('admin_token');
            window.location.href = '/auth';
            return;
          }
          throw new Error(errorJson.message || `HTTP ${res.status}: ${res.statusText}`);
        } catch (parseError) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await res.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error('Server không trả về JSON response');
      }

      const json = await res.json();
      console.log('Update user API Response:', json);
      
      if (json.success) {
        alert('Cập nhật người dùng thành công!');
        setShowEditUserModal(false);
        setEditingUser(null);
        await loadUsers(usersData.pagination.currentPage);
      } else {
        const errorMessage = json.message || json.error || 'Cập nhật người dùng thất bại';
        console.error('API returned success: false');
        console.error('Error message:', errorMessage);
        
        if (json.error === 'jwt malformed' || json.message === 'Token verification failed') {
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          localStorage.removeItem('admin_token');
          window.location.href = '/auth';
          return;
        }
        
        alert(`❌ ${errorMessage}`);
      }
    } catch (e) {
      console.error('edit user error', e);
      if (e instanceof Error) {
        if (e.message.includes('JSON')) {
          alert('Lỗi server: Không thể kết nối đến API. Vui lòng kiểm tra server backend.');
        } else {
          alert(`Có lỗi xảy ra: ${e.message}`);
        }
      } else {
        alert('Có lỗi xảy ra khi cập nhật người dùng');
      }
    } finally {
      setLoading(false);
    }
  }, [editingUser, usersData.pagination.currentPage]);

  // Function to open edit user modal
  const openEditUserModal = useCallback((user: any) => {
    console.log('=== OPENING EDIT USER MODAL ===');
    console.log('User to edit:', user);
    console.log('User address field:', user?.address);
    console.log('===========================');
    setEditingUser(user);
    setShowEditUserModal(true);
  }, []);

  useEffect(() => { loadUsers(1); }, []);
  useEffect(() => { loadProducts(1); }, []);
  useEffect(() => { loadOrders(1); }, []);

  // Handle tab change with data loading
  const handleTabChange = useCallback(async (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'users' && (!usersData.data || usersData.data.length === 0)) {
      await loadUsers(1);
    } else if (tabId === 'products' && (!productsData.data || productsData.data.length === 0)) {
      await loadProducts(1);
    } else if (tabId === 'orders' && (!ordersData.data || ordersData.data.length === 0)) {
      await loadOrders(1);
    } else if (tabId === 'overview') {
      loadDashboardData();
    }
  }, [usersData.data?.length, productsData.data?.length, ordersData.data?.length]);

  // User Detail Modal Component
  const UserDetailModal = ({ user: userData, onClose }: { user: any; onClose: () => void }) => {
    const [currentUserStats, setCurrentUserStats] = useState<{ totalOrders: number; totalSpent: number } | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    
    // Load user statistics when modal opens
    useEffect(() => {
      if (userData?._id) {
        const loadStats = async () => {
          setStatsLoading(true);
          try {
            // Check if we already have stats for this user
            if (userStats[userData._id]) {
              setCurrentUserStats(userStats[userData._id]);
            } else {
              // Load fresh stats
              const stats = await loadUserStats(userData._id);
              setCurrentUserStats(stats);
            }
          } catch (err) {
            console.error('Error loading user stats:', err);
            setCurrentUserStats({ totalOrders: 0, totalSpent: 0 });
          } finally {
            setStatsLoading(false);
          }
        };
        
        loadStats();
      }
    }, [userData?._id]);
    
    // Debug log to check userData structure
    console.log('UserDetailModal userData:', userData);
    
    if (!userData) {
      return null;
    }

    return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Chi tiết người dùng</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* User Avatar */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {(userData.userName || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{userData.userName}</h3>
              <p className="text-gray-600">{userData.email}</p>
            </div>
          </div>

          {/* User Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID người dùng</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-mono text-sm">
                {userData._id}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {userData.phone || 'Chưa cập nhật'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại tài khoản</label>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                userData.userType === 'admin' 
                  ? 'bg-purple-100 text-purple-800'
                  : userData.userType === 'pharmacist'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {userData.userType === 'admin' ? 'Quản trị viên' :
                 userData.userType === 'pharmacist' ? 'Dược sĩ' : 'Khách hàng'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                userData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userData.isActive ? (
                  <>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Hoạt động
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4 mr-1" />
                    Bị khóa
                  </>
                )}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {userData.createdAt ? new Date(userData.createdAt).toLocaleString('vi-VN') : 'Không có thông tin'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cập nhật cuối</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {userData.updatedAt ? new Date(userData.updatedAt).toLocaleString('vi-VN') : 'Chưa cập nhật'}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {(() => {
                console.log('=== ADDRESS DEBUG START ===');
                console.log('userData.address:', userData.address);
                
                if (userData.address && Array.isArray(userData.address) && userData.address.length > 0) {
                  const firstAddress = userData.address[0];
                  console.log('First address object:', firstAddress);
                  
                  let addressDisplay = '';
                  
                  if (typeof firstAddress === 'string') {
                    addressDisplay = firstAddress;
                  } else if (firstAddress && typeof firstAddress === 'object') {
                    // Check if this object has numeric keys (character-indexed object)
                    const numericKeys = Object.keys(firstAddress)
                      .filter(key => !isNaN(Number(key)) && key !== 'lat' && key !== 'lng' && key !== '_id')
                      .sort((a, b) => Number(a) - Number(b));
                    
                    console.log('Numeric keys found:', numericKeys.slice(0, 5), '... total:', numericKeys.length);
                    
                    if (numericKeys.length > 0) {
                      // This is a character-indexed object, reconstruct the string
                      addressDisplay = numericKeys
                        .map(key => firstAddress[key])
                        .filter(char => char !== null && char !== undefined && char !== '')
                        .join('');
                      console.log('Reconstructed from numeric keys:', addressDisplay);
                    } else if (firstAddress.address) {
                      // Try the 'address' property
                      addressDisplay = String(firstAddress.address);
                    } else {
                      // Get all string values (excluding special keys)
                      const values = Object.entries(firstAddress)
                        .filter(([key, value]) => 
                          key !== '_id' && 
                          key !== 'lat' && 
                          key !== 'lng' && 
                          value && 
                          typeof value === 'string' && 
                          value.trim() &&
                          !value.match(/^[a-f0-9]{24}$/i)
                        )
                        .map(([, value]) => (value as string).trim());
                      addressDisplay = values.join(', ');
                    }
                  }
                  
                  console.log('Final address display:', addressDisplay);
                  
                  return (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-800 font-normal leading-relaxed">
                        📍 {addressDisplay || 'Chưa có thông tin'}
                      </p>
                    </div>
                  );
                } else if (typeof userData.address === 'string') {
                  return (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-800 font-normal leading-relaxed">
                        📍 {userData.address}
                      </p>
                    </div>
                  );
                } else {
                  return <p className="text-sm text-gray-500 italic font-normal">Chưa có thông tin</p>;
                }
              })()}
            </div>
          </div>

          {/* User Statistics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Thống kê hoạt động</h4>
            {statsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Đang tải thống kê...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {currentUserStats?.totalOrders || 0}
                  </p>
                  <p className="text-sm text-gray-600">Đơn hàng</p>
                  <p className="text-xs text-gray-500 mt-1">(không bao gồm đã hủy)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {currentUserStats?.totalSpent ? currentUserStats.totalSpent.toLocaleString('vi-VN') : '0'}₫
                  </p>
                  <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                  <p className="text-xs text-gray-500 mt-1">(chỉ đơn đã giao)</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
    );
  };

  // Add Product Modal Component
  const AddProductModal = React.memo(({ onClose, categories, onSubmit, loading }: { 
    onClose: () => void; 
    categories: any; 
    onSubmit: (data: any) => void;
    loading: boolean;
  }) => {
    const [formData, setFormData] = useState({
      // Basic product info
      soDangKy: '',
      name: '',
      main_category: '',
      sub_category: '',
      price: '',
      stock: '',
      description: '',
      imageUrl: '',
      
      // Company and manufacturing info
      congTy: '',
      congTyDangKy: '',
      congTySanXuat: '', // Giữ lại field này, bỏ nhaSanXuat
      brand: '', // Giữ lại field này, bỏ thuongHieu
      quocGia: '',
      
      // Product details
      dangBaoChe: '',
      dongGoi: '', // Giữ lại field này, bỏ cachDongGoi
      hanSuDung: '', // Giữ lại field này, bỏ hanDung
      hoatChatChinh: '', // Giữ lại field này cho thành phần chính
      huongDan: '', // Giữ lại field này cho hướng dẫn cơ bản
      
      // Additional fields from database (bỏ các field trùng)
      linkChiTiet: '',
      usageGuideHref: '',
      usageGuideImage: '',
      embedding_status: 'pending',
      paid: '',
      view: ''
    });

    const handleInputChange = useCallback((field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleCategoryChange = useCallback((value: string) => {
      setFormData(prev => ({ 
        ...prev, 
        main_category: value,
        sub_category: '' // Reset sub category when main category changes
      }));
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    }, [formData, onSubmit]);

    return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số đăng ký <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.soDangKy}
                onChange={(e) => handleInputChange('soDangKy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập số đăng ký"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập giá sản phẩm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tồn kho <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập số lượng tồn kho"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục chính <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.main_category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn danh mục chính</option>
                {Object.keys(categories).map(category => (
                  <option key={category} value={category}>
                    {categorySlugToName[category as keyof typeof categorySlugToName] || category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục phụ <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.sub_category}
                onChange={(e) => handleInputChange('sub_category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.main_category}
              >
                <option value="">Chọn danh mục phụ</option>
                {formData.main_category && categories[formData.main_category]?.map((subCategory: string) => (
                  <option key={subCategory} value={subCategory}>
                    {subCategorySlugToName[subCategory as keyof typeof subCategorySlugToName] || subCategory.replace(/-/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Công ty
              </label>
              <input
                type="text"
                value={formData.congTy}
                onChange={(e) => handleInputChange('congTy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên công ty"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Công ty đăng ký
              </label>
              <input
                type="text"
                value={formData.congTyDangKy}
                onChange={(e) => handleInputChange('congTyDangKy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập công ty đăng ký"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Công ty sản xuất
              </label>
              <input
                type="text"
                value={formData.congTySanXuat}
                onChange={(e) => handleInputChange('congTySanXuat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập công ty sản xuất"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dạng bào chế
              </label>
              <input
                type="text"
                value={formData.dangBaoChe}
                onChange={(e) => handleInputChange('dangBaoChe', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ví dụ: Viên nén, Capsule, Dung dịch..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thương hiệu
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập thương hiệu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quốc gia
              </label>
              <input
                type="text"
                value={formData.quocGia}
                onChange={(e) => handleInputChange('quocGia', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập quốc gia sản xuất"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL hình ảnh
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thành phần chính (Hoạt chất)
              </label>
              <textarea
                value={formData.hoatChatChinh}
                onChange={(e) => handleInputChange('hoatChatChinh', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập thành phần chính, hoạt chất..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả sản phẩm
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mô tả chi tiết về sản phẩm..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hướng dẫn sử dụng
              </label>
              <textarea
                value={formData.huongDan}
                onChange={(e) => handleInputChange('huongDan', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Hướng dẫn cách sử dụng sản phẩm..."
              />
            </div>

            {/* Thêm các trường bổ sung */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thành phần
              </label>
              <input
                type="text"
                value={formData.hoatChatChinh}
                onChange={(e) => handleInputChange('hoatChatChinh', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập thành phần..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đóng gói
              </label>
              <input
                type="text"
                value={formData.dongGoi}
                onChange={(e) => handleInputChange('dongGoi', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập cách đóng gói..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hạn sử dụng
              </label>
              <input
                type="text"
                value={formData.hanSuDung}
                onChange={(e) => handleInputChange('hanSuDung', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập hạn sử dụng..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link chi tiết
              </label>
              <input
                type="url"
                value={formData.linkChiTiet}
                onChange={(e) => handleInputChange('linkChiTiet', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập link chi tiết sản phẩm..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link hướng dẫn
              </label>
              <input
                type="url"
                value={formData.usageGuideHref}
                onChange={(e) => handleInputChange('usageGuideHref', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập link hướng dẫn sử dụng..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hình ảnh hướng dẫn
              </label>
              <input
                type="url"
                value={formData.usageGuideImage}
                onChange={(e) => handleInputChange('usageGuideImage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập URL hình ảnh hướng dẫn..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lượt xem
              </label>
              <input
                type="number"
                value={formData.view}
                onChange={(e) => handleInputChange('view', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập số lượt xem..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái embedding
              </label>
              <select
                value={formData.embedding_status}
                onChange={(e) => handleInputChange('embedding_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Đang chờ</option>
                <option value="processing">Đang xử lý</option>
                <option value="completed">Hoàn thành</option>
                <option value="failed">Thất bại</option>
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang thêm...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm sản phẩm
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    );
  });

  // Edit Product Modal Component
  const EditProductModal = React.memo(({ product, onClose, categories, onSubmit, loading }: { 
    product: any;
    onClose: () => void; 
    categories: any; 
    onSubmit: (data: any) => void;
    loading: boolean;
  }) => {
    const [formData, setFormData] = useState({
      // Basic product info
      soDangKy: product?.soDangKy || '',
      name: product?.name || '',
      main_category: product?.main_category || '',
      sub_category: product?.sub_category || '',
      price: product?.price?.toString() || '',
      stock: product?.stock?.toString() || '',
      description: product?.description || '',
      imageUrl: product?.imageUrl || '',
      
      // Company and manufacturing info
      congTy: product?.congTy || '',
      congTyDangKy: product?.congTyDangKy || '',
      congTySanXuat: product?.congTySanXuat || '',
      brand: product?.brand || product?.thuongHieu || '',
      quocGia: product?.quocGia || '',
      
      // Product details
      dangBaoChe: product?.dangBaoChe || '',
      dongGoi: product?.dongGoi || product?.cachDongGoi || '',
      hanSuDung: product?.hanSuDung || product?.hanDung || '',
      hoatChatChinh: product?.hoatChatChinh || product?.thanhPhan || '',
      thanhPhan: product?.thanhPhan || product?.hoatChatChinh || '',
      huongDan: product?.huongDan || '',
      
      // Additional fields from database
      thuongHieu: product?.thuongHieu || product?.brand || '',
      nhaSanXuat: product?.nhaSanXuat || '',
      cachDongGoi: product?.cachDongGoi || product?.dongGoi || '',
      hanDung: product?.hanDung || product?.hanSuDung || '',
      linkChiTiet: product?.linkChiTiet || '',
      usageGuideHref: product?.usageGuideHref || '',
      usageGuideImage: product?.usageGuideImage || '',
      embedding_status: product?.embedding_status || 'pending',
      paid: product?.paid?.toString() || '0',
      view: product?.view?.toString() || '0',
      
      // Product info object fields
      product_info: {
        ingredients: product?.product_info?.ingredients || '',
        usage: product?.product_info?.usage || '',
        dosage: product?.product_info?.dosage || '',
        sideEffects: product?.product_info?.sideEffects || '',
        contraindications: product?.product_info?.contraindications || '',
        storage: product?.product_info?.storage || ''
      }
    });

    const handleInputChange = useCallback((field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleProductInfoChange = useCallback((field: string, value: string) => {
      setFormData(prev => ({ 
        ...prev, 
        product_info: {
          ...prev.product_info,
          [field]: value
        }
      }));
    }, []);

    const handleCategoryChange = useCallback((value: string) => {
      setFormData(prev => ({ 
        ...prev, 
        main_category: value,
        sub_category: '' // Reset sub category when main category changes
      }));
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    }, [formData, onSubmit]);

    // Convert main_category back to slug for selection
    const getMainCategorySlug = (categoryName: string) => {
      return Object.entries(categorySlugToName).find(([, name]) => name === categoryName)?.[0] || categoryName;
    };

    // Convert sub_category back to slug for selection
    const getSubCategorySlug = (subCategoryName: string) => {
      return Object.entries(subCategorySlugToName).find(([, name]) => name === subCategoryName)?.[0] || subCategoryName;
    };

    return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số đăng ký <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.soDangKy}
                onChange={(e) => handleInputChange('soDangKy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập số đăng ký"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập giá sản phẩm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tồn kho <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập số lượng tồn kho"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục chính <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={getMainCategorySlug(formData.main_category)}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn danh mục chính</option>
                {Object.keys(categories).map(category => (
                  <option key={category} value={category}>
                    {categorySlugToName[category as keyof typeof categorySlugToName] || category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục phụ <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={getSubCategorySlug(formData.sub_category)}
                onChange={(e) => handleInputChange('sub_category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!getMainCategorySlug(formData.main_category)}
              >
                <option value="">Chọn danh mục phụ</option>
                {getMainCategorySlug(formData.main_category) && categories[getMainCategorySlug(formData.main_category)]?.map((subCategory: string) => (
                  <option key={subCategory} value={subCategory}>
                    {subCategorySlugToName[subCategory as keyof typeof subCategorySlugToName] || subCategory.replace(/-/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Info - Similar structure as AddProductModal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Công ty</label>
              <input
                type="text"
                value={formData.congTy}
                onChange={(e) => handleInputChange('congTy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên công ty"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Công ty đăng ký</label>
              <input
                type="text"
                value={formData.congTyDangKy}
                onChange={(e) => handleInputChange('congTyDangKy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập công ty đăng ký"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Công ty sản xuất</label>
              <input
                type="text"
                value={formData.congTySanXuat}
                onChange={(e) => handleInputChange('congTySanXuat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập công ty sản xuất"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dạng bào chế</label>
              <input
                type="text"
                value={formData.dangBaoChe}
                onChange={(e) => handleInputChange('dangBaoChe', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ví dụ: Viên nén, Capsule, Dung dịch..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
              <input
                type="text"
                value={formData.thuongHieu}
                onChange={(e) => handleInputChange('thuongHieu', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập thương hiệu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quốc gia</label>
              <input
                type="text"
                value={formData.quocGia}
                onChange={(e) => handleInputChange('quocGia', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập quốc gia sản xuất"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL hình ảnh</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sản phẩm</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mô tả chi tiết về sản phẩm..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hướng dẫn sử dụng</label>
              <textarea
                value={formData.huongDan}
                onChange={(e) => handleInputChange('huongDan', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Hướng dẫn cách sử dụng sản phẩm..."
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Cập nhật sản phẩm
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    );
  });

  // Add User Modal Component
  const AddUserModal = React.memo(({ onClose, onSubmit, loading }: { 
    onClose: () => void; 
    onSubmit: (data: any) => void;
    loading: boolean;
  }) => {
    const [formData, setFormData] = useState({
      userName: '',
      email: '',
      phone: '',
      userType: 'client',
      isActive: true,
      password: '',
      confirmPassword: '',
      addresses: []
    });

    const handleInputChange = useCallback((field: string, value: string | boolean) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      
      // Validation
      if (!formData.userName.trim()) {
        alert('Vui lòng nhập tên người dùng');
        return;
      }
      if (!formData.email.trim()) {
        alert('Vui lòng nhập email');
        return;
      }
      if (formData.phone && !/^0\d{9}$/.test(formData.phone)) {
        alert('Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 số');
        return;
      }
      if (!formData.password.trim()) {
        alert('Vui lòng nhập mật khẩu');
        return;
      }
      if (formData.password.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert('Mật khẩu xác nhận không khớp');
        return;
      }

      onSubmit(formData);
    }, [formData, onSubmit]);

    return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Thêm người dùng mới</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên người dùng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.userName}
                onChange={(e) => handleInputChange('userName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên người dùng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: 0123456789 (10 số, bắt đầu bằng 0)"
                pattern="^0\d{9}$"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại tài khoản <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.userType}
                onChange={(e) => handleInputChange('userType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="client">Khách hàng</option>
                <option value="pharmacist">Dược sĩ</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mật khẩu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập lại mật khẩu"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Tài khoản hoạt động</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang thêm...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm người dùng
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    );
  });

  // Edit User Modal Component
  const EditUserModal = React.memo(({ user, onClose, onSubmit, loading }: { 
    user: any;
    onClose: () => void; 
    onSubmit: (data: any) => void;
    loading: boolean;
  }) => {
    // Debug: Log user data để kiểm tra cấu trúc
    console.log('EditUserModal - User data:', user);
    console.log('EditUserModal - User address:', user?.address);
    
    const [formData, setFormData] = useState({
      userName: user?.userName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      userType: user?.userType || 'client',
      isActive: user?.isActive !== undefined ? user.isActive : true,
      address: (() => {
        console.log('=== ADDRESS PARSING DEBUG ===');
        console.log('Raw user address:', user?.address);
        console.log('Is array:', Array.isArray(user?.address));
        console.log('Array length:', user?.address?.length);
        
        // Lấy address từ array address[0] như trong database
        if (user?.address && Array.isArray(user.address) && user.address.length > 0) {
          const firstAddress = user.address[0];
          console.log('First address:', firstAddress);
          console.log('Type of first address:', typeof firstAddress);
          
          // Nếu là string trực tiếp (format mới)
          if (typeof firstAddress === 'string') {
            console.log('Returning string address:', firstAddress);
            return firstAddress;
          }
          
          // Nếu là object bị lỗi format (format cũ) - reconstruct string
          if (typeof firstAddress === 'object' && firstAddress !== null) {
            const keys = Object.keys(firstAddress);
            console.log('Object keys:', keys);
            const hasNumberKeys = keys.some(key => !isNaN(parseInt(key)));
            console.log('Has number keys:', hasNumberKeys);
            
            if (hasNumberKeys) {
              // Reconstruct string từ object bị lỗi
              const reconstructed = Object.keys(firstAddress)
                .filter(key => !isNaN(parseInt(key)))
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(key => firstAddress[key])
                .join('');
              console.log('Reconstructed address:', reconstructed);
              return reconstructed;
            }
            
            // Address object đúng format với các field
            if (firstAddress.address || firstAddress.fullName) {
              const parts = [
                firstAddress.address,
                firstAddress.ward,
                firstAddress.district,
                firstAddress.city
              ].filter(part => part && part.trim());
              const result = parts.length > 0 ? parts.join(', ') : (firstAddress.fullName || '');
              console.log('Address object result:', result);
              return result;
            }
          }
        }
        console.log('No address found, returning empty string');
        console.log('=== ADDRESS PARSING END ===');
        return '';
      })()
    });

    const handleInputChange = useCallback((field: string, value: string | boolean) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      
      // Validation
      if (!formData.userName.trim()) {
        alert('Vui lòng nhập tên người dùng');
        return;
      }
      if (!formData.email.trim()) {
        alert('Vui lòng nhập email');
        return;
      }
      if (formData.phone && !/^0\d{9}$/.test(formData.phone)) {
        alert('Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 số');
        return;
      }

      onSubmit(formData);
    }, [formData, onSubmit]);

    return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa người dùng</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên người dùng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.userName}
                onChange={(e) => handleInputChange('userName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên người dùng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại tài khoản <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.userType}
                onChange={(e) => handleInputChange('userType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="client">Khách hàng</option>
                <option value="pharmacist">Dược sĩ</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập địa chỉ"
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Tài khoản hoạt động</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Cập nhật người dùng
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    );
  });

  // Product Detail Modal Component
  const ProductDetailModal = ({ product, onClose }: { product: any; onClose: () => void }) => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Chi tiết sản phẩm</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Product Image & Basic Info */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-full md:w-1/3">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                {product.imageUrl || product.image ? (
                  <img 
                    src={product.imageUrl || product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
              <p className="text-3xl font-bold text-blue-600">
                {(product.price || 0).toLocaleString('vi-VN')} ₫
              </p>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  (product.stock ?? 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {(product.stock ?? 0) > 0 ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Còn hàng ({product.stock})
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Hết hàng
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Product Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID sản phẩm</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-mono text-sm">
                {product._id}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số đăng ký</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {product.soDangKy || 'Chưa có'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục chính</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {product.main_category || 'Chưa phân loại'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục phụ</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {product.sub_category || 'Chưa có'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quốc gia sản xuất</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {product.quocGia || 'Chưa cập nhật'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Công ty sản xuất</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {product.congTySanXuat || 'Chưa có thông tin'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {product.createdAt ? new Date(product.createdAt).toLocaleString('vi-VN') : 'Không có'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cập nhật cuối</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {product.updatedAt ? new Date(product.updatedAt).toLocaleString('vi-VN') : 'Chưa cập nhật'}
              </p>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sản phẩm</label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                <p>{product.description}</p>
              </div>
            </div>
          )}

          {/* Ingredients */}
          {product.hoatChatChinh && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hoạt chất chính</label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                <p>{product.hoatChatChinh}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );

  // Appointment Detail Modal Component
  // Real data states for dashboard
  const [stats, setStats] = useState({
  totalUsers: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalRevenue: 0,
  lowStockProducts: 0,
});
  // Orders Stat
  const [orderStats, setOrderStats] = useState({
  totalOrders: 0,
  pendingOrders: 0,
  completedOrders: 0,
  totalRevenue: 0,
  monthlyOrders: [] as { _id: { year: number; month: number }; count: number; revenue: number }[],
});


  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const loadDashboardData = async () => {
    const headers: any = { Authorization: `Bearer ${localStorage.getItem('admin_token')}` };

    // Default values để fallback
    let totalUsers = 0;
    let totalProducts = 0;
    let lowStockProducts = 0;
    let totalOrders = 0;
    let totalRevenue = 0;

    try {
      // USERS
      try {
        const usersRes = await fetch('/api/v1/user', { headers });
        const usersJson = await usersRes.json();
        totalUsers = usersJson.pagination?.totalItems || 0;
      } catch (err) {
        console.warn('User service failed', err);
      }

      // PRODUCTS
      try {
        const prodsRes = await fetch('/api/v1/products');
        const prodsJson = await prodsRes.json();
        totalProducts = prodsJson.pagination?.totalItems || (prodsJson.data?.length || 0);
        lowStockProducts = (prodsJson.data || []).filter((p: any) => (p.stock || 0) <= 5).length;
      } catch (err) {
        console.warn('Product service failed', err);
      }

      // ORDERS
      try {
  const [ordStatsRes, ordAllRes, ordRecentRes] = await Promise.all([
    fetch('/api/v1/orders/admin/statistics', { headers }),
    fetch('/api/v1/orders/admin/all?page=1&limit=1000', { headers }), // Get all for counting
    fetch('/api/v1/orders/admin/all?limit=5', { headers }),
  ]);

    const ordStatsJson = await ordStatsRes.json();
    if (ordStatsJson.success) {
      setOrderStats(ordStatsJson.data);
    }
    const ordAllJson = await ordAllRes.json();
    const ordRecentJson = await ordRecentRes.json();

    totalOrders = ordStatsJson.data?.totalOrders || 0;
    totalRevenue = ordStatsJson.data?.totalRevenue || 0;

    // Toàn bộ đơn hàng để hiển thị trong overview
    setOrders(ordAllJson.data || []);

    // Đơn hàng gần đây
    const ordersData = (ordRecentJson.data || []).map((o: any) => ({
      id: `#${String(o._id).slice(-6).toUpperCase()}`,
      customer: o.user?.email || 'Khách lẻ',
      amount: o.totalAmount || 0,
      status: o.orderStatus,
      date: o.createdAt
        ? new Date(o.createdAt).toLocaleDateString('vi-VN')
        : '',
      raw: o,
    }));
    setRecentOrders(ordersData);

  } catch (err) {
    console.warn('Order service failed', err);
    setOrders([]);
    setRecentOrders([]);
  }

      // Cuối cùng set vào stats
      setStats({
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        lowStockProducts,
      });

    } catch (e) {
      console.error('load dashboard data error', e);
    }
  };

  useEffect(() => { loadDashboardData(); }, []);
  useEffect(() => {
  const fetchOrders = async () => {
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Lỗi khi fetch đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };
  fetchOrders();
}, []);

  const tabs = [
    { id: 'overview', name: 'Tổng quan', icon: BarChart3 },
    { id: 'users', name: 'Quản lý người dùng', icon: Users },
    { id: 'products', name: 'Quản lý sản phẩm', icon: Package },
    { id: 'orders', name: 'Thống kê đơn hàng', icon: ShoppingCart },
    { id: 'settings', name: 'Cài đặt', icon: Settings }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-8 space-y-8">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-700 mb-1">Tổng người dùng</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                    <Package className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-700 mb-1">Tổng sản phẩm</p>
                    <p className="text-3xl font-bold text-green-900">{stats.totalProducts.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <ShoppingCart className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-700 mb-1">Tổng đơn hàng</p>
                    <p className="text-3xl font-bold text-purple-900">{stats.totalOrders.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-orange-700 mb-1">Doanh thu</p>
                    <p className="text-3xl font-bold text-orange-900">{stats.totalRevenue.toLocaleString('vi-VN')} ₫</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Recent Orders */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600 mr-3" />
                  Đơn hàng gần đây
                </h3>
                <p className="text-gray-600 mt-1">Theo dõi các đơn hàng mới nhất</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã đơn hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số tiền
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.customer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.amount.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status === 'pending' ? 'Chờ xử lý' :
                             order.status === 'completed' ? 'Hoàn thành' :
                             order.status === 'shipped' ? 'Đã giao' : order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => setSelectedOrder(order.raw)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Quản lý người dùng
                </h2>
                <p className="text-gray-600 mt-2">Quản lý tài khoản và phân quyền người dùng</p>
              </div>
              <button 
                onClick={() => setShowAddUserModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Thêm người dùng
              </button>
            </div>

            {/* Enhanced Search and Filter */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm người dùng theo tên, email..."
                      value={userFilters.q}
                      onChange={(e) => setUserFilters(prev => ({ ...prev, q: e.target.value }))}
                      className="w-full pl-12 pr-12 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    />
                    {userFilters.q && (
                      <button
                        onClick={resetUserFilters}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        title="Xóa tìm kiếm"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <select 
                    className="px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm font-medium" 
                    value={userFilters.type} 
                    onChange={(e) => setUserFilters(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="">Tất cả loại</option>
                    <option value="client">Client</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select 
                    className="px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm font-medium" 
                    value={userFilters.active} 
                    onChange={(e) => setUserFilters(prev => ({ ...prev, active: e.target.value }))}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="true">Hoạt động</option>
                    <option value="false">Bị khóa</option>
                  </select>
                  <button 
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center shadow-lg font-medium" 
                    onClick={() => loadUsers(1)}
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    Lọc
                  </button>
                  {(userFilters.q || userFilters.type || userFilters.active) && (
                    <button 
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center shadow-lg font-medium transform hover:scale-105" 
                      onClick={resetUserFilters}
                      title="Xóa tất cả bộ lọc và quay về trạng thái ban đầu"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Xóa filter
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Users Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersData?.data && usersData.data.length > 0 ? (
                      usersData.data.map((u: any) => (
                        <tr key={u._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">{(u.userName || 'U')[0].toUpperCase()}</span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{u.userName}</div>
                                <div className="text-xs text-gray-500">{u.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <select value={u.userType} onChange={(e) => updateUser(u._id, { userType: e.target.value })} className="px-2 py-1 border rounded">
                              <option value="client">Client</option>
                              <option value="pharmacist">Pharmacist</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => updateUser(u._id, { isActive: !u.isActive })}
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
                            >
                              {u.isActive ? (<><UserCheck className="h-3 w-3 mr-1 inline"/> Hoạt động</>) : (<><UserX className="h-3 w-3 mr-1 inline"/> Bị khóa</>)}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                className="text-blue-600 hover:text-blue-900 mr-3"
                                onClick={() => setSelectedUser(u)}
                                title="Xem chi tiết"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            <button 
                              className="text-green-600 hover:text-green-900 mr-3"
                              onClick={() => openEditUserModal(u)}
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={() => deleteUser(u._id)}
                              disabled={loading}
                              title="Xóa người dùng"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          {loading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                              Đang tải người dùng...
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Users className="h-12 w-12 text-gray-300 mb-2" />
                              <p className="text-lg font-medium text-gray-900 mb-1">Chưa có người dùng nào</p>
                              <p className="text-sm text-gray-500">Hãy thêm người dùng đầu tiên!</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Pagination */}
              <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    Hiển thị <span className="font-bold text-blue-600">{((usersData.pagination.currentPage - 1) * 20) + 1}</span> - 
                    <span className="font-bold text-blue-600"> {Math.min(usersData.pagination.currentPage * 20, usersData.pagination.totalItems)}</span> trong 
                    <span className="font-bold text-blue-600"> {usersData.pagination.totalItems}</span> người dùng
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className="px-4 py-2 bg-white border-2 border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium" 
                    disabled={usersData.pagination.currentPage <= 1} 
                    onClick={() => loadUsers(usersData.pagination.currentPage - 1)}
                  >
                    ← Trước
                  </button>
                  <div className="flex items-center space-x-1">
                    {usersData.pagination.totalPages > 0 && [...Array(Math.max(0, usersData.pagination.totalPages))].slice(
                      Math.max(0, usersData.pagination.currentPage - 3),
                      Math.min(usersData.pagination.totalPages, usersData.pagination.currentPage + 2)
                    ).map((_, index) => {
                      const pageNumber = Math.max(1, usersData.pagination.currentPage - 2) + index;
                      if (pageNumber > usersData.pagination.totalPages) return null;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => loadUsers(pageNumber)}
                          className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                            pageNumber === usersData.pagination.currentPage
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                              : 'bg-white text-blue-600 hover:bg-blue-50 border-2 border-blue-200'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    className="px-4 py-2 bg-white border-2 border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium" 
                    disabled={usersData.pagination.currentPage >= usersData.pagination.totalPages} 
                    onClick={() => loadUsers(usersData.pagination.currentPage + 1)}
                  >
                    Sau →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Quản lý sản phẩm
                </h2>
                <p className="text-gray-600 mt-2">Quản lý danh mục sản phẩm và kho hàng</p>
              </div>
              <div className="flex items-center space-x-4">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setProductViewMode('grid')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      productViewMode === 'grid'
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Xem dạng lưới"
                  >
                    <Grid3X3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setProductViewMode('table')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      productViewMode === 'table'
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Xem dạng bảng"
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
                
                <button 
                  onClick={() => setShowAddProductModal(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Thêm sản phẩm
                </button>
              </div>
            </div>
            
            {/* Enhanced Search and Filter */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm theo tên, số đăng ký..."
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    />
                    {productQuery && (
                      <button
                        onClick={resetProductFilters}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        title="Xóa tìm kiếm"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center shadow-lg font-medium" 
                    onClick={() => loadProducts(1)} 
                    disabled={productLoading}
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    Lọc
                  </button>
                  {productQuery && (
                    <button 
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center shadow-lg font-medium transform hover:scale-105" 
                      onClick={resetProductFilters}
                      title="Xóa bộ lọc và quay về trạng thái ban đầu"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Xóa filter
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Products Display */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
                {productsData.data && productsData.data.length > 0 ? (
                  productViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                      {productsData.data.map((p: any) => (
                        <div key={p._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden">
                          {/* Product Image */}
                          <div className="h-48 bg-gray-100 relative overflow-hidden">
                            {p.imageUrl || p.image ? (
                              <img 
                                src={p.imageUrl || p.image} 
                                alt={p.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                <Package className="h-16 w-16 text-gray-400" />
                              </div>
                            )}
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                (p.stock ?? 0) > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {(p.stock ?? 0) > 0 ? 'Có sẵn' : 'Hết hàng'}
                              </span>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                              {p.name}
                            </h3>
                            
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                              <div className="flex justify-between">
                                <span>Số đăng ký:</span>
                                <span className="font-medium">{p.soDangKy || 'N/A'}</span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Danh mục:</span>
                                <span className="font-medium text-right max-w-32 truncate">
                                  {p.category || [p.main_category, p.sub_category].filter(Boolean).join(' > ') || 'N/A'}
                                </span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Giá:</span>
                                <span className="font-bold text-green-600">
                                  {(p.price || 0).toLocaleString('vi-VN')} ₫
                                </span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Tồn kho:</span>
                                <span className={`font-medium ${(p.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {p.stock ?? 0}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                              <button 
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50 transition-all duration-200"
                                onClick={() => setSelectedProduct(p)}
                                title="Xem chi tiết"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              
                              <button 
                                className="text-green-600 hover:text-green-900 p-2 rounded-full hover:bg-green-50 transition-all duration-200"
                                onClick={() => openEditProductModal(p)}
                                title="Chỉnh sửa"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              
                              <button 
                                className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-all duration-200" 
                                onClick={() => deleteProduct(p._id)} 
                                disabled={productLoading}
                                title="Xóa sản phẩm"
                              >
                                <Trash className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Table View - List Style
                    <div className="p-4 space-y-4">
                      {productsData.data.map((p: any) => (
                        <div key={p._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start justify-between">
                            {/* Product Main Info */}
                            <div className="flex items-start space-x-4 flex-1">
                              {/* Product Image */}
                              <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {p.imageUrl || p.image ? (
                                  <img 
                                    src={p.imageUrl || p.image} 
                                    alt={p.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <Package className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 break-words">
                                  {p.name}
                                </h3>
                                
                                {/* Product Info List */}
                                <div className="space-y-1 text-sm">
                                  <div className="flex flex-wrap items-center">
                                    <span className="text-gray-500 font-medium min-w-24">Số đăng ký:</span>
                                    <span className="text-gray-900 ml-2 break-all">{p.soDangKy || 'N/A'}</span>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-start">
                                    <span className="text-gray-500 font-medium min-w-24">Danh mục:</span>
                                    <span className="text-gray-900 ml-2 break-words">
                                      {p.category || [p.main_category, p.sub_category].filter(Boolean).join(' > ') || 'N/A'}
                                    </span>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center">
                                    <span className="text-gray-500 font-medium min-w-24">Giá bán:</span>
                                    <span className="text-green-600 font-bold ml-2">
                                      {(p.price || 0).toLocaleString('vi-VN')} ₫
                                    </span>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center">
                                    <span className="text-gray-500 font-medium min-w-24">Tồn kho:</span>
                                    <span className={`ml-2 font-medium ${(p.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {p.stock ?? 0} sản phẩm
                                    </span>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center">
                                    <span className="text-gray-500 font-medium min-w-24">Trạng thái:</span>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                                      (p.stock ?? 0) > 0 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {(p.stock ?? 0) > 0 ? 'Có sẵn' : 'Hết hàng'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                              <button
                                onClick={() => setSelectedProduct(p)}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50 transition-all duration-200"
                                title="Xem chi tiết"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => openEditProductModal(p)}
                                className="text-green-600 hover:text-green-900 p-2 rounded-full hover:bg-green-50 transition-all duration-200"
                                title="Chỉnh sửa"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => deleteProduct(p._id)}
                                className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-all duration-200"
                                title="Xóa"
                              >
                                <Trash className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    {productLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
                        <span className="text-lg text-gray-600">Đang tải sản phẩm...</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Package className="h-20 w-20 text-gray-300 mb-4 mx-auto" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Chưa có sản phẩm nào</h3>
                        <p className="text-gray-500 mb-6">Hãy thêm sản phẩm đầu tiên của bạn!</p>
                        <button 
                          onClick={() => setShowAddProductModal(true)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center mx-auto"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Thêm sản phẩm
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Enhanced Pagination */}
              <div className="px-8 py-6 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    Hiển thị <span className="font-bold text-green-600">{((productsData.pagination.currentPage - 1) * 20) + 1}</span> - 
                    <span className="font-bold text-green-600"> {Math.min(productsData.pagination.currentPage * 20, productsData.pagination.totalItems)}</span> trong 
                    <span className="font-bold text-green-600"> {productsData.pagination.totalItems}</span> sản phẩm
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className="px-4 py-2 bg-white border-2 border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium" 
                    disabled={productsData.pagination.currentPage <= 1}
                    onClick={() => loadProducts(productsData.pagination.currentPage - 1)}
                  >
                    ← Trước
                  </button>
                  <div className="flex items-center space-x-1">
                    {productsData.pagination.totalPages > 0 && [...Array(Math.max(0, productsData.pagination.totalPages))].slice(
                      Math.max(0, productsData.pagination.currentPage - 3),
                      Math.min(productsData.pagination.totalPages, productsData.pagination.currentPage + 2)
                    ).map((_, index) => {
                      const pageNumber = Math.max(1, productsData.pagination.currentPage - 2) + index;
                      if (pageNumber > productsData.pagination.totalPages) return null;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => loadProducts(pageNumber)}
                          className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                            pageNumber === productsData.pagination.currentPage
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                              : 'bg-white text-green-600 hover:bg-green-50 border-2 border-green-200'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    className="px-4 py-2 bg-white border-2 border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium" 
                    disabled={productsData.pagination.currentPage >= productsData.pagination.totalPages}
                    onClick={() => loadProducts(productsData.pagination.currentPage + 1)}
                  >
                    Sau →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Thống kê đơn hàng
                </h2>
                <p className="text-gray-600 mt-2">Quản lý và theo dõi tình trạng đơn hàng</p>
              </div>
            </div>

            {/* Enhanced Order Statistics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
                <div className="absolute top-4 right-4 opacity-20">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-blue-600 mb-2">Tổng đơn hàng</p>
                <p className="text-3xl font-bold text-blue-900">
                  {orderStats.totalOrders}
                </p>
                <p className="text-xs text-blue-600 mt-1">Tất cả đơn hàng</p>
              </div>

              <div className="group relative bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
                <div className="absolute top-4 right-4 opacity-20">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-sm font-medium text-yellow-600 mb-2">Chờ xử lý</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {orderStats.pendingOrders}
                </p>
                <p className="text-xs text-yellow-600 mt-1">Đang chờ xác nhận</p>
              </div>

              <div className="group relative bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
                <div className="absolute top-4 right-4 opacity-20">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm font-medium text-green-600 mb-2">Hoàn thành</p>
                <p className="text-3xl font-bold text-green-900">
                  {orderStats.completedOrders}
                </p>
                <p className="text-xs text-green-600 mt-1">Đã giao thành công</p>
              </div>

              <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
                <div className="absolute top-4 right-4 opacity-20">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-purple-600 mb-2">Doanh thu</p>
                <p className="text-3xl font-bold text-purple-900">
                  {orderStats.totalRevenue.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-xs text-purple-600 mt-1">Tổng thu nhập</p>
              </div>
            </div>

            {/* Enhanced Search and Filter */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm đơn hàng theo mã, khách hàng..."
                      value={orderFilters.q}
                      onChange={(e) => {
                        setOrderFilters(prev => ({ ...prev, q: e.target.value }));
                      }}
                      className="w-full pl-12 pr-12 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    />
                    {orderFilters.q && (
                      <button
                        onClick={resetOrderFilters}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        title="Xóa tìm kiếm"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <select 
                    className="px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm font-medium" 
                    value={orderFilters.status} 
                    onChange={(e) => {
                      setOrderFilters(prev => ({ ...prev, status: e.target.value }));
                    }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="shipped">Đã giao</option>
                    <option value="delivered">Đã nhận</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                  <button 
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center shadow-lg font-medium" 
                    onClick={() => loadOrders(1)}
                    title="Áp dụng bộ lọc"
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    Lọc
                  </button>
                  {(orderFilters.q || orderFilters.status) && (
                    <button 
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center shadow-lg font-medium transform hover:scale-105" 
                      onClick={resetOrderFilters}
                      title="Xóa tất cả bộ lọc và quay về trạng thái ban đầu"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Xóa filter
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Orders Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <h3 className="text-xl font-bold text-blue-900 flex items-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600 mr-3" />
                  Danh sách đơn hàng
                </h3>
                <p className="text-blue-600 text-sm mt-1">Quản lý và theo dõi tất cả đơn hàng</p>
              </div>
              <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã đơn hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số tiền
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày đặt
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ordersData?.data && ordersData.data.length > 0 ? (
                      ordersData.data.map((order) => (
                        <tr key={order._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{String(order._id).slice(-6).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.user?.userName || order.user?.email || 'Khách lẻ'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(order.totalAmount || 0).toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                order.orderStatus
                              )}`}
                            >
                              {order.orderStatus === 'pending'
                                ? 'Chờ xử lý'
                                : order.orderStatus === 'completed'
                                ? 'Hoàn thành'
                                : order.orderStatus === 'shipped'
                                ? 'Đã giao'
                                : order.orderStatus === 'delivered'
                                ? 'Đã nhận'
                                : order.orderStatus === 'cancelled'
                                ? 'Đã hủy'
                                : order.orderStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString('vi-VN')
                              : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => setSelectedOrder(order)}
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          {loading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                              Đang tải đơn hàng...
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <ShoppingCart className="h-12 w-12 text-gray-300 mb-2" />
                              <p className="text-lg font-medium text-gray-900 mb-1">Chưa có đơn hàng nào</p>
                              <p className="text-sm text-gray-500">Đơn hàng sẽ hiển thị ở đây khi có khách đặt hàng</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Enhanced Pagination */}
              <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    Hiển thị <span className="font-bold text-blue-600">{safePaginationNumber(ordersData.pagination.totalItems) > 0 ? safePaginationNumber((ordersData.pagination.currentPage - 1) * (ordersData.pagination.itemsPerPage || 20)) + 1 : 0}</span> - 
                    <span className="font-bold text-blue-600"> {Math.min(safePaginationNumber(ordersData.pagination.currentPage) * safePaginationNumber(ordersData.pagination.itemsPerPage, 20), safePaginationNumber(ordersData.pagination.totalItems))}</span> trong 
                    <span className="font-bold text-blue-600"> {safePaginationNumber(ordersData.pagination.totalItems)}</span> đơn hàng
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className="px-4 py-2 bg-white border-2 border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium" 
                    disabled={safePaginationNumber(ordersData.pagination.currentPage, 1) <= 1} 
                    onClick={() => loadOrders(safePaginationNumber(ordersData.pagination.currentPage, 1) - 1)}
                  >
                    ← Trước
                  </button>
                  <div className="flex items-center space-x-1">
                    {safePaginationNumber(ordersData.pagination.totalPages, 1) > 0 && [...Array(Math.max(0, safePaginationNumber(ordersData.pagination.totalPages, 1)))].slice(
                      Math.max(0, safePaginationNumber(ordersData.pagination.currentPage, 1) - 3),
                      Math.min(safePaginationNumber(ordersData.pagination.totalPages, 1), safePaginationNumber(ordersData.pagination.currentPage, 1) + 2)
                    ).map((_, index) => {
                      const pageNumber = Math.max(1, safePaginationNumber(ordersData.pagination.currentPage, 1) - 2) + index;
                      if (pageNumber > safePaginationNumber(ordersData.pagination.totalPages, 1)) return null;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => loadOrders(pageNumber)}
                          className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                            pageNumber === safePaginationNumber(ordersData.pagination.currentPage, 1)
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                              : 'bg-white text-blue-600 hover:bg-blue-50 border-2 border-blue-200'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    className="px-4 py-2 bg-white border-2 border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium" 
                    disabled={safePaginationNumber(ordersData.pagination.currentPage, 1) >= safePaginationNumber(ordersData.pagination.totalPages, 1)} 
                    onClick={() => loadOrders(safePaginationNumber(ordersData.pagination.currentPage, 1) + 1)}
                  >
                    Sau →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="p-8 space-y-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Cài đặt hệ thống
              </h2>
              <p className="text-gray-600 mt-2">Quản lý cấu hình và thông tin hệ thống</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg border border-purple-200 p-8">
              <h3 className="text-xl font-bold text-purple-900 mb-6 flex items-center">
                <Settings className="h-6 w-6 text-purple-600 mr-3" />
                Thông tin chung
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Tên công ty
                  </label>
                  <input
                    type="text"
                    defaultValue="HealthCare"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email liên hệ
                  </label>
                  <input
                    type="email"
                    defaultValue="contact@healthcare.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    defaultValue="1900-6035"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    defaultValue="123 Nguyễn Huệ, Quận 1, TP.HCM"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Chức năng đang phát triển</h2>
            <p className="text-gray-600">Trang này sẽ được cập nhật sớm.</p>
          </div>
        );
    }
  };

  // Check if user is admin
  if (!user || user.userType !== 'admin') {
    return (
      <div className="mx-auto sm:px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h1>
          <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="mx-auto sm:px-6">
        {/* Header with Gradient */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl opacity-10"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-2 text-lg">Quản lý hệ thống và người dùng một cách hiệu quả</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Chào mừng trở lại,</p>
                  <p className="font-semibold text-gray-800">{user?.userName || 'Admin'}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(user?.userName || 'A').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Sidebar */}
          <div className="lg:w-72">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Điều hướng</h3>
              <nav className="space-y-3">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl text-left transition-all duration-300 group ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-700 hover:bg-gray-50 hover:shadow-md hover:transform hover:scale-102'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        activeTab === tab.id 
                          ? 'bg-white/20' 
                          : 'bg-gray-100 group-hover:bg-blue-50'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          activeTab === tab.id 
                            ? 'text-white' 
                            : 'text-gray-600 group-hover:text-blue-600'
                        }`} />
                      </div>
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden relative min-h-0">
              {loading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="bg-white rounded-xl p-6 shadow-lg flex items-center space-x-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-700 font-medium">Đang tải dữ liệu...</span>
                  </div>
                </div>
              )}
              <div className="h-full">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <ShoppingCart className="h-7 w-7 mr-3" />
                    Chi tiết đơn hàng
                  </h2>
                  <p className="text-blue-100 mt-1">Thông tin chi tiết về đơn hàng</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Information */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Package className="h-5 w-5 text-blue-600 mr-2" />
                      Thông tin đơn hàng
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Mã đơn hàng:</span>
                        <span className="font-bold text-blue-600">
                          {selectedOrder.orderNumber || `#${String(selectedOrder._id).slice(-8).toUpperCase()}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Trạng thái:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedOrder.orderStatus === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedOrder.orderStatus === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : selectedOrder.orderStatus === 'shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedOrder.orderStatus === 'pending' ? 'Chờ xử lý' :
                           selectedOrder.orderStatus === 'completed' ? 'Hoàn thành' :
                           selectedOrder.orderStatus === 'shipped' ? 'Đã giao' : selectedOrder.orderStatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Ngày đặt:</span>
                        <span className="text-gray-900">
                          {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Tổng tiền:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {selectedOrder.totalAmount?.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                      Thông tin thanh toán
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Phương thức:</span>
                        <span className="text-gray-900">{selectedOrder.paymentMethod || 'Chưa xác định'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Trạng thái:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedOrder.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedOrder.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Users className="h-5 w-5 text-purple-600 mr-2" />
                      Thông tin khách hàng
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 font-medium">Tên khách hàng:</span>
                        <span className="text-gray-900 text-right break-words">
                          {selectedOrder.user?.userName || 'Khách lẻ'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 font-medium">Email:</span>
                        <span className="text-gray-900 text-right break-all">
                          {selectedOrder.user?.email || 'Chưa có'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Số điện thoại:</span>
                        <span className="text-gray-900">
                          {selectedOrder.shippingAddress?.phone || 'Chưa có'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-600 font-medium">Địa chỉ giao hàng:</span>
                        <span className="text-gray-900 text-right break-words max-w-48">
                          {selectedOrder.shippingAddress?.address || 'Chưa có'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 text-blue-600 mr-2" />
                  Danh sách sản phẩm ({selectedOrder.items?.length || 0} sản phẩm)
                </h3>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sản phẩm
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Số lượng
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Đơn giá
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thành tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items?.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900 break-words">
                                {item.name || item.productName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm text-gray-900 font-semibold">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm text-gray-900">
                                {item.price?.toLocaleString('vi-VN')} ₫
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-semibold text-green-600">
                                {((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} ₫
                              </span>
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                              Không có sản phẩm nào
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <AddProductModal
          onClose={() => setShowAddProductModal(false)}
          categories={categories}
          onSubmit={handleAddProduct}
          loading={productLoading}
        />
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => {
            setShowEditProductModal(false);
            setEditingProduct(null);
          }}
          categories={categories}
          onSubmit={handleEditProduct}
          loading={productLoading}
        />
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onSubmit={handleAddUser}
          loading={loading}
        />
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => {
            setShowEditUserModal(false);
            setEditingUser(null);
          }}
          onSubmit={handleEditUser}
          loading={loading}
        />
      )}
    </div>
  );
};

export default AdminDashboard; 
