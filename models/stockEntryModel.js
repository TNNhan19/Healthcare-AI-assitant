const mongoose = require('mongoose');

const stockEntrySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  batchNumber: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    required: false, // Cho phép null cho batch mặc định
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  location: {
    type: String,
    default: 'Kho mặc định' // vị trí kho mặc định
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.StockEntry || mongoose.model('StockEntry', stockEntrySchema);