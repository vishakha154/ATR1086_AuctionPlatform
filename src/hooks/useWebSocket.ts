import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { AuctionWonEvent } from '@/types';

interface UseWebSocketReturn {
  socket: Socket | null;
  balance: number;
  isConnected: boolean;
  error: string | null;
  onAuctionWon?: (event: AuctionWonEvent) => void;
}

// Get socket URL - backend uses same port as API (3000)
const getSocketUrl = () => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  if (socketUrl) {
    return socketUrl;
  }
  
  // Use API URL (backend socket is on same port as API)
  // Extract base URL from API_BASE_URL (remove /api/v1 if present)
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  const baseUrl = apiUrl.replace('/api/v1', '');
  return baseUrl; // Same port as API, but without /api/v1
};

const SOCKET_URL = getSocketUrl();

export function useWebSocket(token: string | null, onAuctionWon?: (event: AuctionWonEvent) => void): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const onAuctionWonRef = useRef(onAuctionWon);

  useEffect(() => {
    if (!token) {
      console.log('🔌 No token provided, skipping socket connection');
      return;
    }

    console.log('🔌 Initializing WebSocket connection...', { url: SOCKET_URL });

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    socketRef.current = newSocket;

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected', { socketId: newSocket.id });
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected', { reason });
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ WebSocket connection error:', err);
      setError(err.message);
      setIsConnected(false);
    });

    // Balance updates from backend
    newSocket.on('BALANCE_UPDATED', (data: { balance: number; timestamp: string }) => {
      console.log('💰 Balance updated via WebSocket:', data.balance);
      setBalance(data.balance);
    });

    // Auction won event
    newSocket.on('AUCTION_WON', (data: AuctionWonEvent) => {
      console.log('🎉 Auction won via WebSocket:', data);
      onAuctionWonRef.current?.(data);
    });

    // Reconnection events
    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected', { attemptNumber });
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt', { attemptNumber });
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      setError('Failed to reconnect to server');
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      newSocket.close();
      socketRef.current = null;
    };
  }, [token]);

  // Update callback ref when it changes
  useEffect(() => {
    onAuctionWonRef.current = onAuctionWon;
  }, [onAuctionWon]);

  return { socket, balance, isConnected, error };
}

