import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { storage } from './storage';
import { verifyToken } from './auth';
import { BusLocation, InsertBusLocation } from '@shared/schema';

// Client type for our WebSocket connections
interface Client {
  ws: WebSocket;
  userId?: number;
  role?: string;
  isAlive: boolean;
}

// Message types
type MessageType = 'updateLocation' | 'subscribe' | 'unsubscribe' | 'authenticate';

interface WSMessage {
  type: MessageType;
  data: any;
}

export function setupWebSocketServer(server: http.Server) {
  // Create WebSocket server with a specific path
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  // Map to store connected clients
  const clients: Map<WebSocket, Client> = new Map();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    // Initialize client
    const client: Client = { ws, isAlive: true };
    clients.set(ws, client);
    
    // Ping-pong to check connection liveness
    ws.on('pong', () => {
      const client = clients.get(ws);
      if (client) {
        client.isAlive = true;
      }
    });
    
    // Handle messages
    ws.on('message', async (message: string) => {
      try {
        const parsedMessage: WSMessage = JSON.parse(message);
        
        // Handle different message types
        switch (parsedMessage.type) {
          case 'authenticate':
            handleAuthentication(ws, parsedMessage.data.token);
            break;
            
          case 'updateLocation':
            await handleLocationUpdate(ws, parsedMessage.data);
            break;
            
          case 'subscribe':
            // Client wants to subscribe to updates
            // Currently, all authenticated clients receive all updates
            break;
            
          case 'unsubscribe':
            // Client wants to unsubscribe from updates
            break;
            
          default:
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Unknown message type'
            }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Failed to process message'
        }));
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
    
    // Send initial welcome message
    ws.send(JSON.stringify({ 
      type: 'info', 
      message: 'Connected to transportation system WebSocket server'
    }));
  });
  
  // Setup interval for checking connection liveness
  const pingInterval = setInterval(() => {
    for (const [ws, client] of clients.entries()) {
      if (!client.isAlive) {
        clients.delete(ws);
        ws.terminate();
        continue;
      }
      
      client.isAlive = false;
      ws.ping();
    }
  }, 30000); // Check every 30 seconds
  
  // Clean up interval on server close
  wss.on('close', () => {
    clearInterval(pingInterval);
  });
  
  // Function to handle authentication messages
  function handleAuthentication(ws: WebSocket, token: string) {
    const client = clients.get(ws);
    if (!client) return;
    
    const decoded = verifyToken(token);
    if (!decoded) {
      ws.send(JSON.stringify({
        type: 'auth',
        success: false,
        message: 'Invalid authentication token'
      }));
      return;
    }
    
    // Update client with authenticated user info
    client.userId = decoded.userId;
    client.role = decoded.role;
    
    ws.send(JSON.stringify({
      type: 'auth',
      success: true,
      message: 'Successfully authenticated',
      user: {
        userId: decoded.userId,
        role: decoded.role
      }
    }));
  }
  
  // Function to handle location update messages
  async function handleLocationUpdate(ws: WebSocket, data: any) {
    const client = clients.get(ws);
    if (!client || !client.userId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Authentication required'
      }));
      return;
    }
    
    // Basic validation of location data
    if (!data.busId || !data.shiftId || data.latitude === undefined || data.longitude === undefined) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid location data'
      }));
      return;
    }
    
    try {
      // Create location record in storage
      const locationData: InsertBusLocation = {
        busId: data.busId,
        shiftId: data.shiftId,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status || 'on-time',
        nextStopId: data.nextStopId || null
      };
      
      const location = await storage.createBusLocation(locationData);
      
      // Broadcast the location update to all clients
      broadcastLocationUpdate(location);
      
      // Send confirmation to the sender
      ws.send(JSON.stringify({
        type: 'locationUpdate',
        success: true,
        message: 'Location updated successfully'
      }));
    } catch (error) {
      console.error('Error updating location:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to update location'
      }));
    }
  }
  
  // Function to broadcast location updates to all authenticated clients
  function broadcastLocationUpdate(location: BusLocation) {
    for (const [ws, client] of clients.entries()) {
      if (client.userId && client.role && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'locationBroadcast',
          data: location
        }));
      }
    }
  }
  
  return wss;
}
