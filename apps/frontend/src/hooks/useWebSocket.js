import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  
  const {
    onOpen,
    onMessage,
    onError,
    onClose,
    shouldReconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const connect = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = (event) => {
        console.log('WebSocket connected:', url);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          setLastMessage(event.data);
          onMessage?.(event.data);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        onError?.(event);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        onClose?.(event);

        // Attempt to reconnect if needed
        if (shouldReconnect && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${reconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError(err.message);
    }
  }, [url, onOpen, onMessage, onError, onClose, shouldReconnect, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setError(null);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        wsRef.current.send(messageStr);
        return true;
      } catch (err) {
        console.error('Failed to send WebSocket message:', err);
        setError(err.message);
        return false;
      }
    } else {
      console.warn('WebSocket is not connected');
      return false;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    disconnect,
    reconnect: connect
  };
}

// Hook specifically for real-time position updates
export function usePositionUpdates(userId, onPositionUpdate) {
  const [positions, setPositions] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // For demo purposes, we'll simulate WebSocket updates
  // In production, this would connect to a real WebSocket server
  useEffect(() => {
    if (!userId) return;

    // Simulate WebSocket connection
    setConnectionStatus('connecting');
    
    const connectTimeout = setTimeout(() => {
      setConnectionStatus('connected');
      console.log('🔴 Demo WebSocket: Connected to position updates');
    }, 1000);

    // Simulate periodic position updates
    const updateInterval = setInterval(() => {
      // Simulate random price changes
      const mockUpdate = {
        type: 'position_update',
        userId,
        updates: {
          marketPriceChange: (Math.random() - 0.5) * 0.1, // +/- 5% change
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('🔴 Demo WebSocket: Position update received', mockUpdate);
      onPositionUpdate?.(mockUpdate);
    }, 15000); // Update every 15 seconds

    return () => {
      clearTimeout(connectTimeout);
      clearInterval(updateInterval);
      setConnectionStatus('disconnected');
      console.log('🔴 Demo WebSocket: Disconnected from position updates');
    };
  }, [userId, onPositionUpdate]);

  return {
    connectionStatus,
    positions,
    isConnected: connectionStatus === 'connected'
  };
}

export default useWebSocket;
