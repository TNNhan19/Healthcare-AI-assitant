import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Calendar, BarChart3, Settings, 
  Plus, Edit, Eye, Search, Filter, Grid, List,
  CheckCircle, AlertCircle, Clock, UserCheck, X, Trash, AlertTriangle,Bot,
  DollarSign, ShoppingCart,ClipboardList,TrendingUp,BookOpen,Zap,Factory
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { Order } from '../types/order';

interface PharmacistDashboardProps {}
const OrderDetailsModal: React.FC<{
  order: Order | null;
  open: boolean;
  onClose: () => void;
}> = ({ order, open, onClose }) => {
  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-w-3xl w-full bg-white rounded-lg overflow-auto max-h-[90vh] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Chi tiết đơn hàng #{String(order._id).slice(-6)}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Khách hàng</h4>
            <p>{order.user?.userName || 'N/A'} - {order.user?.email || 'N/A'}</p>
          </div>

          <div>
            <h4 className="font-medium">Địa chỉ giao hàng</h4>
            <p className="text-sm">{order.shippingAddress?.fullName || ''} • {order.shippingAddress?.phone || ''}</p>
            <p className="text-sm">{order.shippingAddress?.address || ''}</p>
            <p className="text-sm">{[order.shippingAddress?.ward, order.shippingAddress?.district, order.shippingAddress?.city].filter(Boolean).join(', ')}</p>
          </div>

          <div>
            <h4 className="font-medium">Sản phẩm</h4>
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Tên</th>
                  <th className="text-right">Số lượng</th>
                  <th className="text-right">Đơn giá</th>
                  <th className="text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td>{(it as any).name || (it as any).product?.name || 'N/A'}</td>
                    <td className="text-right">{(it as any).quantity ?? 0}</td>
                    <td className="text-right">{new Intl.NumberFormat('vi-VN').format((it as any).price ?? 0)} ₫</td>
                    <td className="text-right">{new Intl.NumberFormat('vi-VN').format(((it as any).price ?? 0) * ((it as any).quantity ?? 0))} ₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Thanh toán & Ghi chú</h4>
              <p>Phương thức: {order.paymentMethod || '-'}</p>
              <p>Trạng thái thanh toán: {order.paymentStatus || '-'}</p>
              <p>Ghi chú: {order.notes || order['notes'] || '-'}</p>
            </div>
            <div>
              <h4 className="font-medium">Thông tin giao hàng & Tổng</h4>
              <p>Ngày ước tính giao: {order.estimatedDelivery ? new Date((order.estimatedDelivery as any).$date || order.estimatedDelivery).toLocaleString('vi-VN') : '-'}</p>
              <p>Subtotal: {new Intl.NumberFormat('vi-VN').format(order.subtotal ?? 0)} ₫</p>
              <p>Phí vận chuyển: {new Intl.NumberFormat('vi-VN').format(order.shippingCost ?? 0)} ₫</p>
              <p className="text-lg font-bold">Tổng: {new Intl.NumberFormat('vi-VN').format(order.totalAmount ?? 0)} ₫</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const PharmacistDashboard: React.FC<PharmacistDashboardProps> = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Real data state
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalProducts: 0, pendingAppointments: 0, todayAppointments: 0, lowStockProducts: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  
  // Modal states for product management
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
  // Product view and filter states
  const [productViewMode, setProductViewMode] = useState<'grid' | 'list'>('grid');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Add product form states
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  
  // Success notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsPerPage] = useState(20); // 20 sản phẩm mỗi trang
  
  // Order management states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState<{ orderId: string; newStatus: string } | null>(null);
  
  // Order pagination and filter states
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [orderTotalItems, setOrderTotalItems] = useState(0);
  const [ordersPerPage] = useState(10);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderLoading, setOrderLoading] = useState(false);
  
  // Category mapping
  const categoryMap = {
    'thuc-pham-chuc-nang': {
      name: 'Thực phẩm chức năng',
      subCategories: [
        { value: 'vitamin-khoang-chat', name: 'Vitamin và khoáng chất' },
        { value: 'ho-tro-tieu-hoa', name: 'Hỗ trợ tiêu hóa' },
        { value: 'bo-nao', name: 'Bổ não' },
        { value: 'bo-tro-xuong-khop', name: 'Bổ trợ xương khớp' },
        { value: 'bo-gan-thanh-nhiet', name: 'Bổ gan, thanh nhiệt' },
        { value: 'lam-dep-giam-can', name: 'Làm đẹp, giảm cân' },
        { value: 'ho-tro-tim-mach', name: 'Hỗ trợ tim mạch' }
      ]
    },
    'duoc-my-pham': {
      name: 'Dược mỹ phẩm',
      subCategories: [
        { value: 'duong-da-duong-moi', name: 'Dưỡng da, dưỡng môi' },
        { value: 'tri-mun-ngua-seo-mo-tham', name: 'Trị mụn, ngừa sẹo, mờ thâm' }
      ]
    },
    'cham-soc-ca-nhan': {
      name: 'Chăm sóc cá nhân',
      subCategories: [
        { value: 'cham-soc-rang-mieng', name: 'Chăm sóc răng miệng' },
        { value: 'cham-soc-mat-tai-mui-hong', name: 'Chăm sóc mắt, tai, mũi, họng' }
      ]
    },
    'thiet-bi-dung-cu-y-te': {
      name: 'Thiết bị, dụng cụ y tế',
      subCategories: [
        { value: 'bong-gon-bang-gac-gang-tay', name: 'Bông gòn, băng gạc, găng tay' },
        { value: 'mieng-dan-giam-dau-ha-sot', name: 'Miếng dán, giảm đau, hạ sốt' },
        { value: 'nuoc-muoi-dung-dich-sat-trung', name: 'Nước muối, dung dịch, dung dịch sát trùng' }
      ]
    }
  };
  // Load orders with pagination and filtering
const loadOrders = async (page: number = 1, search: string = '', status: string = 'all') => {
  try {
    setOrderLoading(true);
    console.log(`🔍 Loading orders: page=${page}, search="${search}", status="${status}"`);
    
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(ordersPerPage));
    
    if (search.trim()) {
      params.set('search', search.trim());
    }
    
    if (status !== 'all') {
      params.set('status', status);
    }
    
    console.log('🌐 API URL:', `/api/v1/orders/admin/all?${params.toString()}`);
    
    // Try the admin endpoint first (since pharmacist should see all orders)
    const response = await fetch(`/api/v1/orders/admin/all?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('pharmacist_token')}` }
    });
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('📊 API Response:', result);
      
      if (result.success && result.data) {
        const ordersData = result.data; // data chính là array orders
        console.log(`✅ API Success: Found ${ordersData.length} orders`);
        console.log('📄 Pagination info:', result.pagination);
        
        setOrders(ordersData);
        setOrderTotalItems(result.pagination?.totalOrders || ordersData.length);
        setOrderTotalPages(result.pagination?.totalPages || Math.ceil(ordersData.length / ordersPerPage));
        setOrderCurrentPage(result.pagination?.currentPage || page);
        
        console.log(`📈 Set totals: ${result.pagination?.totalOrders || ordersData.length} items, ${result.pagination?.totalPages || Math.ceil(ordersData.length / ordersPerPage)} pages`);
        return;
      }
    } else {
      console.log('❌ API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
    
    console.log('🔄 API failed, falling back to orderService');
    // Fallback to existing orderService
    const allOrders = await orderService.getOrders();
    console.log(`🔄 Service loaded ${allOrders.length} orders`);
    
    // Apply client-side filtering
    let filteredData = allOrders;
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.user?.userName?.toLowerCase().includes(searchLower) ||
        order.user?.email?.toLowerCase().includes(searchLower) ||
        order._id?.toLowerCase().includes(searchLower) ||
        order.id?.toLowerCase().includes(searchLower)
      );
    }
    
    if (status !== 'all') {
      filteredData = filteredData.filter(order => order.orderStatus === status);
    }
    
    console.log(`🔍 After filtering: ${filteredData.length} orders`);
    
    // Implement client-side pagination
    const startIndex = (page - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    setOrders(paginatedData);
    setOrderTotalItems(filteredData.length);
    setOrderTotalPages(Math.ceil(filteredData.length / ordersPerPage));
    setOrderCurrentPage(page);
    
    console.log(`📄 Client-side pagination: Showing ${paginatedData.length} orders on page ${page} of ${Math.ceil(filteredData.length / ordersPerPage)}`);
    
  } catch (err) {
    console.error('💥 Error loading orders:', err);
    setOrders([]);
    setOrderTotalItems(0);
    setOrderTotalPages(1);
    setOrderCurrentPage(1);
  } finally {
    setOrderLoading(false);
  }
};

