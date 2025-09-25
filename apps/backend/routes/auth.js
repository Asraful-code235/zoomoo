const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify Privy JWT (simplified for now)
const verifyPrivyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // TODO: Implement actual Privy JWT verification
    // For now, we'll extract user info from a simple token
    const token = authHeader.substring(7);
    
    // In production, verify the JWT against Privy's public key
    // For development, we'll accept a simple JSON token
    try {
      const userInfo = JSON.parse(Buffer.from(token, 'base64').toString());
      req.user = userInfo;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Register/login user (upsert) - with auth token
router.post('/login', verifyPrivyToken, async (req, res) => {
  try {
    const user = await User.upsertFromPrivy(req.user);
    res.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Simple register/login endpoint - accepts Privy user object directly
router.post('/register', async (req, res) => {
  try {
    console.log('🔄 Registration request received');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    const { privyUser } = req.body;
    
    if (!privyUser || !privyUser.id) {
      console.log('❌ Missing Privy user data');
      return res.status(400).json({ error: 'Privy user data required' });
    }
    
    console.log('👤 Creating/updating user from Privy:', privyUser.id);
    console.log('📧 User email info:', privyUser.email);
    console.log('🔍 User Google info:', privyUser.google);
    
    const user = await User.upsertFromPrivy(privyUser);
    console.log('✅ User created/updated successfully:', user.id);
    res.json({ user });
  } catch (error) {
    console.error('❌ Register error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: `Registration failed: ${error.message}` });
  }
});

// Get current user info
router.get('/me', verifyPrivyToken, async (req, res) => {
  try {
    const user = await User.getByPrivyId(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user balance (for testing) - uses mock_balance for betting
router.post('/balance', verifyPrivyToken, async (req, res) => {
  try {
    const { balance } = req.body;
    const user = await User.getByPrivyId(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use the updated updateBalance method which prioritizes mock_balance
    const updatedUser = await User.updateBalance(user.id, balance);
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { timeframe = 'all', limit = 100 } = req.query;
    const leaderboard = await User.getLeaderboard(timeframe, parseInt(limit));
    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = { router, verifyPrivyToken };
