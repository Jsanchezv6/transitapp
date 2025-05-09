import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth.tsx';

interface WebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

interface WebSocketManager {
  sendMessage: (type: string, data: any) => void;
  connected: boolean;
  connecting: boolean;
  error: Event | null;
}

const defaultOptions: WebSocketOptions = {
  reconnectInterval: 3000,
  reconnectAttempts: 5,
};

export function useWebSocket(options: WebSocketOptions = {}): WebSocketManager {
  const mergedOptions = { ...defaultOptions, ...options };
  const { token } = useAuth();
  
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  // Create WebSocket connection
  const connect = useCallback(() => {
    if (socket || !token) return;
    
    setConnecting(true);
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setConnecting(false);
      setReconnectCount(0);
      
      // Authenticate after connection
      if (token) {
        ws.send(JSON.stringify({
          type: 'authenticate',
          data: { token }
        }));
      }
      
      if (mergedOptions.onConnect) {
        mergedOptions.onConnect();
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      setSocket(null);
      
      if (mergedOptions.onDisconnect) {
        mergedOptions.onDisconnect();
      }
      
      // Attempt to reconnect if we haven't reached max attempts
      if (reconnectCount < (mergedOptions.reconnectAttempts || 5)) {
        setTimeout(() => {
          setReconnectCount(prev => prev + 1);
          connect();
        }, mergedOptions.reconnectInterval);
      }
    };
    
    ws.onerror = (e) => {
      console.error('WebSocket error:', e);
      setError(e);
      
      if (mergedOptions.onError) {
        mergedOptions.onError(e);
      }
    };
    
    setSocket(ws);
  }, [token, socket, reconnectCount, mergedOptions]);

  // Connect when component mounts and token changes
  useEffect(() => {
    if (token) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [token, connect]);

  // Function to send messages
  const sendMessage = useCallback((type: string, data: any) => {
    if (socket && connected) {
      socket.send(JSON.stringify({ type, data }));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, [socket, connected]);

  return {
    sendMessage,
    connected,
    connecting,
    error,
  };
}

// Hook for real-time bus locations
export function useBusLocations() {
  const [locations, setLocations] = useState<any[]>([]);
  const { connected, sendMessage } = useWebSocket({
    onConnect: () => {
      console.log('WebSocket connected for bus locations');
    },
  });

  // Listen for location updates
  useEffect(() => {
    if (!connected) return;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'locationBroadcast') {
          setLocations(prev => {
            // Replace existing location for this bus or add new one
            const filteredLocations = prev.filter(loc => loc.busId !== message.data.busId);
            return [...filteredLocations, message.data];
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [connected]);

  // Update bus location
  const updateLocation = useCallback((data: {
    busId: number;
    shiftId: number;
    latitude: number;
    longitude: number;
    status?: string;
    nextStopId?: number;
  }) => {
    sendMessage('updateLocation', data);
  }, [sendMessage]);

  return { locations, updateLocation, connected };
}
