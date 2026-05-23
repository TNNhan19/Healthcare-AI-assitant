const mongoose=require('mongoose');
const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  ward: { type: String, required: true },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null }
}, { _id: true }); // _i
module.exports = addressSchema;