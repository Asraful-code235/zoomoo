const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const { router: authRoutes } = require('./routes/auth');
const streamRoutes = require('./routes/streams');
const userRoutes = require('./routes/users');
const marketRoutes = require('./routes/markets');

app.get('/', (req, res) => {
  res.json({ 
    message: 'Zoomies API - Live Hamster Prediction Markets 🐹💰',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/markets', marketRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Zoomies backend running on port ${PORT}`);
  console.log(`🐹 Ready to handle hamster predictions!`);
});
