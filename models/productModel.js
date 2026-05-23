const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Tên sản phẩm
  soDangKy: { type: String, required: true, unique: true }, // Số đăng ký
  thanhPhan: { type: String }, // Thành phần
  congTy: { type: String }, // Công ty (thương hiệu)
  quocGia: { type: String }, // Quốc gia
  linkChiTiet: { type: String }, // Link chi tiết
  imageUrl: { type: String }, // Link ảnh
  dangBaoChe: { type: String }, // Dạng bào chế
  dongGoi: { type: String }, // Đóng gói
  hanSuDung: { type: String }, // Hạn sử dụng
  congTySx: { type: String }, // Công ty sản xuất
  congTyDk: { type: String }, // Công ty đăng ký
  huongDan: { type: String }, // Hướng dẫn sử dụng
  price: { type: Number }, // Giá
  stock: { type: Number, default: 0 }, // Tồn kho
  description: { type: String }, // Mô tả
  details: { type: mongoose.Schema.Types.Mixed }, // hoặc type: Object
  usageGuideHref: { type: String },
  usageGuideImage: { type: String },
  product_info: { type: mongoose.Schema.Types.Mixed }, // nếu cần
  brand: { type: String }, // nếu muốn tách riêng thương hiệu
  main_category: { type: String }, // Danh mục lớn
  sub_category: { type: String }, // Danh mục nhỏ
  view: { type: Number, default: 0 }, // Số lượt xem
  paid: { type: Number, default: 0 } // Số lượt mua
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);