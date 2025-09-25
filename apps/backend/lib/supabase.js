const { createClient } = require('@supabase/supabase-js');
const { mockDb } = require('./mockDatabase');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase;
let usingMockDatabase = false;

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️  Missing Supabase environment variables!');
  console.log('🔧 Using mock database for development...');
  console.log('');
  console.log('To use real Supabase, create a .env file in apps/backend/ with:');
  console.log('SUPABASE_URL=your_supabase_project_url');
  console.log('SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.log('');
  
  // Use mock database
  supabase = mockDb;
  usingMockDatabase = true;
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase connected successfully');
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error.message);
    console.log('🔧 Falling back to mock database...');
    supabase = mockDb;
    usingMockDatabase = true;
  }
}

module.exports = { supabase, usingMockDatabase };
