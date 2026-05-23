const mongoose = require('mongoose');
require('./productModel');
require('./userModel');
require('./stockEntryModel');
require('./userModel');
require('./stockEntryModel');
// Item trong đơn hàng
const orderItemSchema = new mongoose.Schema({
  stockEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockEntry',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
  prescription: { type: Boolean, default: false }
}, { _id: false });

// Schema chính của Order
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: {
    type: [orderItemSchema],
    validate: v => Array.isArray(v) && v.length > 0
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'momo', 'zalopay', 'shopeepay', 'banking'],
  },
  paymentStatus: { 
    type: String, 
    required: true, 
    enum: ['pending', 'paid', 'failed'], 
    default: 'pending' 
  },
  orderStatus: { 
    type: String, 
    required: true, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  subtotal: { 
    type: Number, 
    required: true 
  },
  shippingCost: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  totalAmount: { 
    type: Number, 
    required: true 
  },
  notes: { 
    type: String, 
    default: '' 
  },
  prescriptionImages: [
    { type: String }
  ],
  trackingNumber: { 
    type: String, 
    default: '' 
  },
  shippingDistanceKm: { 
    type: Number, 
    default: null 
  },
  shippingCoords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  estimatedDelivery: { 
    type: Date 
  }
  // ...các trường khác của orderSchema...
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);