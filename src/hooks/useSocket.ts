import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  NewBidEvent,
  AuctionEndingSoonEvent,
  AuctionSoldEvent,
  AuctionExpiredEvent,
  ViewerCountEvent,
} from '@/types';
import { useToast } from '@/hooks/use-toast';

// Get socket URL from environment variable or use API base URL
const getSocketUrl = () => {
  // Try to get socket URL from env, fallback to API URL or default
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  if (socketUrl) {
    return socketUrl;
  }
  
  // If no socket URL, try to derive from API URL
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://192.168.25.78:3000';
  // Replace port 3000 with 5000 for socket, or use same URL
  return apiUrl.replace(':3000', ':5000') || 'http://192.168.25.78:5000';
};

const SOCKET_URL = getSocketUrl();

// Log socket URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('🔌 Socket URL:', SOCKET_URL);
}

type SocketStatus = 'connected' | 'disconnected' | 'connecting';

interface UseSocketOptions {
  auctionId?: string;
  onNewBid?: (event: NewBidEvent) => void;
  onAuctionEndingSoon?: (event: AuctionEndingSoonEvent) => void;
  onAuctionSold?: (event: AuctionSoldEvent) => void;
  onAuctionExpired?: (event: AuctionExpiredEvent) => void;
  onViewerCount?: (event: ViewerCountEvent) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { auctionId, onNewBid, onAuctionEndingSoon, onAuctionSold, onAuctionExpired, onViewerCount } = options;

  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [viewerCount, setViewerCount] = useState(0);
  const { toast } = useToast();

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');

    if (socketRef.current?.connected) {
      return;
    }

    setStatus('connecting');

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected');
      setStatus('connected');

      // Join auction room if auctionId is provided
      if (auctionId && socketRef.current) {
        console.log('📡 Joining auction room:', auctionId);
        socketRef.current.emit('join_auction', { auctionId });
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setStatus('disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setStatus('disconnected');
      // Show error toast only if it's a critical error
      if (error.message && !error.message.includes('timeout')) {
        toast({
          title: 'Connection error',
          description: 'Unable to connect to real-time updates',
          variant: 'destructive',
        });
      }
    });

    // Event handlers
    socketRef.current.on('NEW_BID', (event: NewBidEvent) => {
      console.log('💰 New bid received:', event);
      onNewBid?.(event);
    });

    socketRef.current.on('AUCTION_ENDING_SOON', (event: AuctionEndingSoonEvent) => {
      onAuctionEndingSoon?.(event);
      if (event.auctionId === auctionId) {
        toast({
          title: 'Auction ending soon!',
          description: `Less than ${event.secondsRemaining} seconds remaining`,
          variant: 'default',
        });
      }
    });

    socketRef.current.on('AUCTION_SOLD', (event: AuctionSoldEvent) => {
      onAuctionSold?.(event);
      if (event.auctionId === auctionId) {
        toast({
          title: 'Auction sold!',
          description: `Won by ${event.winnerName} for $${event.finalPrice.toLocaleString()}`,
        });
      }
    });

    socketRef.current.on('AUCTION_EXPIRED', (event: AuctionExpiredEvent) => {
      onAuctionExpired?.(event);
      if (event.auctionId === auctionId) {
        toast({
          title: 'Auction expired',
          description: 'This auction ended with no bids',
          variant: 'destructive',
        });
      }
    });

    socketRef.current.on('VIEWER_COUNT', (event: ViewerCountEvent) => {
      if (event.auctionId === auctionId) {
        console.log('👥 Viewer count updated:', event.count);
        setViewerCount(event.count);
      }
      onViewerCount?.(event);
    });
  }, [auctionId, onNewBid, onAuctionEndingSoon, onAuctionSold, onAuctionExpired, onViewerCount, toast]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (auctionId) {
        socketRef.current.emit('leave_auction', { auctionId });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setStatus('disconnected');
    }
  }, [auctionId]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Rejoin room when auctionId changes
  useEffect(() => {
    if (auctionId && socketRef.current?.connected) {
      socketRef.current.emit('join_auction', { auctionId });
    }
  }, [auctionId]);

  return {
    status,
    viewerCount,
    isConnected: status === 'connected',
    connect,
    disconnect,
  };
}