// Load all orders for stats (not paginated)
const loadOrderStats = async () => {
  try {
    console.log('Loading order stats...');
    
    // Try API endpoint for stats
    const response = await fetch('/api/v1/orders/admin/statistics', {
      headers: { Authorization: `Bearer ${localStorage.getItem('pharmacist_token')}` }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Stats API Response:', result);
      
      if (result.success) {
        return {
          total: result.data.totalOrders || 0,
          pending: result.data.pendingOrders || 0,
          delivered: result.data.deliveredOrders || 0,
          received: result.data.receivedOrders || 0,
          revenue: result.data.totalRevenue || 0
        };
      }
    }
    
    console.log('Stats API failed, calculating from orderService');
    // Fallback: load all orders and calculate stats
    const allOrders = await orderService.getOrders();
    console.log(`Calculating stats from ${allOrders.length} orders`);
    
    const stats = {
      total: allOrders.length,
      pending: allOrders.filter(o => o.orderStatus === 'pending').length,
      delivered: allOrders.filter(o => o.orderStatus === 'delivered').length,
      received: allOrders.filter(o => o.orderStatus === 'received').length,
      revenue: allOrders.filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'received')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };
    
    console.log('Calculated stats:', stats);
    return stats;
    
  } catch (err) {
    console.error('Lỗi khi load thống kê đơn hàng', err);
    return { total: 0, pending: 0, delivered: 0, received: 0, revenue: 0 };
  }
};

const [orderStats, setOrderStats] = useState({
  total: 0,
  pending: 0,
  delivered: 0,
  revenue: 0
});

useEffect(() => {
  const initializeOrders = async () => {
    await loadOrders(1, orderSearchTerm, orderStatusFilter);
    const stats = await loadOrderStats();
    setOrderStats(stats);
  };
  
  initializeOrders();
}, []);

const handleStatusChange = (orderId: string, newStatus: string) => {
  console.log('handleStatusChange called with:', { orderId, newStatus });
  // Show confirmation modal for all status changes
  setSelectedOrderForUpdate({ orderId, newStatus });
  setShowConfirmModal(true);
};

const handleConfirmStatusUpdate = async () => {
  if (!selectedOrderForUpdate) return;
  
  try {
    await handleUpdateStatus(selectedOrderForUpdate.orderId, selectedOrderForUpdate.newStatus);
    setShowConfirmModal(false);
    setSelectedOrderForUpdate(null);
    // Reload orders and stats to reflect changes
    await loadOrders(orderCurrentPage, orderSearchTerm, orderStatusFilter);
    const updatedStats = await loadOrderStats();
    setOrderStats(updatedStats);
  } catch (err) {
    console.error('Cập nhật trạng thái thất bại', err);
  }
};

// Handle search with debounce
const handleOrderSearch = useCallback((searchValue: string) => {
  setOrderSearchTerm(searchValue);
  setOrderCurrentPage(1); // Reset to first page when searching
  
  // Debounce search
  const timeoutId = setTimeout(() => {
    loadOrders(1, searchValue, orderStatusFilter);
  }, 500);
  
  return () => clearTimeout(timeoutId);
}, [orderStatusFilter]);

// Handle status filter change
const handleStatusFilterChange = (status: string) => {
  setOrderStatusFilter(status);
  setOrderCurrentPage(1); // Reset to first page when filtering
  loadOrders(1, orderSearchTerm, status);
};

// Handle pagination
const handleOrderPageChange = (page: number) => {
  setOrderCurrentPage(page);
  loadOrders(page, orderSearchTerm, orderStatusFilter);
};

// Reset filters
const resetOrderFilters = () => {
  setOrderSearchTerm('');
  setOrderStatusFilter('all');
  setOrderCurrentPage(1);
  loadOrders(1, '', 'all');
};

const handleUpdateStatus = async (id: string, status: string) => {
  try {
    console.log(`Updating order ${id} to status: ${status}`);
    const updated = await orderService.updateStatus(id, status);
    console.log('Update response:', updated);
    
    // Update local state using either id or _id
    setOrders(prev => prev.map(o => 
      (o.id === id || o._id === id) ? { ...o, orderStatus: status } : o
    ));
    
    console.log('Local state updated');
  } catch (err) {
    console.error('Cập nhật trạng thái thất bại', err);
    alert('Cập nhật trạng thái thất bại. Vui lòng thử lại.');
  }
};

// Product management functions
const openEditProductModal = useCallback((product: any) => {
  setEditingProduct(product);
  setShowEditProductModal(true);
}, []);
const CATEGORY_DATA_MAP: { [key: string]: { name: string, subCategories: { value: string, name: string }[] } } = {
  'thuc-pham-chuc-nang': {
    name: 'Thực phẩm chức năng',
    subCategories: [
      { value: 'vitamin-khoang-chat', name: 'Vitamin và khoáng chất' },
      { value: 'ho-tro-tieu-hoa', name: 'Hỗ trợ tiêu hóa' },
      { value: 'bo-nao', name: 'Bổ não' },
      { value: 'bo-tro-xuong-khop', name: 'Bổ trợ xương khớp' },
      { value: 'bo-gan-thanh-nhiet', name: 'Bổ gan, thanh nhiệt' },
      { value: 'lam-dep-giam-can', name: 'Làm đẹp, giảm cân' },
      { value: 'ho-tro-tim-mach', name: 'Hỗ trợ tim mạch' },
    ],
  },
  'duoc-my-pham': {
    name: 'Dược mỹ phẩm',
    subCategories: [
      { value: 'duong-da-duong-moi', name: 'Dưỡng da, dưỡng môi' },
      { value: 'tri-mun-ngua-seo-mo-tham', name: 'Trị mụn, ngừa sẹo, mờ thâm' },
    ],
  },
  'cham-soc-ca-nhan': {
    name: 'Chăm sóc cá nhân',
    subCategories: [
      { value: 'cham-soc-rang-mieng', name: 'Chăm sóc răng miệng' },
      { value: 'cham-soc-mat-tai-mui-hong', name: 'Chăm sóc mắt, tai, mũi, họng' },
    ],
  },
  'thiet-bi-dung-cu-y-te': {
    name: 'Thiết bị, dụng cụ y tế',
    subCategories: [
      { value: 'bong-gon-bang-gac-gang-tay', name: 'Bông gòn, băng gạc, găng tay' },
      { value: 'mieng-dan-giam-dau-ha-sot', name: 'Miếng dán, giảm đau, hạ sốt' },
      { value: 'nuoc-muoi-dung-dich-sat-trung', name: 'Nước muối, dung dịch, dung dịch sát trùng' },
    ],
  },
};

