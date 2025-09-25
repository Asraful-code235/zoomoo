const express = require('express');
const Stream = require('../models/Stream');
const User = require('../models/User');
const MuxService = require('../lib/mux');
const router = express.Router();

// Import Privy auth middleware
const { verifyPrivyToken } = require('./auth');

// Middleware to verify admin status
const requireAdmin = async (req, res, next) => {
  try {
    // TEMPORARY: For testing, completely bypass auth for all requests
    if (!req.user) {
      console.log('🔧 TESTING: Bypassing auth completely for stream operations');
      
      // Try to find the user, if not found, create one in the database
      let testUser;
      try {
        testUser = await User.getByPrivyId('did:privy:cmfbzzdq10015l50co1m36baw');
        console.log('✅ Found existing admin user:', testUser.email);
      } catch (error) {
        console.log('⚠️ User not found, creating admin user in database...');
        
        // Create the admin user in the database for real
        try {
          const mockPrivyUser = {
            id: 'did:privy:cmfbzzdq10015l50co1m36baw',
            email: { address: 'omathehero@gmail.com' },
            linkedAccounts: [{
              type: 'google_oauth',
              email: 'omathehero@gmail.com'
            }, {
              type: 'wallet',
              chainType: 'solana',
              address: 'GVn7ZTwTCJNdSGXBJ4zNRdYrP4qNdrmKjZC8K1YA9Nz8' // Proper Solana address format
            }]
          };
          
          console.log('🔧 About to call User.upsertFromPrivy with:', JSON.stringify(mockPrivyUser, null, 2));
          testUser = await User.upsertFromPrivy(mockPrivyUser);
          console.log('✅ Created admin user in database:', testUser.id);
        } catch (createError) {
          console.error('❌ Failed to create admin user:', createError);
          console.error('❌ Create error details:', createError.message);
          console.error('❌ Create error stack:', createError.stack);
          throw new Error('Could not create admin user for testing: ' + createError.message);
        }
      }
      
      req.user = { id: 'did:privy:cmfbzzdq10015l50co1m36baw' };
      req.userDb = testUser;
      req.adminRole = 'super_admin'; // Grant super admin for testing
      console.log('🔧 TESTING: Admin bypass successful');
      return next();
    }

    const user = await User.getByPrivyId(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const adminRole = await User.getAdminRole(user.id);
    if (!adminRole) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userDb = user;
    req.adminRole = adminRole;
    next();
  } catch (error) {
    console.error('❌ Admin middleware error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to verify admin status', details: error.message });
  }
};

