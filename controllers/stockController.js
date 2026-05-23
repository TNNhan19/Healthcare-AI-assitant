const StockEntry = require('../models/stockEntryModel');

// GET /api/v1/stock?productId=...
exports.getStockEntries = async (req, res) => {
  try {
    const filter = {};
    if (req.query.productId) {
      filter.productId = req.query.productId;
    }
    const stockEntries = await StockEntry.find(filter).populate('productId', 'name price');
    res.json({ success: true, data: stockEntries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy tồn kho', error: err.message });
  }
};

// POST /api/v1/stock
exports.createStockEntry = async (req, res) => {
  try {
    const stockEntry = new StockEntry(req.body);
    await stockEntry.save();
    res.status(201).json(stockEntry);
  } catch (err) {
    res.status(400).json({ success: false, message: 'Lỗi khi tạo tồn kho', error: err.message });
  }
};

// PUT /api/v1/stock/:id
exports.updateStockEntry = async (req, res) => {
  try {
    const stockEntry = await StockEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!stockEntry) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tồn kho' });
    }
    res.json(stockEntry);
  } catch (err) {
    res.status(400).json({ success: false, message: 'Lỗi khi cập nhật tồn kho', error: err.message });
  }
};