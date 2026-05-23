const mongoose = require("mongoose");

const resetTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },       // mã OTP
  expire: { type: Date, required: true },       // thời gian hết hạn
});

module.exports = mongoose.model("ResetToken", resetTokenSchema);
