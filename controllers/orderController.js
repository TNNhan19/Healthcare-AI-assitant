const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const StockEntry = require('../models/stockEntryModel');
const Product = require('../models/productModel');
// Cancel order
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const user = req.user;
    const order = await Order.findById(id).session(session);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }
    if (user.userType === 'client'){
      if (order.user.toString() !== user._id.toString()) {
        throw new Error('Bạn không có quyền huỷ đơn hàng này');
      }
      if (order.orderStatus !== 'pending') {
        throw new Error('Bạn chỉ có thể huỷ đơn khi trạng thái còn pending');
      }
    }
    if (['cancelled', 'shipped', 'delivered'].includes(order.orderStatus)) {
      throw new Error(`Không thể huỷ đơn hàng ở trạng thái: ${order.orderStatus}`);
    }

    // Lưu trữ các sản phẩm cần cập nhật lượt paid
    const productIdsToUpdate = [];
    const productQuantities = {};

    // Hoàn lại tồn kho và ghi nhận sản phẩm cần cập nhật
    for (const item of order.items) {
      const stock = await StockEntry.findById(item.stockEntryId).session(session);
      if (stock) {
        stock.quantity += item.quantity;
        await stock.save({ session });
      }
      
      // Ghi nhận sản phẩm để cập nhật paid (với TẤT CẢ đơn hàng)
      const productId = item.productId.toString();
      if (!productQuantities[productId]) {
        productQuantities[productId] = 0;
        productIdsToUpdate.push(productId);
      }
      productQuantities[productId] += item.quantity;
    }
    
    // Cập nhật trạng thái đơn hàng
    order.orderStatus = 'cancelled';
    await order.save({ session });
    
    // Commit transaction trước khi thực hiện các thao tác không liên quan đến transaction
    await session.commitTransaction();
    session.endSession();
    
    // Cập nhật số lượt mua (paid) cho tất cả đơn hàng
    // Giảm số lượt paid cho mỗi sản phẩm trong đơn hàng
    for (const productId of productIdsToUpdate) {
      try {
        const product = await Product.findById(productId);
        if (product) {
          product.paid = Math.max(0, (product.paid || 0) - productQuantities[productId]);
          await product.save();
          console.log(`Đã giảm lượt mua cho sản phẩm ${productId} còn ${product.paid}`);
        }
      } catch (updateError) {
        console.error(`Lỗi khi cập nhật lượt paid cho sản phẩm ${productId}:`, updateError);
      }
    }
    
    res.json({ success: true, message: 'Đã huỷ đơn hàng và hoàn lại tồn kho', data: order });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};
