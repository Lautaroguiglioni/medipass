'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const ipfsRoutes = require('./routes/ipfs');
const prescriptionRoutes = require('./routes/prescriptions');
const rolesRoutes = require('./routes/roles');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security & Parsing Middleware ─────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests, please try again later.',
  },
});

app.use(limiter);

// ─── Health Check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'medipass-backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    monadRpc: process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
    chainId: 10143,
  });
});

// ─── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/roles', rolesRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏥  MediPass Backend running on port ${PORT}`);
  console.log(`🔗  Monad RPC: ${process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'}`);
  console.log(`⛓️   Chain ID: 10143`);
  console.log(`🌐  CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📡  Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
