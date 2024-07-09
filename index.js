// import express from 'express';
const express = require('express');
const http = require('http');
// import http from 'http';
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const logger = require('./src/utils/logger.js');
const morganMiddleware = require('./src/middleware/morgan.js');

const { wss } = require('./src/utils/status.js');

const userAuthRoutes = require('./src/routes/v1/user/auth.js');
const adminAuthRoutes = require('./src/routes/v1/admin/auth.js');
const adminRoutes = require('./src/routes/v1/admin/plan.js');
const userRoutes = require('./src/routes/v1/user/plan.js');

// import cors from 'cors';
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import helmet from 'helmet';
// import bodyParser from 'body-parser';
// import logger from './src/utils/logger.js';
// import morganMiddleware from './src/middleware/morgan.js';

// import wss from './src/utils/status.js';
// import expressWs from 'express-ws';

// import userAuthRoutes from './src/routes/v1/user/auth.js';
// import adminAuthRoutes from './src/routes/v1/admin/auth.js';
// import adminRoutes from './src/routes/v1/admin/plan.js';
// import userRoutes from './src/routes/v1/user/plan.js';

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    // console.log('Connected to MongoDB');
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    // console.log(`Error connecting to MongoDB: ${err}`);
    logger.error(`Error connecting to MongoDB: ${err}`);
  });

const app = express();

const server = http.createServer(app);

app.use(bodyParser.json());
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morganMiddleware);
const corsOptions = {
  origin: ['http://localhost:5000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Access-Control-Allow-Credentials',
  ],
};

app.use(cors(corsOptions));
app.use('/api/v1/auth', userAuthRoutes);
app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/user', userRoutes);
// app.on('upgrade', (request, socket, head) => {
//   wss.handleUpgrade(request, socket, head, (ws) => {
//     wss.emit('connection', ws, request);
//   });
// });
// app.listen(process.env.PORT, () => {
//   logger.info(`Server is running on port ${process.env.PORT}`);
// });
// Integrate WebSocket server with the HTTP server
// wss.on('upgrade', (request, socket, head) => {
//   wss.handleUpgrade(request, socket, head, (ws) => {
//     wss.emit('connection', ws, request);
//   });
// });
// wss.on('error', (error) => {
//   logger.error('WebSocket server error:', error);
//   // Implement appropriate error handling
// });

server.listen(process.env.PORT, () => {
  logger.info(`Server is running on port ${process.env.PORT}`);
});