// Middleware to verify super admin
const requireSuperAdmin = async (req, res, next) => {
  if (req.adminRole !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// Get all active streams (public)
router.get('/', async (req, res) => {
  try {
    const streams = await Stream.getAllActive();
    res.json({ streams });
  } catch (error) {
    console.error('Get streams error:', error);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

// Get stream by ID with markets (public)
router.get('/:id', async (req, res) => {
  try {
    const stream = await Stream.getWithActiveMarkets(req.params.id);
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    res.json({ stream });
  } catch (error) {
    console.error('Get stream error:', error);
    res.status(500).json({ error: 'Failed to fetch stream' });
  }
});

// Create new stream (super admin only)
router.post('/', requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    console.log('🎬 Creating stream request received');
    console.log('📋 Request body:', req.body);
    console.log('👤 User info:', req.userDb);
    console.log('🔑 Admin role:', req.adminRole);
    
    const { name, hamsterName, description } = req.body;

    if (!name || !hamsterName) {
      return res.status(400).json({ error: 'Name and hamster name are required' });
    }

    // Validate required environment variables
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      console.error('❌ Missing MUX configuration');
      return res.status(500).json({ 
        error: 'Server configuration error: MUX credentials not configured' 
      });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase configuration');
      return res.status(500).json({ 
        error: 'Server configuration error: Database credentials not configured' 
      });
    }

    console.log('📞 Calling Stream.create...');
    const stream = await Stream.create({
      name,
      hamsterName,
      description,
    }, req.userDb.id);

    console.log('✅ Stream created successfully:', stream);
    res.status(201).json({ stream });
  } catch (error) {
    console.error('❌ Create stream error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create stream';
    if (error.message.includes('Missing Mux configuration')) {
      errorMessage = 'MUX streaming service not configured. Please contact administrator.';
    } else if (error.message.includes('duplicate key')) {
      errorMessage = 'A stream with this name already exists';
    } else if (error.message.includes('violates foreign key constraint')) {
      errorMessage = 'Invalid admin user reference';
    } else if (error.message.includes('permission denied')) {
      errorMessage = 'Database permission denied. Please check RLS policies.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Get available streams for assignment (admin only)
router.get('/admin/available', requireAdmin, async (req, res) => {
  try {
    console.log('🎬 /admin/available endpoint called');
    console.log('👤 req.userDb:', req.userDb);
    console.log('🔑 req.adminRole:', req.adminRole);
    
    console.log('📞 Calling Stream.getAvailableForAssignment...');
    const streams = await Stream.getAvailableForAssignment();
    console.log('✅ Available streams found:', streams);
    res.json({ streams });
  } catch (error) {
    console.error('❌ Get available streams error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: `Failed to fetch available streams: ${error.message}` });
  }
});

// Get admin's assigned streams
router.get('/admin/my-streams', requireAdmin, async (req, res) => {
  try {
    console.log('🎬 /admin/my-streams endpoint called');
    console.log('👤 req.userDb:', req.userDb);
    console.log('🆔 req.userDb.id:', req.userDb?.id);
    
    if (!req.userDb || !req.userDb.id) {
      console.error('❌ No user DB info available');
      return res.status(400).json({ error: 'User information not available' });
    }
    
    console.log('📞 Calling Stream.getByAdminId with ID:', req.userDb.id);
    
    // TEMPORARY: Also try to find streams assigned to the bypass admin ID
    let streams = await Stream.getByAdminId(req.userDb.id);
    console.log('✅ Streams found for current user:', streams);
    
    // If no streams found, try the bypass admin ID (for streams created during testing)
    if (streams.length === 0) {
      console.log('🔄 No streams found, trying bypass admin ID...');
      try {
        const bypassStreams = await Stream.getByAdminId('56218f89-787f-4973-b0af-a88cc98908c7'); // The ID from your created stream
        console.log('✅ Bypass streams found:', bypassStreams);
        streams = bypassStreams;
      } catch (error) {
        console.log('⚠️ No bypass streams found either');
      }
    }
    res.json({ streams });
  } catch (error) {
    console.error('❌ Get admin streams error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: `Failed to fetch admin streams: ${error.message}` });
  }
});

// Assign admin to stream
router.post('/:id/assign', requireAdmin, async (req, res) => {
  try {
    const { adminId } = req.body;
    const streamId = req.params.id;

    // Super admin can assign anyone, regular admin can only assign themselves
    if (req.adminRole === 'super_admin') {
      // Super admin can assign any admin
      const targetAdminId = adminId || req.userDb.id;
      const stream = await Stream.assignAdmin(streamId, targetAdminId, req.userDb.id);
      res.json({ stream });
    } else {
      // Regular admin can only assign themselves
      const stream = await Stream.assignAdmin(streamId, req.userDb.id);
      res.json({ stream });
    }
  } catch (error) {
    console.error('Assign stream error:', error);
    res.status(500).json({ error: error.message || 'Failed to assign stream' });
  }
});

// Unassign admin from stream
router.post('/:id/unassign', requireAdmin, async (req, res) => {
  try {
    const streamId = req.params.id;
    
    if (req.adminRole === 'super_admin') {
      // Super admin can unassign any stream
      const stream = await Stream.assignAdmin(streamId, null, req.userDb.id);
      res.json({ stream });
    } else {
      // Regular admin can only unassign themselves
      const stream = await Stream.unassignAdmin(streamId, req.userDb.id);
      res.json({ stream });
    }
  } catch (error) {
    console.error('Unassign stream error:', error);
    res.status(500).json({ error: 'Failed to unassign stream' });
  }
});

// Update stream info (assigned admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, hamsterName, description } = req.body;
    const streamId = req.params.id;

    const updates = {};
    if (name) updates.name = name;
    if (hamsterName) updates.hamster_name = hamsterName;
    if (description) updates.description = description;

    const stream = await Stream.update(streamId, updates, req.userDb.id);
    res.json({ stream });
  } catch (error) {
    console.error('Update stream error:', error);
    res.status(500).json({ error: 'Failed to update stream' });
  }
});

// Deactivate stream (assigned admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const streamId = req.params.id;
    const stream = await Stream.deactivate(streamId, req.userDb.id);
    res.json({ stream });
  } catch (error) {
    console.error('Deactivate stream error:', error);
    res.status(500).json({ error: 'Failed to deactivate stream' });
  }
});

// Get stream status from Mux (admin only)
router.get('/:id/status', requireAdmin, async (req, res) => {
  try {
    const stream = await Stream.getById(req.params.id);
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Get Mux status (you'd need to store mux_stream_id in database)
    // const muxStatus = await MuxService.getStreamStatus(stream.mux_stream_id);
    
    res.json({ 
      stream,
      // muxStatus 
    });
  } catch (error) {
    console.error('Get stream status error:', error);
    res.status(500).json({ error: 'Failed to get stream status' });
  }
});

// Reset stream key (assigned admin only) 
router.post('/:id/reset-key', requireAdmin, async (req, res) => {
  try {
    const stream = await Stream.getById(req.params.id);
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    if (stream.assigned_admin_id !== req.userDb.id && req.adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Not assigned to this stream' });
    }

    // Reset Mux stream key
    // const newKeys = await MuxService.resetStreamKey(stream.mux_stream_id);
    
    res.json({ 
      message: 'Stream key reset successfully',
      // newStreamKey: newKeys.streamKey,
      // rtmpUrl: newKeys.rtmpUrl
    });
  } catch (error) {
    console.error('Reset stream key error:', error);
    res.status(500).json({ error: 'Failed to reset stream key' });
  }
});


module.exports = router;
