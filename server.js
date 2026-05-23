const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const Mercury = require('@postlight/mercury-parser');
const { HfInference } = require('@huggingface/inference');
const connectionDb = require('./config/db');
const authMiddleware = require('./middlewares/authMiddleware');
const WebSocketManager = require('./services/websocketManager');

// --- CONFIG ---
dotenv.config({ path: './.env' });

// --- CONNECT DB ---
connectionDb();

const app = express();
const server = http.createServer(app);

// --- CORS (dev + deploy) ---
app.use(cors({
  origin: [
    'https://health-care-app-frontend-rs2d.onrender.com',
    process.env.FRONTEND_URL // Cho phép frontend URL khi deploy
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

// --- AUTO MOUNT ROUTES ---
function safeMount(urlPath, routePath) {
  try {
    const router = require(routePath);
    app.use(urlPath, router);
    console.log(`✅ Mounted: ${routePath} → ${urlPath}`);
  } catch (err) {
    console.error(`❌ Error mounting ${routePath}:`, err);
  }
}

safeMount('/api/v1/products', './routes/productRoutes');
safeMount('/api/v1/appointments', './routes/appointmentRoutes');
safeMount('/api/v1/auth', './routes/authRoutes');
safeMount('/api/v1/user', './routes/userRoutes');
safeMount('/api/v1/orders', './routes/orderRoutes');
safeMount('/api/v1/notifications', './routes/notificationRoutes');
safeMount('/api/v1/health-news', './routes/healthNewsRoutes');
safeMount('/api/v1/chat', './routes/chatRoutes');
safeMount('/api/v1/stock', './routes/stockRoutes');
safeMount('/api/v1/ai-chat', './routes/aiChatRoutes');

// --- ARTICLE FETCH ---
app.get('/api/v1/fetch-article', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'Missing URL' });

    const result = await Mercury.parse(url);
    res.json({
      title: result.title,
      content: result.content,
      author: result.author,
      date: result.date_published,
      lead_image: result.lead_image_url,
    });
  } catch (err) {
    console.error('Mercury error:', err);
    res.status(500).json({ error: 'Failed to parse article' });
  }
});


// --- WEBSOCKET INIT ---
const webSocketManager = new WebSocketManager(server);
global.webSocketManager = webSocketManager;

// --- SERVE FRONTEND BUILD (for Docker/Render) ---
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// --- START SERVER ---
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server + WebSocket running on port ${PORT}`);
});
