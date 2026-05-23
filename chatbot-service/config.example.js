// Chatbot Service Configuration Example
// Copy this file to .env and update the values

module.exports = {
    // Service Ports
    CHATBOT_SERVICE_PORT: 3001,
    CHATBOT_PY_PORT: 8003,
    PYTHON_API_URL: 'http://127.0.0.1:8003/api-chat',
    
    // Hugging Face Configuration
    HUGGINGFACE_API_KEY: 'your_huggingface_token_here',
    HUGGINGFACE_TOKEN: 'your_huggingface_token_here',
    
    // JWT Configuration
    JWT_SECRET: 'your_jwt_secret_here',
    JWT_REFRESH_SECRET: 'your_jwt_refresh_secret_here',
    
    // Database Configuration
    MONGODB_URI: 'mongodb://localhost:27017/healthcare_chatbot',
    
    // CORS Configuration
    ALLOWED_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173'
};
