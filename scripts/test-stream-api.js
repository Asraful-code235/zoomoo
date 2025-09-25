#!/usr/bin/env node

/**
 * Simple API test for stream creation
 * This makes a direct HTTP request to test the stream creation endpoint
 */

const fetch = require('node-fetch');

async function testStreamAPI() {
  console.log('🧪 Testing Stream Creation API\n');

  const API_URL = 'http://localhost:3001';
  
  try {
    // Test data
    const streamData = {
      name: `Test Stream ${Date.now()}`,
      hamsterName: `Test Hamster ${Date.now()}`,
      description: 'Test stream created via API test'
    };

    console.log('📋 Test data:', streamData);
    console.log('🌐 Making request to:', `${API_URL}/api/streams`);

    // Make the request
    const response = await fetch(`${API_URL}/api/streams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you'd need proper authentication headers
      },
      body: JSON.stringify(streamData)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers));

    const responseData = await response.text();
    console.log('📊 Response body:', responseData);

    if (response.ok) {
      console.log('✅ Stream creation successful!');
      try {
        const parsedData = JSON.parse(responseData);
        if (parsedData.stream) {
          console.log('📋 Created stream details:');
          console.log(`   - ID: ${parsedData.stream.id}`);
          console.log(`   - Name: ${parsedData.stream.name}`);
          console.log(`   - Hamster: ${parsedData.stream.hamster_name}`);
          console.log(`   - MUX Stream ID: ${parsedData.stream.mux_stream_id}`);
        }
      } catch (parseError) {
        console.log('⚠️ Could not parse response as JSON');
      }
      return true;
    } else {
      console.log('❌ Stream creation failed');
      try {
        const errorData = JSON.parse(responseData);
        console.log('❌ Error details:', errorData);
      } catch (parseError) {
        console.log('❌ Raw error response:', responseData);
      }
      return false;
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd apps/backend && npm start');
      console.log('   or');
      console.log('   pnpm dev');
    }
    
    return false;
  }
}

// Test server connectivity first
async function testServerConnectivity() {
  console.log('🔍 Testing server connectivity...');
  
  try {
    const response = await fetch('http://localhost:3001/api/streams', {
      method: 'GET'
    });
    
    console.log('✅ Server is responding');
    return true;
  } catch (error) {
    console.log('❌ Server is not responding');
    console.log('💡 Start the server with: pnpm dev');
    return false;
  }
}

// Run the tests
if (require.main === module) {
  testServerConnectivity()
    .then(serverOk => {
      if (!serverOk) {
        process.exit(1);
      }
      return testStreamAPI();
    })
    .then(success => {
      if (success) {
        console.log('\n🎉 Stream creation API test passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Stream creation API test failed.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testStreamAPI };
