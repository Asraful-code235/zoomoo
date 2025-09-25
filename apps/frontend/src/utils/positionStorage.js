/**
 * Client-side position storage for when the backend API is unavailable
 * This is a temporary solution for the mock database scenario
 */

const STORAGE_KEY = 'zoomies_user_positions';

export const positionStorage = {
  // Get all stored positions for a user
  getUserPositions: (userId) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allPositions = stored ? JSON.parse(stored) : {};
      return allPositions[userId] || [];
    } catch (error) {
      console.error('Error reading positions from storage:', error);
      return [];
    }
  },

  // Add a new position for a user
  addPosition: (userId, position) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allPositions = stored ? JSON.parse(stored) : {};
      
      if (!allPositions[userId]) {
        allPositions[userId] = [];
      }
      
      // Add the position with a client-side ID if it doesn't have one
      const newPosition = {
        id: position.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        market_id: position.market_id,
        side: position.side,
        amount: position.amount,
        shares: position.shares || position.amount, // Fallback calculation
        price: position.price || 1.0,
        transaction_fee: position.transaction_fee || (position.amount * 0.02),
        created_at: position.created_at || new Date().toISOString(),
        // Add market info for easier filtering
        market: position.market,
        // Add computed fields
        position_side: position.side ? 'YES' : 'NO',
        unrealized_pnl: 0 // Will be calculated when displaying
      };
      
      allPositions[userId].push(newPosition);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allPositions));
      
      console.log('📱 Position stored locally:', newPosition);
      return newPosition;
    } catch (error) {
      console.error('Error storing position:', error);
      return null;
    }
  },

  // Remove a position (when resolved)
  removePosition: (userId, positionId) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allPositions = stored ? JSON.parse(stored) : {};
      
      if (allPositions[userId]) {
        allPositions[userId] = allPositions[userId].filter(pos => pos.id !== positionId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allPositions));
      }
    } catch (error) {
      console.error('Error removing position:', error);
    }
  },

  // Clear all positions for a user
  clearUserPositions: (userId) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allPositions = stored ? JSON.parse(stored) : {};
      delete allPositions[userId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allPositions));
    } catch (error) {
      console.error('Error clearing positions:', error);
    }
  },

  // Get positions for a specific stream (only unresolved markets)
  getStreamPositions: (userId, streamId) => {
    const userPositions = positionStorage.getUserPositions(userId);
    return userPositions.filter(position => {
      // Check if position belongs to this stream
      const streamMatch = position.market?.stream_id === streamId || position.stream_id === streamId;
      
      // Only show positions from active or ended markets (not resolved or cancelled)
      const marketStatus = position.market?.status;
      const isUnresolved = !marketStatus || ['active', 'ended'].includes(marketStatus);
      
      return streamMatch && isUnresolved;
    });
  },

  // Remove positions for resolved or cancelled markets from local storage
  removeResolvedMarketPositions: (marketId) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allPositions = stored ? JSON.parse(stored) : {};
      
      // Remove positions for this market from all users
      Object.keys(allPositions).forEach(userId => {
        allPositions[userId] = allPositions[userId].filter(pos => 
          pos.market_id !== marketId && pos.market?.id !== marketId
        );
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allPositions));
      console.log('🧹 Cleaned up local storage positions for resolved market:', marketId);
    } catch (error) {
      console.error('Error removing resolved market positions:', error);
    }
  },

  // Update market status for all positions of a specific market
  updateMarketStatus: (marketId, newStatus) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allPositions = stored ? JSON.parse(stored) : {};
      
      // Update status for all users' positions for this market
      Object.keys(allPositions).forEach(userId => {
        allPositions[userId] = allPositions[userId].map(position => {
          if (position.market_id === marketId && position.market) {
            return {
              ...position,
              market: {
                ...position.market,
                status: newStatus
              }
            };
          }
          return position;
        });
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allPositions));
    } catch (error) {
      console.error('Error updating market status:', error);
    }
  },

  // Remove positions when market is resolved
  removeResolvedMarketPositions: (userId, marketId) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allPositions = stored ? JSON.parse(stored) : {};
      
      if (allPositions[userId]) {
        allPositions[userId] = allPositions[userId].filter(pos => pos.market_id !== marketId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allPositions));
      }
    } catch (error) {
      console.error('Error removing resolved positions:', error);
    }
  }
};
