const mongoose = require('mongoose');

const productCardSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
});

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderEmail: { type: String },
    messageType: { type: String, enum: ['text', 'product'], default: 'text' },
    message: { type: String }, // For text messages
    productCard: productCardSchema, // For product card messages
    timestamp: { type: Date, default: Date.now },
    attachments: [{
        type: { type: String },
        url: { type: String },
        name: { type: String },
    }],
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' }
});

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [messageSchema],
    lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Index participants for faster queries
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
