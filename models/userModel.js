const mongoose=require('mongoose');
const addressSchema = require('./addressModel');
const userSchema = new mongoose.Schema({
    userName:{
        type:String,
        required:[true, 'User name is required'],
    },
    nickname: {
        type: String,
        default: ''
    },
    email:{
        type:String,
        required:[true, 'Email is required'],
        unique:true,
        match:[/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/,'Please fill a valid email address']
    },
    password:{
        type:String,
        minlength:6
    },
    dob: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', ''],
        default: ''
    },
    address: [mongoose.Schema.Types.Mixed], 
    defaultAddress: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        match: [/^0\d{9}$/, 'Số điện thoại không hợp lệ'], // ✅ đúng cú pháp
      },
    paymentMethods: [{
        type: String,
        enum: ['cash', 'credit_card', 'momo', 'zalopay', 'shopeepay', 'banking', 'other'],
        default: 'cash'
    }],
    userType:{
        type:String,
        enum:['client', 'admin','pharmacist'],
        required:[true, 'User type is required'],
        default:'client'
    },
    huggingFaceToken: {
        type: String,
        trim: true,
    },
    profile:{
        type:String,
        default:'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-image-182145777.jpg'
    },
    answer:{
        type:String,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    facebookId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    }
    ,
    // Store web-push subscriptions (Push API) and optional FCM tokens
    pushSubscriptions: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    }
},{timestamps:true}
);
module.exports= mongoose.model('User',userSchema);
