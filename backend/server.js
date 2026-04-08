// ====================== AGRI CONNECT X - SERVER.JS (FINAL FIXED VERSION) ======================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');
const messageRoutes = require('./routes/messages');
const resourceRoutes = require('./routes/resources');
const analyticsRoutes = require('./routes/analytics');
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const wishListRoutes = require("./routes/wishlist");
const reviewRoutes = require("./routes/review");
const notificationRoutes = require("./routes/notification");

const app = express();
const http = require('http');
const { Server } = require('socket.io');
const serverApp = http.createServer(app);

/* ---------- Middleware ---------- */
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  hsts: false   // Disable HSTS for localhost
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());

// Body parsers - MUST come BEFORE CORS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ====================== CORS SETUP (SAFE VERSION) ======================
const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5501",
    process.env.FRONTEND_URL,
    "https://agri-connect-x.vercel.app"
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("CORS blocked origin:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200
};

// Apply CORS
app.use(cors(corsOptions));

// Safe preflight handler (this avoids the * wildcard error)
// app.options('*', (req, res) => {
//     res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     res.setHeader('Access-Control-Allow-Credentials', 'true');
//     res.status(204).end();
// });

console.log("✅ CORS configured successfully");

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);

// Serve static files
const path = require('path');
app.use(express.static(path.join(__dirname, "component")));

/* ---------- Routes ---------- */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/wishlist", wishListRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/notification", notificationRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'AgriConnectX Cameroon API is running!' });
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

/* ---------- Error Handler ---------- */
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error',
    });
});

/* ---------- Socket.io ---------- */
const io = new Server(serverApp, {
    cors: { origin: allowedOrigins, credentials: true }
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

/* ---------- Database Connection ---------- */
const PORT = process.env.PORT || 5500;
const MONGODB_URI = process.env.MONGODB_URI;

const mongooseOptions = {
    autoIndex: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
};

async function connectWithRetry(retries = 5, delayMs = 2000) {
    try {
        await mongoose.connect(MONGODB_URI, mongooseOptions);
        console.log('✅ Connected to MongoDB');

        serverApp.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        if (retries > 0) {
            console.log(`Retrying in ${delayMs}ms... (${retries} left)`);
            setTimeout(() => connectWithRetry(retries - 1, delayMs * 1.5), delayMs);
        } else {
            console.error('❌ Could not connect to MongoDB. Exiting.');
            process.exit(1);
        }
    }
}

connectWithRetry();

/* ---------- Graceful Shutdown ---------- */
function gracefulShutdown(signal) {
    console.log(`\nReceived ${signal}. Shutting down...`);
    if (serverApp) serverApp.close(() => {
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed.');
            process.exit(0);
        });
    });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = app;