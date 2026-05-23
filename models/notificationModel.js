const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipientUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  recipientRole: { type: String, default: null }, // e.g., 'pharmacist'
  type: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
