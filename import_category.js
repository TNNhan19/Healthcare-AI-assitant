const fs = require('fs');
const path = require('path');

// Đổi tên file JSON tại đây
const FILES = [
  'lamdep_giamcan.json',
  // Thêm các file khác nếu muốn
];

// Đặt tên category mặc định tại đây
const DEFAULT_MAIN_CATEGORY = 'Thực phẩm chức năng';
const DEFAULT_SUB_CATEGORY = 'Làm đẹp, giảm cân';

FILES.forEach(filename => {
  const filePath = path.join(__dirname, filename);
  let products = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Nếu file là 1 object, chuyển thành mảng
  if (!Array.isArray(products)) products = [products];

  let changed = false;

  products.forEach(product => {
    // Thêm hoặc sửa main_category
    if (!product.main_category || typeof product.main_category !== 'string' || !product.main_category.trim()) {
      product.main_category = DEFAULT_MAIN_CATEGORY;
      changed = true;
    }
    // Thêm hoặc sửa sub_category
    if (!product.sub_category || typeof product.sub_category !== 'string' || !product.sub_category.trim()) {
      product.sub_category = DEFAULT_SUB_CATEGORY;
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf8');
    console.log(`Đã cập nhật category cho file: ${filename}`);
  } else {
    console.log(`Không cần cập nhật file: ${filename}`);
  }
});