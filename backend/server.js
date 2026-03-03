// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const {validationResult} = require('express-validator');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions')
const messageRoutes = require('./routes/messages');
const resourceRoutes = require('./routes/resources');
const analyticsRoutes = require('./routes/analytics');

const app = express();

const http = require('http');
const { Server } = require('socket.io');
const serverApp = http.createServer(app);

/* ---------- Middleware ---------- */
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
app.use((req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
});

// CORS: restrict in production by setting FRONTEND_URL in .env
const corsOptions = {
  origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
  credentials: true,
};
app.use(cors(corsOptions));

const path = require('path');

// Serve static files from Agri/component
app.use(express.static(path.join(__dirname, "component")));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ---------- Routes ---------- */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'AgriConnectX Cameroon API is running!' });
});

// simple health check for load balancers
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));





/* ---------- Error handler ---------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});


// server.js


const io = new Server(serverApp, { cors: { origin: process.env.FRONTEND_URL || '*' }});

// attach io to express app so controllers can access it
app.set('io', io);

// socket auth middleware example (replace verifyToken with your JWT verify)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    // verifyToken should return user object { id, role, ... }
    const user = await verifyToken(token); // implement verifyToken using your auth logic
    socket.user = user;
    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user && socket.user.id;
  if (userId) {
    // personal room for push notifications
    socket.join(`user:${userId}`);
  }

  // client can join conversation rooms
  socket.on('joinConversation', (conversationId) => {
    if (conversationId) socket.join(conversationId);
  });

  socket.on('leaveConversation', (conversationId) => {
    if (conversationId) socket.leave(conversationId);
  });

  socket.on('disconnect', () => {
    // handle presence cleanup if needed
  });
});

// Fallback for SPA routes (optional)
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "component/index.html"));
// });


/* ---------- DB connection with retry/backoff ---------- */
const PORT = process.env.PORT || 5500;
const MONGODB_URI = process.env.MONGODB_URI;

const mongooseOptions = {
  autoIndex: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
};

let server;
async function connectWithRetry(retries = 5, delayMs = 2000) {
  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('✅ Connected to MongoDB');
    server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    if (retries > 0) {
      console.log(`Retrying to connect in ${delayMs}ms (${retries} attempts left)`);
      setTimeout(() => connectWithRetry(retries - 1, delayMs * 1.5), delayMs);
    } else {
      console.error('❌ Could not connect to MongoDB after retries. Exiting.');
      process.exit(1);
    }
  }
}
connectWithRetry();

/* ---------- Graceful shutdown ---------- */
function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Closing server and MongoDB connection...`);
  if (server) server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = app;