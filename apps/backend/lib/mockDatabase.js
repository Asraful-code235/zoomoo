/**
 * Mock Database for Development
 * This provides a simple persistent database for testing the betting system
 * when Supabase credentials are not available
 */

const fs = require('fs');
const path = require('path');

class MockDatabase {
  constructor() {
    this.dataFile = path.join(__dirname, '../data/mock-database.json');
    this.users = new Map();
    this.markets = new Map();
    this.positions = new Map();
    this.streams = new Map();
    
    // Load existing data or initialize with sample data
    this.loadData();
  }

  // Load data from file or initialize with sample data
  loadData() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dataFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dataFile)) {
        console.log('📂 Loading mock database from file...');
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        
        // Restore Maps from stored data
        this.users = new Map(data.users || []);
        this.markets = new Map(data.markets || []);
        this.positions = new Map(data.positions || []);
        this.streams = new Map(data.streams || []);
        
        console.log(`✅ Loaded ${this.users.size} users, ${this.positions.size} positions, ${this.markets.size} markets, ${this.streams.size} streams`);
      } else {
        console.log('🆕 Creating new mock database...');
        this.initializeSampleData();
        this.saveData();
      }
    } catch (error) {
      console.error('❌ Error loading mock database:', error);
      this.initializeSampleData();
    }
  }

  // Save data to file
  saveData() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        markets: Array.from(this.markets.entries()),
        positions: Array.from(this.positions.entries()),
        streams: Array.from(this.streams.entries()),
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
      console.log('💾 Mock database saved to file');
    } catch (error) {
      console.error('❌ Error saving mock database:', error);
    }
  }

  initializeSampleData() {
    // Sample stream
    const sampleStream = {
      id: '0d7839c3-aa50-4c32-97b0-ef1576ca9dbe',
      hamster_name: 'Fluffy',
      playback_id: 'Os3AZhB4bp95dEQAmpE01EvLT88sWtKz2oUMuYom4rO00',
      status: 'active',
      created_at: new Date().toISOString()
    };
    this.streams.set(sampleStream.id, sampleStream);

    // Sample market
    const sampleMarket = {
      id: 'c9d87bed-ca6d-4f9a-8373-16822f66bef7',
      stream_id: sampleStream.id,
      question: 'Will Fluffy use the wheel in the next 5 minutes?',
      status: 'active',
      yes_volume: 50,
      no_volume: 30,
      total_volume: 80,
      ends_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
      created_at: new Date().toISOString()
    };
    this.markets.set(sampleMarket.id, sampleMarket);
  }

  // Mock Supabase-like interface
  from(table) {
    return {
      select: (columns = '*') => {
        const selectObj = {
          eq: (column, value) => ({
            single: () => this._selectSingle(table, column, value),
            limit: (limit) => this._selectLimit(table, column, value, limit)
          }),
          limit: (limit) => this._selectAll(table, limit),
          single: () => this._selectFirstRow(table)
        };
        
        // Make this awaitable for direct select calls
        return Object.assign(this._selectAll(table), selectObj);
      },
      insert: (data) => ({
        select: () => ({
          single: () => this._insert(table, data)
        })
      }),
      update: (data) => ({
        eq: (column, value) => this._update(table, data, column, value)
      }),
      delete: () => ({
        eq: (column, value) => this._delete(table, column, value)
      })
    };
  }

  _selectSingle(table, column, value) {
    return new Promise((resolve) => {
      const tableData = this._getTable(table);
      const result = Array.from(tableData.values()).find(item => item[column] === value);
      resolve({ data: result || null, error: result ? null : { code: 'PGRST116' } });
    });
  }

  _selectLimit(table, column, value, limit) {
    return new Promise((resolve) => {
      const tableData = this._getTable(table);
      const results = Array.from(tableData.values())
        .filter(item => item[column] === value)
        .slice(0, limit);
      resolve({ data: results, error: null });
    });
  }

  _selectAll(table, limit = 100) {
    return new Promise((resolve) => {
      const tableData = this._getTable(table);
      const results = Array.from(tableData.values()).slice(0, limit);
      resolve({ data: results, error: null });
    });
  }

  _selectFirstRow(table) {
    return new Promise((resolve) => {
      const tableData = this._getTable(table);
      const result = Array.from(tableData.values())[0] || null;
      resolve({ data: result, error: result ? null : { code: 'PGRST116' } });
    });
  }

  _insert(table, data) {
    return new Promise((resolve) => {
      const tableData = this._getTable(table);
      const id = data.id || this._generateId();
      const newRecord = { 
        ...data, 
        id, 
        created_at: data.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      tableData.set(id, newRecord);
      this.saveData(); // Persist changes
      resolve({ data: newRecord, error: null });
    });
  }

  _update(table, data, column, value) {
    return new Promise((resolve) => {
      const tableData = this._getTable(table);
      const record = Array.from(tableData.values()).find(item => item[column] === value);
      
      if (record) {
        const updatedRecord = { ...record, ...data, updated_at: new Date().toISOString() };
        tableData.set(record.id, updatedRecord);
        this.saveData(); // Persist changes
        resolve({ data: updatedRecord, error: null });
      } else {
        resolve({ data: null, error: { message: 'Record not found' } });
      }
    });
  }

  _delete(table, column, value) {
    return new Promise((resolve) => {
      const tableData = this._getTable(table);
      const record = Array.from(tableData.values()).find(item => item[column] === value);
      
      if (record) {
        tableData.delete(record.id);
        this.saveData(); // Persist changes
        resolve({ data: record, error: null });
      } else {
        resolve({ data: null, error: { message: 'Record not found' } });
      }
    });
  }

  _getTable(tableName) {
    switch (tableName) {
      case 'users': return this.users;
      case 'markets': return this.markets;
      case 'positions': return this.positions;
      case 'streams': return this.streams;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  _generateId() {
    return 'mock_' + Math.random().toString(36).substr(2, 9);
  }

  // Initialize a user with mock balance
  createUser(userData) {
    const user = {
      id: this._generateId(),
      privy_id: userData.privy_id,
      email: userData.email || 'test@example.com',
      username: userData.username || 'TestUser',
      wallet_address: userData.wallet_address || 'mock_wallet',
      mock_balance: 100.00, // Give new users $100
      usdc_balance: 0.00,
      total_earnings: 0,
      total_bets: 0,
      win_rate: 0,
      prediction_streak: 0,
      longest_streak: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.users.set(user.id, user);
    return user;
  }
}

// Create singleton instance
const mockDb = new MockDatabase();

module.exports = { mockDb };
