const mongoose = require('mongoose');

// Schema cho bài viết tin tức
const healthNewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    content: {
      type: String
    },
    urlToImage: {
      type: String
    },
    source: {
      id: String,
      name: String
    },
    author: String,
    publishedAt: {
      type: Date,
      default: Date.now
    },
    url: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: 'General'
    },
    slug: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isCustom: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Tạo index cho tìm kiếm nhanh
healthNewsSchema.index({ title: 'text', description: 'text', content: 'text' });

// Tạo slug từ tiêu đề trước khi lưu
healthNewsSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\sÀ-ỹ]/g, '')
      .replace(/\s+/g, '-');
  }
  next();
});

module.exports = mongoose.model('HealthNews', healthNewsSchema);