const handleEditProduct = useCallback(async (formData: any) => {
  try {
      const token = localStorage.getItem('pharmacist_token');

      if (!token) {
          alert('Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.');
          return;
      }
      const mainCategoryKey = formData.main_category;
    const subCategoryKey = formData.sub_category;

    const mainCat = CATEGORY_DATA_MAP[mainCategoryKey];
    const mainCategoryName = mainCat?.name || mainCategoryKey || '';

    let subCategoryName = subCategoryKey || '';
    if (mainCat && mainCat.subCategories) {
      const subCat = mainCat.subCategories.find((s: any) => s.value === subCategoryKey);
      subCategoryName = subCat?.name || subCategoryKey || '';
    }
    // -----------------------------------------------------------------------------------------

    const product_info_text = formData.product_info || null; 
        // -------------------------------------------------------------------
        
        const productPayload = {
            // Basic required fields
            name: formData.name || '',
            soDangKy: formData.soDangKy || '',
            main_category: mainCategoryName,
            sub_category: subCategoryName,
            price: parseFloat(formData.price) || 0,
            stock: parseInt(formData.stock) || 0,
            
            // Basic info fields
            description: formData.description || null,
            imageUrl: formData.imageUrl || null,
            
            // Company and manufacturer info
            congTy: formData.congTy || null,
            congTyDangKy: formData.congTyDangKy || null,
            congTySanXuat: formData.congTySanXuat || null,
            
            thuongHieu: formData.thuongHieu || null,
            quocGia: formData.quocGia || null,
            
            // Product specification
            dangBaoChe: formData.dangBaoChe || null,
            dongGoi: formData.dongGoi || null,
            hanSuDung: formData.hanSuDung || null,
            
            // Content and instructions
            hoatChatChinh: formData.hoatChatChinh || null,
            thanhPhan: formData.thanhPhan || formData.hoatChatChinh || null, 
            huongDan: formData.huongDan || null,
            
            // Links and media
            linkChiTiet: formData.linkChiTiet || null,
            usageGuideHref: formData.usageGuideHref || null,
            usageGuideImage: formData.usageGuideImage || null,
            
            // Status and metrics
            view: parseInt(formData.view) || 0,
            paid: parseInt(formData.paid) || 0,
            embedding_status: formData.embedding_status || 'pending',
            
            // SỬ DỤNG TEXT (UNSTRUCTURED) CHO product_info
            product_info: product_info_text, 
            
            // Details object for backend compatibility (Giữ nguyên)
            details: {
                thanhPhanChinh: formData.hoatChatChinh || null,
                thuongHieu: formData.thuongHieu || null,
                nhaSanXuat: formData.congTySanXuat || null,
                quocGia: formData.quocGia || null,
                cachDongGoi: formData.dongGoi || null,
                hanDung: formData.hanSuDung || null,
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

      // ... (phần fetch API giữ nguyên)
      const res = await fetch(`/api/v1/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(productPayload)
      });

      if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();

      if (json.success) {
          alert('Cập nhật sản phẩm thành công!');
          setShowEditProductModal(false);
          setEditingProduct(null);
          // Reload products
          await loadProducts(currentPage);
      } else {
          alert(`❌ ${json.message || 'Cập nhật sản phẩm thất bại'}`);
      }
  } catch (e) {
      console.error('edit product error', e);
      alert('Có lỗi xảy ra khi cập nhật sản phẩm');
  }
}, [editingProduct]);
// Add product function
const handleAddProduct = useCallback(async (formData: any) => {
  setProductLoading(true);
  try {
    const token = localStorage.getItem('pharmacist_token');
    
    if (!token) {
      alert('Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.');
      return;
    }

    const mainCategoryKey = formData.main_category;
    const subCategoryKey = formData.sub_category;

    const mainCat = CATEGORY_DATA_MAP[mainCategoryKey];
    const mainCategoryName = mainCat?.name || mainCategoryKey || '';

    let subCategoryName = subCategoryKey || '';
    if (mainCat && mainCat.subCategories) {
      const subCat = mainCat.subCategories.find((s: any) => s.value === subCategoryKey);
      subCategoryName = subCat?.name || subCategoryKey || '';
    }
    // -----------------------------------------------------------------------------------------

    const product_info_text = formData.product_info || null; 
        // -------------------------------------------------------------------
        
        const productPayload = {
            // Basic required fields
            name: formData.name || '',
            soDangKy: formData.soDangKy || '',
            main_category: mainCategoryName,
            sub_category: subCategoryName,
            price: parseFloat(formData.price) || 0,
            stock: parseInt(formData.stock) || 0,
            
            // Basic info fields
            description: formData.description || null,
            imageUrl: formData.imageUrl || null,
            
            // Company and manufacturer info
            congTy: formData.congTy || null,
            congTyDangKy: formData.congTyDangKy || null,
            congTySanXuat: formData.congTySanXuat || null,
            
            thuongHieu: formData.thuongHieu || null,
            quocGia: formData.quocGia || null,
            
            // Product specification
            dangBaoChe: formData.dangBaoChe || null,
            dongGoi: formData.dongGoi || null,
            hanSuDung: formData.hanSuDung || null,
            
            // Content and instructions
            hoatChatChinh: formData.hoatChatChinh || null,
            thanhPhan: formData.thanhPhan || formData.hoatChatChinh || null, 
            huongDan: formData.huongDan || null,
            
            // Links and media
            linkChiTiet: formData.linkChiTiet || null,
            usageGuideHref: formData.usageGuideHref || null,
            usageGuideImage: formData.usageGuideImage || null,
            
            // Status and metrics
            view: parseInt(formData.view) || 0,
            paid: parseInt(formData.paid) || 0,
            embedding_status: formData.embedding_status || 'pending',
            
            // SỬ DỤNG TEXT (UNSTRUCTURED) CHO product_info
            product_info: product_info_text, 
            
            // Details object for backend compatibility (Giữ nguyên)
            details: {
                thanhPhanChinh: formData.hoatChatChinh || null,
                thuongHieu: formData.thuongHieu || null,
                nhaSanXuat: formData.congTySanXuat || null,
                quocGia: formData.quocGia || null,
                cachDongGoi: formData.dongGoi || null,
                hanDung: formData.hanSuDung || null,
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


    console.log('Creating product with payload:', productPayload);

    const res = await fetch('/api/v1/products/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(productPayload)
    });

    console.log('Response status:', res.status, res.statusText);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Server response:', errorText);
      throw new Error(`HTTP ${res.status}: ${res.statusText}\nResponse: ${errorText}`);
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await res.text();
      throw new Error(`Expected JSON response but got: ${contentType}\nResponse: ${responseText}`);
    }

    const json = await res.json();
    console.log('API Response:', json);
    
    if (json.success) {
      // Success notification with details about both product and stock entry
      const message = `Sản phẩm "${json.data.product.name}" đã được thêm thành công với ${json.data.product.stock} sản phẩm trong kho. Batch: ${json.data.stockEntry.batchNumber}`;
      
      setSuccessMessage(message);
      setShowSuccessNotification(true);
      
      // Auto hide notification after 5 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 5000);
      
      setShowAddProductModal(false);
      setSelectedMainCategory('');
      
      // Reset form by reloading the page or clearing form fields
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) form.reset();
      
      // Reload products list
      await loadProducts(currentPage);
      
      // Update total stats
      setStats(prev => ({ 
        ...prev, 
        totalProducts: totalProducts + 1
      }));
      
    } else {
      alert(`❌ ${json.message || 'Thêm sản phẩm thất bại'}`);
    }
  } catch (e) {
    console.error('add product error', e);
    if (e instanceof Error) {
      alert(`Có lỗi xảy ra khi thêm sản phẩm: ${e.message}`);
    } else {
      alert('Có lỗi xảy ra khi thêm sản phẩm');
    }
  } finally {
    setProductLoading(false);
  }
}, []);

  // Load products function with pagination and search
  const loadProducts = async (page: number = 1, searchTerm: string = '') => {
    try {
      const params: any = { 
        page: page, 
        limit: productsPerPage 
      };
      
      // If there's a search term, add it to params
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
        // When searching, get more results to ensure we find matches
        params.limit = 100;
      }
      
      const prodRes = await productService.getProducts(params);
      
      // Check which field contains the actual products
      const actualProducts = prodRes.data || prodRes.products || [];
      setProducts(actualProducts);
      
      // Update pagination info
      const pagination = prodRes.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages || Math.ceil(pagination.totalItems / productsPerPage));
        setTotalProducts(pagination.totalItems || 0);
        setCurrentPage(pagination.currentPage || page);
      } else {
        // Fallback if no pagination info
        setTotalProducts(prodRes.count || actualProducts.length || 0);
        setTotalPages(searchTerm.trim() ? 1 : Math.ceil((prodRes.count || actualProducts.length || 0) / productsPerPage));
        setCurrentPage(searchTerm.trim() ? 1 : page);
      }
      
      const low = (actualProducts || []).filter((p: any) => (p.stock || 0) <= 5).map((p: any) => ({ name: p.name, currentStock: p.stock || 0, minStock: 5 }));
      setLowStockProducts(low);
      setStats(prev => ({ 
        ...prev, 
        totalProducts: prodRes.pagination?.totalItems || prodRes.count || actualProducts.length || 0, 
        lowStockProducts: low.length 
      }));
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadProducts(1);

        // Appointments: optional if endpoint exists; keep empty arrays if not reachable
        const headers: any = { Authorization: `Bearer ${localStorage.getItem('pharmacist_token')}` };
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        try {
          const aptListRes = await fetch(`/api/v1/appointments/pharmacist/all?date=${dateStr}&limit=10`, { headers });
          const aptListJson = await aptListRes.json();
          if (aptListJson?.data) {
            const mapped = aptListJson.data.map((a: any) => ({
              id: `#${String(a._id).slice(-6).toUpperCase()}`,
              patient: a.patientName,
              type: a.appointmentType,
              date: a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString('vi-VN') : '',
              time: a.appointmentTime || '',
              status: a.status,
            }));
            setRecentAppointments(mapped);
            const todayCount = mapped.length;
            const pendingCount = mapped.filter((x: any) => x.status === 'pending').length;
            setStats(prev => ({ ...prev, todayAppointments: todayCount, pendingAppointments: pendingCount }));
          }
        } catch (e) {
          // Silently ignore if appointments endpoint is not available
        }
      } catch (e) {
        console.error('load pharmacist dashboard error', e);
      }
    };
    load();
  }, []);

  const tabs = [
    { id: 'overview', name: 'Tổng quan', icon: BarChart3 },
    { id: 'products', name: 'Quản lý sản phẩm', icon: Package },
    { id: 'orders', name: 'Quản lý đơn hàng', icon: Package },
    { id: 'consultations', name: 'Tư vấn', icon: UserCheck },
    { id: 'chat', name: 'Chat', icon: Bot },
    { id: 'settings', name: 'Cài đặt', icon: Settings }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-8 space-y-8">
            {/* Enhanced Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Tổng quan hệ thống
              </h2>
              <p className="text-gray-600 text-lg">Theo dõi hoạt động và hiệu suất của nhà thuốc</p>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Tổng sản phẩm</p>
                    <p className="text-3xl font-bold text-blue-800 mt-2">{stats.totalProducts.toLocaleString()}</p>
                    <p className="text-xs text-blue-600 mt-1">Sản phẩm trong kho</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-yellow-600 uppercase tracking-wider">Doanh thu</p>
                    <p className="text-3xl font-bold text-yellow-800 mt-2">{orderStats.revenue?.toLocaleString('vi-VN') || 0} ₫</p>
                    <p className="text-xs text-yellow-600 mt-1">Tổng doanh thu</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-600 uppercase tracking-wider">Tổng đơn hàng</p>
                    <p className="text-3xl font-bold text-green-800 mt-2">{orderStats.total || 0}</p>
                    <p className="text-xs text-green-600 mt-1">Đơn hàng</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <ShoppingCart className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">Sắp hết hàng</p>
                    <p className="text-3xl font-bold text-red-800 mt-2">{stats.lowStockProducts}</p>
                    <p className="text-xs text-red-600 mt-1">Cần nhập thêm</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                    <AlertCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Low Stock Alert */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <AlertCircle className="h-6 w-6 mr-3" />
                  Cảnh báo sắp hết hàng
                </h3>
                <p className="text-red-100 mt-1">Các sản phẩm cần được nhập thêm</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Tồn kho hiện tại
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Tồn kho tối thiểu
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lowStockProducts.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.currentStock < product.minStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {product.currentStock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.minStock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'products':
        // When searching, products are already filtered by backend
        // No need for additional filtering on client side
        const filteredProducts = products;

        // Debug summary
        if (productSearchTerm.trim()) {
          console.log(`Search "${productSearchTerm}" found ${filteredProducts.length} products out of ${products.length} total`);
          
          // Show sample of what we're searching through
          if (products.length > 0 && filteredProducts.length === 0) {
            console.log('Sample products we searched through:');
            products.slice(0, 3).forEach((p, i) => {
              console.log(`${i+1}. Name: "${p.name}", SoDangKy: "${p.soDangKy}"`);
            });
          }
        }

        return (
          <div className="p-8 space-y-6">
            {/* Header with Title and View Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Quản lý sản phẩm
                </h2>
                <p className="text-gray-600 mt-1">Quản lý danh mục sản phẩm và kho hàng</p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Add Product Button */}
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Thêm sản phẩm
                </button>
                
                {/* View Mode Toggle */}
                <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                  <button
                    onClick={() => setProductViewMode('grid')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      productViewMode === 'grid'
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setProductViewMode('list')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      productViewMode === 'list'
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>            {/* Search and Filter Bar */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200/50 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5" />
                    <input
                      type="text"
                      value={productSearchTerm}
                      onChange={(e) => {
                        const term = e.target.value;
                        setProductSearchTerm(term);
                        
                        // Reset to first page when searching
                        setCurrentPage(1);
                        
                        // Debounce search to avoid too many API calls
                        if (searchTimeout) {
                          clearTimeout(searchTimeout);
                        }
                        
                        const newTimeout = setTimeout(() => {
                          loadProducts(1, term);
                        }, 500); // Wait 500ms after user stops typing
                        
                        setSearchTimeout(newTimeout);
                      }}
                      placeholder="Tìm kiếm sản phẩm theo tên, số đăng ký..."
                      className="w-full pl-10 pr-4 py-2.5 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/90"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setProductSearchTerm('');
                      setSelectedCategory('all');
                      setCurrentPage(1);
                      loadProducts(1, ''); // Reset to show all products
                    }}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
                  >
                    <Filter className="h-4 w-4 mr-2 inline" />
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Products Display */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {filteredProducts && filteredProducts.length > 0 ? (
                productViewMode === 'grid' ? (
                  /* Grid View */
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.map((product: any) => (
                        <div key={product._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group">
                          {/* Product Image */}
                          <div className="h-48 bg-gray-100 relative overflow-hidden">
                            {product.imageUrl || product.image ? (
                              <img 
                                src={product.imageUrl || product.image} 
                                alt={product.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                <Package className="h-16 w-16 text-gray-400" />
                              </div>
                            )}
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                (product.stock ?? 0) > 0 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {(product.stock ?? 0) > 0 ? 'Có sẵn' : 'Hết hàng'}
                              </span>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                              {product.name}
                            </h3>
                            
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                              <div className="flex justify-between">
                                <span>Số đăng ký:</span>
                                <span className="font-medium">{product.soDangKy || 'N/A'}</span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Giá bán:</span>
                                <span className="font-bold text-green-600">
                                  {(product.price || 0).toLocaleString('vi-VN')} ₫
                                </span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span>Tồn kho:</span>
                                <span className={`font-medium ${(product.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {product.stock ?? 0} sản phẩm
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-center gap-2 pt-3 border-t border-gray-100">
                              <button 
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                                onClick={() => setSelectedProduct(product)}
                                title="Xem chi tiết"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="text-sm font-medium">Xem</span>
                              </button>
                              
                              <button 
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200 hover:border-green-300"
                                onClick={() => openEditProductModal(product)}
                                title="Chỉnh sửa"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="text-sm font-medium">Sửa</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* List View - Card Style like in image */
                  <div className="p-6 space-y-4">
                    {filteredProducts.map((product: any) => (
                      <div key={product._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {product.imageUrl || product.image ? (
                              <img 
                                src={product.imageUrl || product.image} 
                                alt={product.name} 
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                              {product.name}
                            </h3>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Số đăng ký:</span>
                                <p className="font-medium text-gray-900">{product.soDangKy || 'N/A'}</p>
                              </div>
                              
                              <div>
                                <span className="text-gray-500">Danh mục:</span>
                                <p className="font-medium text-gray-900 truncate">
                                  {product.category || [product.main_category, product.sub_category].filter(Boolean).join(' > ') || 'Chưa phân loại'}
                                </p>
                              </div>
                              
                              <div>
                                <span className="text-gray-500">Giá bán:</span>
                                <p className="font-semibold text-green-600">
                                  {(product.price || 0).toLocaleString('vi-VN')} ₫
                                </p>
                              </div>
                              
                              <div>
                                <span className="text-gray-500">Tồn kho:</span>
                                <p className="font-medium">{product.stock ?? 0} sản phẩm</p>
                              </div>
                            </div>

                            <div className="mt-2">
                              <span className="text-gray-500">Trạng thái:</span>
                              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                (product.stock ?? 0) > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {(product.stock ?? 0) > 0 ? 'Có sẵn' : 'Hết hàng'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex-shrink-0 flex gap-2">
                            <button 
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                              onClick={() => setSelectedProduct(product)}
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            <button 
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200 hover:border-green-300"
                              onClick={() => openEditProductModal(product)}
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <Package className="h-20 w-20 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {productSearchTerm || selectedCategory !== 'all' ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}
                  </h3>
                  <p className="text-gray-500 text-center max-w-md">
                    {productSearchTerm || selectedCategory !== 'all' 
                      ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để xem kết quả khác.'
                      : 'Sản phẩm sẽ được hiển thị khi có dữ liệu!'
                    }
                  </p>
                  {(productSearchTerm || selectedCategory !== 'all') && (
                    <button 
                      onClick={() => {
                        setProductSearchTerm('');
                        setSelectedCategory('all');
                      }}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {!productSearchTerm && selectedCategory === 'all' && totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  {/* Pagination Info */}
                  <div className="text-sm text-gray-600">
                    Hiển thị {((currentPage - 1) * productsPerPage) + 1} - {Math.min(currentPage * productsPerPage, totalProducts)} trong tổng số {totalProducts} sản phẩm
                  </div>
                  
                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => {
                        if (currentPage > 1) {
                          const newPage = currentPage - 1;
                          setCurrentPage(newPage);
                          loadProducts(newPage, productSearchTerm);
                        }
                      }}
                      disabled={currentPage <= 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Trước
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = index + 1;
                        } else if (currentPage <= 3) {
                          pageNum = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + index;
                        } else {
                          pageNum = currentPage - 2 + index;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              loadProducts(pageNum, productSearchTerm);
                            }}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-green-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="px-2 text-gray-500">...</span>
                          <button
                            onClick={() => {
                              setCurrentPage(totalPages);
                              loadProducts(totalPages, productSearchTerm);
                            }}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={() => {
                        if (currentPage < totalPages) {
                          const newPage = currentPage + 1;
                          setCurrentPage(newPage);
                          loadProducts(newPage, productSearchTerm);
                        }
                      }}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'orders':
        return (
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Thống kê đơn hàng
              </h2>
              <p className="text-gray-600 text-lg">Quản lý và theo dõi tình trạng đơn hàng</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Tổng đơn hàng</p>
                    <p className="text-3xl font-bold text-blue-800 mt-2">{orderStats.total}</p>
                    <p className="text-blue-600 text-sm mt-1">
                      {orderSearchTerm || orderStatusFilter !== 'all' 
                        ? `${orderTotalItems} kết quả tìm kiếm` 
                        : 'Tất cả đơn hàng'
                      }
                    </p>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-xl">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider">Chờ xử lý</p>
                    <p className="text-3xl font-bold text-orange-800 mt-2">
                      {orderStatusFilter === 'pending' 
                        ? orderTotalItems 
                        : orderStats.pending
                      }
                    </p>
                    <p className="text-orange-600 text-sm mt-1">Cần xác nhận</p>
                  </div>
                  <div className="bg-orange-500 p-3 rounded-xl">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-600 uppercase tracking-wider">Hoàn thành</p>
                    <p className="text-3xl font-bold text-green-800 mt-2">
                      {orderStatusFilter === 'delivered' 
                        ? orderTotalItems 
                        : orderStats.delivered
                      }
                    </p>
                    <p className="text-green-600 text-sm mt-1">Đã giao thành công</p>
                  </div>
                  <div className="bg-green-500 p-3 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Doanh thu</p>
                    <p className="text-3xl font-bold text-purple-800 mt-2">
                      {orderStatusFilter === 'delivered'
                        ? orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString('vi-VN')
                        : orderStats.revenue.toLocaleString('vi-VN')
                      } ₫
                    </p>
                    <p className="text-purple-600 text-sm mt-1">Từ đơn đã giao</p>
                  </div>
                  <div className="bg-purple-500 p-3 rounded-xl">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={orderSearchTerm}
                    onChange={(e) => handleOrderSearch(e.target.value)}
                    placeholder="Tìm kiếm đơn hàng theo mã, khách hàng..."
                    className="w-full pl-10 pr-4 py-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/90"
                  />
                </div>
                <select 
                  value={orderStatusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="px-4 py-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="shipped">Đang giao</option>
                  <option value="delivered">Đã giao</option>
                  <option value="received">Đã nhận</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
                <button 
                  onClick={resetOrderFilters}
                  className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <X className="h-5 w-5" />
                  <span>Xóa lọc</span>
                </button>
              </div>
              
              {/* Filter Summary */}
              {(orderSearchTerm || orderStatusFilter !== 'all') && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600">Đang lọc:</span>
                  {orderSearchTerm && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Tìm kiếm: "{orderSearchTerm}"
                      <button
                        onClick={() => handleOrderSearch('')}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {orderStatusFilter !== 'all' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Trạng thái: {orderStatusFilter === 'pending' ? 'Chờ xử lý' : 
                                   orderStatusFilter === 'confirmed' ? 'Đã xác nhận' :
                                   orderStatusFilter === 'processing' ? 'Đang xử lý' :
                                   orderStatusFilter === 'shipped' ? 'Đang giao' :
                                   orderStatusFilter === 'delivered' ? 'Đã giao' :
                                   orderStatusFilter === 'cancelled' ? 'Đã hủy' : orderStatusFilter}
                      <button
                        onClick={() => handleStatusFilterChange('all')}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    ({orderTotalItems} kết quả)
                  </span>
                </div>
              )}
            </div>
            
            {/* Orders Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <Package className="h-6 w-6 mr-3" />
                      Danh sách đơn hàng
                    </h3>
                    <p className="text-blue-100 mt-1">
                      Hiển thị {orders.length} / {orderTotalItems} đơn hàng
                      {orderCurrentPage > 1 && ` (Trang ${orderCurrentPage}/${orderTotalPages})`}
                    </p>
                  </div>
                  {orderLoading && (
                    <div className="flex items-center text-blue-100">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Đang tải...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                {orderLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Đang tải đơn hàng...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có đơn hàng</h3>
                    <p className="text-gray-500">
                      {orderSearchTerm || orderStatusFilter !== 'all' 
                        ? 'Không tìm thấy đơn hàng nào phù hợp với bộ lọc.' 
                        : 'Chưa có đơn hàng nào trong hệ thống.'
                      }
                    </p>
                    {(orderSearchTerm || orderStatusFilter !== 'all') && (
                      <button
                        onClick={resetOrderFilters}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mã đơn hàng</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Khách hàng</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Số tiền</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày đặt</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-medium text-blue-600">#{order.orderNumber}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{order.user?.userName}</div>
                              <div className="text-sm text-gray-500">{order.user?.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900">
                              {order.totalAmount.toLocaleString('vi-VN')} ₫
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={order.orderStatus}
                              onChange={(e) => handleStatusChange(order._id || order.id, e.target.value)}
                              disabled={orderLoading}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 focus:ring-yellow-500' :
                                order.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800 focus:ring-blue-500' :
                                order.orderStatus === 'processing' ? 'bg-purple-100 text-purple-800 focus:ring-purple-500' :
                                order.orderStatus === 'shipped' ? 'bg-indigo-100 text-indigo-800 focus:ring-indigo-500' :
                                order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800 focus:ring-green-500' :
                                order.orderStatus === 'received' ? 'bg-emerald-100 text-emerald-800 focus:ring-emerald-500' :
                                'bg-red-100 text-red-800 focus:ring-red-500'
                              }`}
                            >
                              <option value="pending">Chờ xử lý</option>
                              <option value="confirmed">Đã xác nhận</option>
                              <option value="processing">Đang xử lý</option>
                              <option value="shipped">Đang giao</option>
                              <option value="delivered">Đã giao</option>
                              <option value="received">Đã nhận</option>
                              <option value="cancelled">Đã hủy</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Pagination Controls */}
            {!orderLoading && orderTotalItems > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Page Info */}
                  <div className="flex items-center text-sm text-gray-700">
                    <span>
                      Hiển thị {((orderCurrentPage - 1) * ordersPerPage) + 1} - {Math.min(orderCurrentPage * ordersPerPage, orderTotalItems)} 
                      {' '}của {orderTotalItems} đơn hàng
                    </span>
                  </div>

                  {/* Pagination Buttons - Always show if more than 1 page */}
                  {orderTotalPages > 1 && (
                    <div className="flex items-center space-x-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handleOrderPageChange(orderCurrentPage - 1)}
                      disabled={orderCurrentPage <= 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Trước
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const maxVisiblePages = 5;
                        const halfVisible = Math.floor(maxVisiblePages / 2);
                        let startPage = Math.max(1, orderCurrentPage - halfVisible);
                        let endPage = Math.min(orderTotalPages, startPage + maxVisiblePages - 1);
                        
                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }

                        const pages = [];
                        
                        // First page
                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => handleOrderPageChange(1)}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              1
                            </button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="start-ellipsis" className="px-2 py-2 text-sm text-gray-500">
                                ...
                              </span>
                            );
                          }
                        }

                        // Visible pages
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handleOrderPageChange(i)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                i === orderCurrentPage
                                  ? 'text-white bg-blue-600 border border-blue-600'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }

                        // Last page
                        if (endPage < orderTotalPages) {
                          if (endPage < orderTotalPages - 1) {
                            pages.push(
                              <span key="end-ellipsis" className="px-2 py-2 text-sm text-gray-500">
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <button
                              key={orderTotalPages}
                              onClick={() => handleOrderPageChange(orderTotalPages)}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              {orderTotalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handleOrderPageChange(orderCurrentPage + 1)}
                      disabled={orderCurrentPage >= orderTotalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Sau
                    </button>
                    </div>
                  )}

                  {/* Page Size Info */}
                  <div className="flex items-center text-sm text-gray-700">
                    <span>{ordersPerPage} đơn hàng/trang</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );


      case 'appointments':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Quản lý lịch hẹn</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Thêm lịch hẹn
              </button>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời gian
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bệnh nhân
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentAppointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.patient}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                            {appointment.status === 'confirmed' ? 'Xác nhận' :
                             appointment.status === 'pending' ? 'Chờ xác nhận' : appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 mr-3">
                            <Edit className="h-4 w-4" />
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
      case 'chat':
        window.location.href = '/pharmacist/chat';
        return null;

      case 'consultations':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Tư vấn sức khỏe</h2>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch tư vấn hôm nay</h3>
              <div className="space-y-4">
                {recentAppointments.filter(apt => apt.type.includes('Tư vấn')).map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{appointment.patient}</h4>
                        <p className="text-sm text-gray-600">{appointment.type}</p>
                        <p className="text-sm text-gray-500">{appointment.time}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Cài đặt</h2>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cá nhân</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ tên
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.userName || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
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

  // Check if user is pharmacist
  if (!user || user.userType !== 'pharmacist') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 ">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h1>
          <p className="text-gray-600">Bạn cần quyền pharmacist để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="mx-auto sm:px-6">
        {/* Header with Gradient */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-blue-600 to-indigo-600 rounded-2xl opacity-10"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Pharmacist Dashboard
                </h1>
                <p className="text-gray-600 mt-2 text-lg">Quản lý sản phẩm và tư vấn khách hàng</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Chào mừng trở lại,</p>
                  <p className="font-semibold text-gray-800">{user?.userName || 'Pharmacist'}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(user?.userName || 'P').charAt(0).toUpperCase()}
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
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl text-left transition-all duration-300 group ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-700 hover:bg-gray-50 hover:shadow-md hover:transform hover:scale-102'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        activeTab === tab.id 
                          ? 'bg-white/20' 
                          : 'bg-gray-100 group-hover:bg-green-50'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          activeTab === tab.id 
                            ? 'text-white' 
                            : 'text-gray-600 group-hover:text-green-600'
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
              <div className="h-full">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Chi tiết sản phẩm</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-white hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedProduct.name}</h4>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {selectedProduct.price?.toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Số đăng ký:</span>
                      <p className="text-gray-900">{selectedProduct.soDangKy || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tồn kho:</span>
                      <p className="text-gray-900">{selectedProduct.stock || 0}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Công ty:</span>
                      <p className="text-gray-900">{selectedProduct.congTy || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Quốc gia:</span>
                      <p className="text-gray-900">{selectedProduct.quocGia || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedProduct.description && (
                <div className="mt-6">
                  <h5 className="font-semibold text-gray-900 mb-2">Mô tả:</h5>
                  <p className="text-gray-700">{selectedProduct.description}</p>
                </div>
              )}

              {selectedProduct.thanhPhan && (
                <div className="mt-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Thành phần:</h5>
                  <p className="text-gray-700">{selectedProduct.thanhPhan}</p>
                </div>
              )}

              {selectedProduct.huongDan && (
                <div className="mt-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Hướng dẫn sử dụng:</h5>
                  <p className="text-gray-700">{selectedProduct.huongDan}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

{/* Edit Product Modal */}
{showEditProductModal && editingProduct && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-lg">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Chỉnh sửa sản phẩm</h3>
                    <button
                        onClick={() => {
                            setShowEditProductModal(false);
                            setEditingProduct(null);
                        }}
                        className="text-white hover:text-gray-200"
                    >
                        {/* Assuming X icon is available */}
                        <X className="h-6 w-6" />
                    </button>
                </div>
            </div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = Object.fromEntries(formData.entries());
                    handleEditProduct(data);
                }}
                className="p-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tên sản phẩm */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tên sản phẩm *
                        </label>
                        <input
                            type="text"
                            name="name"
                            defaultValue={editingProduct.name}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Số đăng ký */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Số đăng ký *
                        </label>
                        <input
                            type="text"
                            name="soDangKy"
                            defaultValue={editingProduct.soDangKy}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Giá */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Giá (VNĐ) *
                        </label>
                        <input
                            type="number"
                            name="price"
                            defaultValue={editingProduct.price}
                            required
                            min="0"
                            step="1000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Tồn kho */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tồn kho *
                        </label>
                        <input
                            type="number"
                            name="stock"
                            defaultValue={editingProduct.stock}
                            required
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    
                    {/* Danh mục chính */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục chính *
            </label>
            <select
              name="main_category"
              value={selectedMainCategory}
              onChange={(e) => setSelectedMainCategory(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn danh mục chính</option>
              {Object.entries(categoryMap).map(([key, category]) => (
                <option key={key} value={key}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Danh mục phụ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục phụ *
            </label>
            <select
              name="sub_category"
              required
              disabled={!selectedMainCategory}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Chọn danh mục phụ</option>
              {selectedMainCategory && (categoryMap as any)[selectedMainCategory]?.subCategories.map((subCat: any) => (
                <option key={subCat.value} value={subCat.value}>{subCat.name}</option>
              ))}
            </select>
          </div>

                    {/* Công ty */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Công ty
                        </label>
                        <input
                            type="text"
                            name="congTy"
                            defaultValue={editingProduct.congTy}
                            placeholder="Nhập tên công ty"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    
                    {/* Công ty đăng ký */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Công ty đăng ký
                        </label>
                        <input
                            type="text"
                            name="congTyDangKy"
                            defaultValue={editingProduct.congTyDangKy}
                            placeholder="Nhập công ty đăng ký"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Công ty sản xuất */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Công ty sản xuất
                        </label>
                        <input
                            type="text"
                            name="congTySanXuat"
                            defaultValue={editingProduct.congTySanXuat}
                            placeholder="Nhập công ty sản xuất"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Dạng bao chế */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dạng bao chế
                        </label>
                        <input
                            type="text"
                            name="dangBaoChe"
                            defaultValue={editingProduct.dangBaoChe}
                            placeholder="Ví dụ: Viên nén, Capsule, Dung dịch..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    
                    {/* Thương hiệu */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thương hiệu
                        </label>
                        <input
                            type="text"
                            name="thuongHieu"
                            defaultValue={editingProduct.thuongHieu}
                            placeholder="Nhập thương hiệu"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    
                    {/* Quốc gia */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quốc gia
                        </label>
                        <input
                            type="text"
                            name="quocGia"
                            defaultValue={editingProduct.quocGia}
                            placeholder="Nhập quốc gia sản xuất"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* URL hình ảnh */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL hình ảnh
                        </label>
                        <input
                            type="url"
                            name="imageUrl"
                            defaultValue={editingProduct.imageUrl}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Thành phần chính (Hoạt chất) */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thành phần chính (Hoạt chất)
                        </label>
                        <textarea
                            name="hoatChatChinh"
                            defaultValue={editingProduct.hoatChatChinh}
                            rows={3}
                            placeholder="Nhập thành phần chính, hoạt chất..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Mô tả sản phẩm (description) */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mô tả sản phẩm
                        </label>
                        <textarea
                            name="description"
                            defaultValue={editingProduct.description}
                            rows={4} 
                            placeholder="Mô tả chi tiết về sản phẩm..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Hướng dẫn sử dụng (huongDan) */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hướng dẫn sử dụng
                        </label>
                        <textarea
                            name="huongDan"
                            defaultValue={editingProduct.huongDan}
                            rows={4}
                            placeholder="Hướng dẫn cách sử dụng sản phẩm..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    
                    {/* TRƯỜNG MỚI: PRODUCT_INFO - NỘI DUNG VĂN BẢN LỚN */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            🔥 Thông tin sản phẩm chi tiết (Product Info - TEXT)
                        </label>
                        <textarea
                            name="product_info"
                            rows={8}
                            defaultValue={editingProduct.product_info || ''}
                            placeholder="Dán toàn bộ chi tiết sản phẩm vào đây (Giới thiệu, Thành phần, Công dụng, Cách dùng, Lưu ý...). Đây là trường dữ liệu quan trọng nhất cho AI/Search."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50/50"
                        />
                    </div>

                    {/* Thành phần (thanhPhan) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thành phần
                        </label>
                        <input
                            type="text"
                            name="thanhPhan"
                            defaultValue={editingProduct.thanhPhan}
                            placeholder="Nhập thành phần..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Đóng gói */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Đóng gói
                        </label>
                        <input
                            type="text"
                            name="dongGoi"
                            defaultValue={editingProduct.dongGoi}
                            placeholder="Nhập cách đóng gói"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Hạn sử dụng */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hạn sử dụng
                        </label>
                        <input
                            type="text"
                            name="hanSuDung"
                            defaultValue={editingProduct.hanSuDung}
                            placeholder="Nhập hạn sử dụng..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Link chi tiết */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Link chi tiết
                        </label>
                        <input
                            type="url"
                            name="linkChiTiet"
                            defaultValue={editingProduct.linkChiTiet}
                            placeholder="Nhập link chi tiết sản phẩm..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Link hướng dẫn */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Link hướng dẫn
                        </label>
                        <input
                            type="url"
                            name="usageGuideHref"
                            defaultValue={editingProduct.usageGuideHref}
                            placeholder="Nhập link hướng dẫn sử dụng..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Hình ảnh hướng dẫn */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hình ảnh hướng dẫn
                        </label>
                        <input
                            type="url"
                            name="usageGuideImage"
                            defaultValue={editingProduct.usageGuideImage}
                            placeholder="Nhập URL hình ảnh hướng dẫn..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Lượt xem */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lượt xem
                        </label>
                        <input
                            type="number"
                            name="view"
                            defaultValue={editingProduct.view || "0"}
                            min="0"
                            placeholder="Nhập số lượt xem..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Trạng thái embedding */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái embedding
                        </label>
                        <select
                            name="embedding_status"
                            defaultValue={editingProduct.embedding_status || "pending"}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="pending">Đang chờ</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="failed">Thất bại</option>
                        </select>
                    </div>

                </div>

                <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => {
                            setShowEditProductModal(false);
                            setEditingProduct(null);
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Cập nhật sản phẩm
                    </button>
                </div>
            </form>
        </div>
    </div>
)}

{/* Add Product Modal */}
{showAddProductModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">Thêm sản phẩm mới</h3>
        <button
          onClick={() => setShowAddProductModal(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const data = Object.fromEntries(formData.entries());
          handleAddProduct(data);
        }}
        className="p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tên sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên sản phẩm *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Nhập tên sản phẩm"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Số đăng ký */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số đăng ký *
            </label>
            <input
              type="text"
              name="soDangKy"
              required
              placeholder="Nhập số đăng ký"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Giá */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá *
            </label>
            <input
              type="number"
              name="price"
              required
              min="0"
              step="1000"
              placeholder="Nhập giá sản phẩm"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tồn kho */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tồn kho *
            </label>
            <input
              type="number"
              name="stock"
              required
              min="0"
              placeholder="Nhập số lượng tồn kho"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Danh mục chính */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục chính *
            </label>
            <select
              name="main_category"
              value={selectedMainCategory}
              onChange={(e) => setSelectedMainCategory(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn danh mục chính</option>
              {Object.entries(categoryMap).map(([key, category]) => (
                <option key={key} value={key}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Danh mục phụ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục phụ *
            </label>
            <select
              name="sub_category"
              required
              disabled={!selectedMainCategory}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Chọn danh mục phụ</option>
              {selectedMainCategory && (categoryMap as any)[selectedMainCategory]?.subCategories.map((subCat: any) => (
                <option key={subCat.value} value={subCat.value}>{subCat.name}</option>
              ))}
            </select>
          </div>

          {/* Công ty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Công ty
            </label>
            <input
              type="text"
              name="congTy"
              placeholder="Nhập tên công ty"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Công ty đăng ký */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Công ty đăng ký
            </label>
            <input
              type="text"
              name="congTyDangKy"
              placeholder="Nhập công ty đăng ký"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Công ty sản xuất */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Công ty sản xuất
            </label>
            <input
              type="text"
              name="congTySanXuat"
              placeholder="Nhập công ty sản xuất"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Dạng bao chế */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dạng bao chế
            </label>
            <input
              type="text"
              name="dangBaoChe"
              placeholder="Ví dụ: Viên nén, Capsule, Dung dịch..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Thương hiệu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thương hiệu
            </label>
            <input
              type="text"
              name="thuongHieu"
              placeholder="Nhập thương hiệu"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Quốc gia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quốc gia
            </label>
            <input
              type="text"
              name="quocGia"
              placeholder="Nhập quốc gia sản xuất"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Hạn sử dụng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hạn sử dụng
            </label>
            <input
              type="text"
              name="hanSuDung"
              placeholder="Nhập hạn sử dụng..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Đóng gói */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đóng gói
            </label>
            <input
              type="text"
              name="dongGoi"
              placeholder="Nhập cách đóng gói"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* URL hình ảnh */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL hình ảnh
            </label>
            <input
              type="url"
              name="imageUrl"
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Thành phần chính (Hoạt chất) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thành phần chính (Hoạt chất)
            </label>
            <textarea
              name="hoatChatChinh"
              rows={3}
              placeholder="Nhập thành phần chính, hoạt chất..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Thành phần */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thành phần
            </label>
            <input
              type="text"
              name="thanhPhan"
              placeholder="Nhập thành phần..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Mô tả sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả sản phẩm
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="Mô tả chi tiết về sản phẩm..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Hướng dẫn sử dụng */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hướng dẫn sử dụng
            </label>
            <textarea
              name="huongDan"
              rows={4}
              placeholder="Hướng dẫn cách sử dụng sản phẩm..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* TRƯỜNG MỚI: PRODUCT_INFO - NỘI DUNG VĂN BẢN LỚN */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔥 Thông tin sản phẩm chi tiết (Product Info - TEXT)
            </label>
            <textarea
              name="product_info"
              rows={8}
              placeholder="Dán toàn bộ chi tiết sản phẩm vào đây (Giới thiệu, Thành phần, Công dụng, Cách dùng, Lưu ý...). Đây là trường dữ liệu quan trọng nhất cho AI/Search."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50/50"
            />
          </div>
          
          {/* Link chi tiết */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link chi tiết
            </label>
            <input
              type="url"
              name="linkChiTiet"
              placeholder="Nhập link chi tiết sản phẩm..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Link hướng dẫn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link hướng dẫn
            </label>
            <input
              type="url"
              name="usageGuideHref"
              placeholder="Nhập link hướng dẫn sử dụng..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Hình ảnh hướng dẫn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh hướng dẫn
            </label>
            <input
              type="url"
              name="usageGuideImage"
              placeholder="Nhập URL hình ảnh hướng dẫn..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Lượt xem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lượt xem
            </label>
            <input
              type="number"
              name="view"
              min="0"
              defaultValue="0"
              placeholder="Nhập số lượt xem..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Trạng thái embedding */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái embedding
            </label>
            <select
              name="embedding_status"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending">Đang chờ</option>
              <option value="completed">Hoàn thành</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>
          
          {/* Paid - Không hiển thị vì không có input nào cho paid */}
          <input type="hidden" name="paid" defaultValue="0" />
        </div>
        
        {/* Footer buttons ( giữ nguyên ) */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setShowAddProductModal(false);
              setSelectedMainCategory('');
            }}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={productLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {productLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Đang thêm...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Thêm sản phẩm</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-6 w-6 text-green-200 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Thêm sản phẩm thành công!</h4>
              <p className="text-green-100 text-sm mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessNotification(false)}
              className="text-green-200 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Status Changes */}
      {showConfirmModal && selectedOrderForUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 rounded-full mb-4">
                <AlertTriangle className="h-8 w-8 text-blue-600" />
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Xác nhận thay đổi trạng thái
                </h3>
                <p className="text-gray-600 mb-6">
                  Bạn có chắc chắn muốn thay đổi trạng thái đơn hàng này không? 
                  Hành động này sẽ cập nhật trạng thái đơn hàng.
                </p>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">Trạng thái mới:</div>
                    <div className="text-blue-600 font-semibold mt-1">
                      {selectedOrderForUpdate.newStatus === 'pending' && 'Chờ xử lý'}
                      {selectedOrderForUpdate.newStatus === 'confirmed' && 'Đã xác nhận'}
                      {selectedOrderForUpdate.newStatus === 'processing' && 'Đang xử lý'}
                      {selectedOrderForUpdate.newStatus === 'shipped' && 'Đang giao'}
                      {selectedOrderForUpdate.newStatus === 'delivered' && 'Đã giao'}
                      {selectedOrderForUpdate.newStatus === 'received' && 'Đã nhận'}
                      {selectedOrderForUpdate.newStatus === 'cancelled' && 'Đã hủy'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedOrderForUpdate(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmStatusUpdate}
                  className="flex-1 px-4 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Xác nhận</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacistDashboard; 
// Simple modal to show order details
