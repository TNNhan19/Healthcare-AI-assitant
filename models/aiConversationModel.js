const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema({
    from: {
        type: String,
        required: true,
        enum: ['user', 'ai']
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const aiConversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        default: 'New Conversation'
    },
    messages: [aiMessageSchema]
}, { timestamps: true });

// Add index for faster querying of user's conversations
aiConversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);
