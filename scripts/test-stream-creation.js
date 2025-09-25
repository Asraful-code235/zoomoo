#!/usr/bin/env node

/**
 * Test script to verify stream creation functionality
 * This script tests the complete stream creation flow including:
 * - Environment variable validation
 * - MUX API connectivity
 * - Database permissions
 * - Stream creation process
 */

// Load environment variables from backend directory
require('dotenv').config({ path: './apps/backend/.env' });

const { supabase } = require('./apps/backend/lib/supabase');
const MuxService = require('./apps/backend/lib/mux');
const Stream = require('./apps/backend/models/Stream');

async function testStreamCreation() {
  console.log('🧪 Testing Stream Creation Flow\n');

  try {
    // Step 1: Test environment variables
    console.log('1️⃣ Checking environment variables...');
    
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY', 
      'MUX_TOKEN_ID',
      'MUX_TOKEN_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars.join(', '));
      console.log('\n📝 Please add these to your .env file:');
      missingVars.forEach(varName => {
        console.log(`${varName}=your-${varName.toLowerCase().replace(/_/g, '-')}-here`);
      });
      return false;
    }
    
    console.log('✅ All environment variables present');

    // Step 2: Test Supabase connection
    console.log('\n2️⃣ Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');

    // Step 3: Test MUX configuration
    console.log('\n3️⃣ Testing MUX configuration...');
    try {
      MuxService.validateConfig();
      console.log('✅ MUX configuration valid');
    } catch (error) {
      console.error('❌ MUX configuration invalid:', error.message);
      return false;
    }

    // Step 4: Check database policies for streams
    console.log('\n4️⃣ Checking database policies...');
    const { data: policyData, error: policyError } = await supabase
      .rpc('check_table_policies', { table_name: 'streams' })
      .single();
    
    if (policyError) {
      console.warn('⚠️ Could not check policies (this is okay):', policyError.message);
    }

    // Step 5: Test stream creation (dry run)
    console.log('\n5️⃣ Testing stream creation process...');
    
    // Find or create a test admin user
    let testAdminId;
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'test-admin@zoomies.com')
        .single();
      
      if (existingUser) {
        testAdminId = existingUser.id;
        console.log('✅ Using existing test admin user');
      } else {
        // Create test admin user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            privy_id: 'test-admin-privy-id',
            email: 'test-admin@zoomies.com',
            username: 'test-admin',
            wallet_address: 'test-wallet-address'
          })
          .select('id')
          .single();
        
        if (userError) {
          console.error('❌ Could not create test admin user:', userError.message);
          return false;
        }
        
        testAdminId = newUser.id;
        console.log('✅ Created test admin user');
      }
    } catch (error) {
      console.error('❌ Error with test admin user:', error.message);
      return false;
    }

    // Test actual stream creation
    const testStreamData = {
      name: `Test Stream ${Date.now()}`,
      hamsterName: `Test Hamster ${Date.now()}`,
      description: 'Test stream created by automated test'
    };

    console.log('📞 Attempting to create test stream...');
    const stream = await Stream.create(testStreamData, testAdminId);
    
    if (stream && stream.id) {
      console.log('✅ Stream created successfully!');
      console.log('📋 Stream details:');
      console.log(`   - ID: ${stream.id}`);
      console.log(`   - Name: ${stream.name}`);
      console.log(`   - Hamster: ${stream.hamster_name}`);
      console.log(`   - MUX Stream ID: ${stream.mux_stream_id}`);
      console.log(`   - Playback ID: ${stream.mux_playback_id}`);
      
      // Clean up test stream
      console.log('\n🧹 Cleaning up test stream...');
      await Stream.deactivate(stream.id, testAdminId);
      console.log('✅ Test stream cleaned up');
      
      return true;
    } else {
      console.error('❌ Stream creation returned invalid result');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('📋 Error details:', error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testStreamCreation()
    .then(success => {
      if (success) {
        console.log('\n🎉 All tests passed! Stream creation should work.');
        process.exit(0);
      } else {
        console.log('\n💥 Tests failed. Please fix the issues above.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testStreamCreation };