// Reorder an existing order
const reorder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const originalOrder = await Order.findOne({ _id: orderId, user: userId });
    if (!originalOrder) {
      return res.status(404).json({ success: false, message: 'Original order not found' });
    }
    const newOrder = new Order({
      user: userId,
      items: originalOrder.items,
      shippingAddress: originalOrder.shippingAddress,
      paymentMethod: originalOrder.paymentMethod,
      notes: `Reorder of #${originalOrder._id}`,
      subtotal: originalOrder.subtotal,
      shippingCost: originalOrder.shippingCost,
      totalAmount: originalOrder.totalAmount,
    });
    await newOrder.save();
    res.status(201).json({ success: true, message: 'Reorder successful', data: newOrder });
  } catch (error) {
    console.error('Error reordering:', error);
    res.status(500).json({ success: false, message: 'Error creating reorder', error: error.message });
  }
};
// List all orders (admin/pharmacist)
const listAllOrders = async (req, res) => {
  try {
    console.log('🔍 listAllOrders called with query:', req.query);
    console.log('👤 User info:', req.user ? { id: req.user._id, userType: req.user.userType } : 'No user');
    
    const { page = 1, limit = 100, status, user, paymentStatus, q } = req.query;
    const query = {};
    
    // Status filter
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (user) query.user = user;
    
    console.log('🔍 MongoDB query:', query);
    console.log('📄 Pagination params:', { page: parseInt(page), limit: parseInt(limit) });
    
    let orders;
    let total;
    
    if (q && q.trim()) {
      // If searching, load all orders and filter in JavaScript
      const searchTerm = q.trim();
      console.log('🔍 Using JavaScript search for term:', searchTerm);
      
      // Get all orders with basic filters
      const allOrders = await Order.find(query)
        .populate('user', 'userName email')
        .sort({ createdAt: -1 });
      
      console.log(`📊 Total orders before search: ${allOrders.length}`);
      
      // Filter orders in JavaScript
      const filteredOrders = allOrders.filter(order => {
        const orderIdStr = order._id.toString();
        const last6Chars = orderIdStr.slice(-6).toUpperCase();
        
        let searchPattern = searchTerm.replace(/^#/, '').toUpperCase();
        
        console.log(`🔍 Comparing: ${last6Chars} with ${searchPattern}`);
        
        // Check if search term matches:
        // 1. Order number
        if (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) {
          console.log('✅ Match: orderNumber');
          return true;
        }
        
        // 2. User name
        if (order.user?.userName && order.user.userName.toLowerCase().includes(searchTerm.toLowerCase())) {
          console.log('✅ Match: userName');
          return true;
        }
        
        // 3. User email  
        if (order.user?.email && order.user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
          console.log('✅ Match: email');
          return true;
        }
        
        // 4. Last 6 characters of ObjectId (like #1B1CE9)
        if (last6Chars.includes(searchPattern)) {
          console.log('✅ Match: ObjectId last 6 chars');
          return true;
        }
        
        return false;
      });
      
      console.log(`📊 Filtered orders: ${filteredOrders.length}`);
      
      // Apply pagination to filtered results
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      orders = filteredOrders.slice(startIndex, endIndex);
      total = filteredOrders.length;
      
    } else {
      // Regular query without search
      orders = await Order.find(query)
          .populate('user', 'userName email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
        
      total = await Order.countDocuments(query);
    }
    
    console.log('📊 Found orders:', orders.length);
    console.log('📊 Total count:', total);
    
    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error listing orders:', error);
    return res.status(500).json({ success: false, message: 'Error listing orders', error: error.message });
  }
};
// Get order statistics (admin only)
const getOrderStatistics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const completedOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    
    // Tính doanh thu từ các đơn hàng đã giao (delivered) thay vì chỉ tính theo paymentStatus
    const totalRevenue = await Order.aggregate([
      { $match: { orderStatus: 'delivered' } }, // Thay đổi từ paymentStatus: 'paid' thành orderStatus: 'delivered'
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    // Thống kê theo cả hai tiêu chí để so sánh
    const revenueByPayment = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const monthlyOrders = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    console.log('=== REVENUE CALCULATION DEBUG ===');
    console.log('Total orders:', totalOrders);
    console.log('Completed orders (delivered):', completedOrders);
    console.log('Revenue from delivered orders:', totalRevenue[0]?.total || 0);
    console.log('Revenue from paid orders:', revenueByPayment[0]?.total || 0);
    console.log('================================');
    
    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        revenueByPayment: revenueByPayment[0]?.total || 0, // Thêm field này để debug
        monthlyOrders
      }
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ success: false, message: 'Error fetching order statistics', error: error.message });
  }
};
// Update order details (user can edit before processing)
const updateOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { shippingAddress, notes, paymentMethod, shippingCoords } = req.body;
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (['processing', 'shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Order cannot be edited at this stage' });
    }
    if (shippingAddress && typeof shippingAddress === 'object') {
      order.shippingAddress = { ...order.shippingAddress.toObject?.() ?? order.shippingAddress, ...shippingAddress };
    }
    if (typeof notes === 'string') {
      order.notes = notes;
    }
    if (paymentMethod) {
      order.paymentMethod = paymentMethod;
      order.paymentStatus = paymentMethod === 'cash' ? 'pending' : 'paid';
    }
    if (shippingCoords && typeof shippingCoords.lat === 'number' && typeof shippingCoords.lng === 'number') {
      const coords = { lat: shippingCoords.lat, lng: shippingCoords.lng };
      const distanceKm = haversineDistance(coords, STORE_COORDS);
      const shippingCost = computeShippingCost(distanceKm, order.subtotal);
      order.shippingCoords = coords;
      order.shippingDistanceKm = distanceKm;
      order.shippingCost = shippingCost;
      order.totalAmount = order.subtotal + shippingCost;
      let estimatedDelivery = new Date();
      if (distanceKm <= 5) {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
      } else if (distanceKm <= 20) {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);
      } else {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
      }
      order.estimatedDelivery = estimatedDelivery;
    }
    await order.save();
    return res.status(200).json({ success: true, message: 'Order updated successfully', data: order });
  } catch (error) {
    console.error('Error updating order:', error);
    return res.status(500).json({ success: false, message: 'Error updating order', error: error.message });
  }
};
const createOrder = async (req, res) => {
    try {
      const { items, shippingAddress, paymentMethod, notes, prescriptionImages } = req.body;
      const userId = req.user.id;
      console.log("Decoded user:", req.user);
  
      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: "Order must contain at least one item" });
      }
  
      const orderItems = [];
  
      // 🔑 FEFO: phân bổ theo hạn dùng
      for (const item of items) {
        let qtyNeeded = item.quantity;
  
        const stockEntries = await StockEntry.find({
          productId: item.productId,
          quantity: { $gt: 0 }
        }).sort({ expiryDate: 1, createdAt: 1 }); // Ưu tiên lô hết hạn sớm nhất
  
        if (!stockEntries.length) {
          return res.status(400).json({
            success: false,
            message: `Out of stock for product ${item.productId}`
          });
        }
  
        for (const stock of stockEntries) {
          if (qtyNeeded <= 0) break;
  
          const allocatedQty = Math.min(stock.quantity, qtyNeeded);
  
          orderItems.push({
            stockEntryId: stock._id,
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: allocatedQty,
            image: item.image || "",
            prescription: item.prescription || false
          });
  
          // Trừ tồn kho
          stock.quantity -= allocatedQty;
          await stock.save();
  
          qtyNeeded -= allocatedQty;
        }
  
        if (qtyNeeded > 0) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for product ${item.productId}`
          });
        }
      }
  
      // Tính tổng tiền
      const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  
      let shippingCost = 30000;
      let distanceKm = null;
      let coords = null;
  
      try {
        const shippingCoords = req.body.shippingCoords;
        if (shippingCoords?.lat && shippingCoords?.lng) {
          coords = { lat: shippingCoords.lat, lng: shippingCoords.lng };
          distanceKm = haversineDistance(coords, STORE_COORDS);
          shippingCost = computeShippingCost(distanceKm, subtotal);
        } else {
          shippingCost = subtotal >= 500000 ? 0 : 30000;
        }
      } catch (e) {
        shippingCost = subtotal >= 500000 ? 0 : 30000;
      }
  
      const totalAmount = subtotal + shippingCost;
  
      // Ước tính giao hàng
      let estimatedDelivery = new Date();
      if (distanceKm === null || distanceKm <= 5) {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
      } else if (distanceKm <= 20) {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);
      } else {
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
      }
  
      const paymentStatus = paymentMethod === "cash" ? "pending" : "paid";
      const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  
      const order = new Order({
        orderNumber,
        user: userId,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        paymentStatus,
        notes,
        orderStatus: 'pending',
        prescriptionImages: prescriptionImages || [],
        subtotal,
        shippingCost,
        totalAmount,
        shippingDistanceKm: distanceKm,
        shippingCoords: coords || { lat: null, lng: null },
        estimatedDelivery
    });
  
      await order.save();

      // Cập nhật thuộc tính paid cho TẤT CẢ đơn hàng, bất kể phương thức thanh toán
      // Cập nhật thuộc tính paid cho mỗi sản phẩm trong đơn hàng
      const productUpdatePromises = [];
      const productQuantities = {}; // Lưu tổng số lượng mỗi sản phẩm

      // Tổng hợp số lượng từng sản phẩm trong đơn hàng
      for (const item of orderItems) {
        const productId = item.productId.toString();
        if (!productQuantities[productId]) {
          productQuantities[productId] = 0;
        }
        productQuantities[productId] += item.quantity;
      }

      // Tạo các promise để cập nhật số lượt mua cho từng sản phẩm
      for (const [productId, quantity] of Object.entries(productQuantities)) {
        productUpdatePromises.push(updateProductPaidCount(productId, quantity));
      }

      // Chạy các promise cập nhật song song để tối ưu hiệu suất
      await Promise.all(productUpdatePromises);
  
      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order
      });
  
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ success: false, message: "Error creating order", error: error.message });
    }
  };
// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus, trackingNumber, estimatedDelivery } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.orderStatus;
    const previousPaymentStatus = order.paymentStatus;

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    
    await order.save();

    // Kiểm tra nếu đơn hàng chuyển từ pending/cancelled sang delivered/shipped
    // Hoặc paymentStatus chuyển từ pending sang paid
    const statusChangedToCompleted = 
      (previousStatus === 'pending' || previousStatus === 'cancelled') && 
      (order.orderStatus === 'delivered' || order.orderStatus === 'shipped');
    
    const paymentChanged = previousPaymentStatus === 'pending' && order.paymentStatus === 'paid';
    
    // Cập nhật thuộc tính paid bất kể trạng thái thanh toán
    if (statusChangedToCompleted || paymentChanged) {
      const productQuantities = {};
      
      // Tổng hợp số lượng sản phẩm trong đơn hàng
      for (const item of order.items) {
        const productId = item.productId.toString();
        if (!productQuantities[productId]) {
          productQuantities[productId] = 0;
        }
        productQuantities[productId] += item.quantity;
      }
      
      // Cập nhật số lượt mua cho từng sản phẩm
      const updatePromises = [];
      for (const [productId, quantity] of Object.entries(productQuantities)) {
        updatePromises.push(updateProductPaidCount(productId, quantity));
      }
      
      await Promise.all(updatePromises);
    }
    
    res.status(200).json({ success: true, message: 'Order status updated successfully', data: order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Error updating order status', error: error.message });
  }
};
// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const order = await Order.findOne({ _id: orderId, user: userId }).populate('user', 'userName email');;
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Error fetching order', error: error.message });
  }
};
// Get user's order history
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: userId };
    if (status) query.orderStatus = status;
    const orders = await Order.find(query)
        .populate('user', 'userName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Order.countDocuments(query);
    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
  }
};

// Get user statistics (orders count and total spending)
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Getting stats for user:', userId);
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }
    
    // Find all orders for this user
    const allOrders = await Order.find({ 
      user: userId 
    }).populate('user', 'userName email');
    
    console.log(`Found ${allOrders.length} total orders for user ${userId}`);
    
    // Filter orders (exclude cancelled)
    const validOrders = allOrders.filter(order => order.orderStatus !== 'cancelled');
    
    // Calculate total spent (only from delivered orders)
    const deliveredOrders = allOrders.filter(order => order.orderStatus === 'delivered');
    const totalSpent = deliveredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    const stats = {
      totalOrders: validOrders.length,
      totalSpent: totalSpent
    };
    
    console.log(`User ${userId} stats:`, stats);
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thống kê người dùng', 
      error: error.message 
    });
  }
};
module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderDetails,
  getOrderStatistics,
  listAllOrders,
  reorder,
  cancelOrder,
  getUserStats,
};

// Store coordinates (123 Nguyễn Huệ, Quận 1, TP.HCM - approx)
const STORE_COORDS = { lat: 10.775658, lng: 106.700424 };

function toRad(deg) { return (deg * Math.PI) / 180; }

function haversineDistance(a, b) {
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sa = Math.sin(dLat / 2);
  const sb = Math.sin(dLng / 2);
  const h = sa * sa + Math.cos(lat1) * Math.cos(lat2) * sb * sb;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c; // distance in km
}

function computeShippingCost(distanceKm, subtotal) {
  // Free shipping threshold
  if (subtotal >= 500000) return 0;
  if (distanceKm <= 5) return 15000;
  if (distanceKm <= 10) return 25000;
  if (distanceKm <= 20) return 40000;
  return 60000;
}

// Helper function to update product paid count
async function updateProductPaidCount(productId, quantityPaid) {
  try {
    // Tìm sản phẩm theo ID
    const product = await Product.findById(productId);
    if (!product) {
      console.error(`Không tìm thấy sản phẩm với ID: ${productId}`);
      return;
    }
    
    // Tăng số lượt paid lên theo số lượng mua
    product.paid = (product.paid || 0) + quantityPaid;
    
    // Đảm bảo paid không bao giờ âm
    if (product.paid < 0) product.paid = 0;
    
    // Lưu lại vào database
    await product.save();
    console.log(`Đã cập nhật lượt mua cho sản phẩm ${productId}: ${product.paid}`);
  } catch (error) {
    console.error(`Lỗi khi cập nhật lượt mua cho sản phẩm ${productId}:`, error);
  }
}

// ...existing code...
// Đã có khai báo createOrder ở đầu file, không cần khai báo lại ở cuối file
