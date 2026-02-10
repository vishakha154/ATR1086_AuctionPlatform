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
// Backend socket is on same port as API (3000)
const getSocketUrl = () => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  if (socketUrl) {
    return socketUrl;
  }
  
  // Use same port as API (backend socket is on port 3000)
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://192.168.25.78:3000';
  return apiUrl; // Same port as API
};

const SOCKET_URL = getSocketUrl();

type SocketStatus = 'connected' | 'disconnected' | 'connecting';

interface UseSocketDebugOptions {
  auctionId?: string;
  onNewBid?: (event: NewBidEvent) => void;
  onAuctionEndingSoon?: (event: AuctionEndingSoonEvent) => void;
  onAuctionSold?: (event: AuctionSoldEvent) => void;
  onAuctionExpired?: (event: AuctionExpiredEvent) => void;
  onViewerCount?: (event: ViewerCountEvent) => void;
  debug?: boolean; // Enable debug mode
}

// Enhanced logging function
const log = (message: string, data?: any, type: 'log' | 'error' | 'warn' = 'log') => {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[Socket ${timestamp}]`;
  
  if (type === 'error') {
    console.error(`${prefix} ❌ ${message}`, data || '');
  } else if (type === 'warn') {
    console.warn(`${prefix} ⚠️ ${message}`, data || '');
  } else {
    console.log(`${prefix} ${message}`, data || '');
  }
};

export function useSocketDebug(options: UseSocketDebugOptions = {}) {
  const { 
    auctionId, 
    onNewBid, 
    onAuctionEndingSoon, 
    onAuctionSold, 
    onAuctionExpired, 
    onViewerCount,
    debug = true // Enable debug by default
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [viewerCount, setViewerCount] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { toast } = useToast();

  // Log initial configuration
  useEffect(() => {
    if (debug) {
      log('🔌 Socket Configuration:', {
        url: SOCKET_URL,
        auctionId: auctionId || 'none',
        debug: debug,
      });
    }
  }, [auctionId, debug]);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    
    if (debug) {
      log('🔄 Attempting to connect...', {
        url: SOCKET_URL,
        hasToken: !!token,
        tokenLength: token?.length || 0,
      });
    }

    if (socketRef.current?.connected) {
      if (debug) {
        log('ℹ️ Already connected, skipping...');
      }
      return;
    }

    setStatus('connecting');
    setConnectionAttempts(prev => prev + 1);

    try {
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      if (debug) {
        log('📡 Socket instance created', {
          id: socketRef.current.id,
          connected: socketRef.current.connected,
        });
      }

      // Connection successful
      socketRef.current.on('connect', () => {
        const socketId = socketRef.current?.id;
        if (debug) {
          log('✅ Socket CONNECTED successfully!', {
            socketId,
            connectionAttempts,
          });
        }
        setStatus('connected');

        // Join auction room if auctionId is provided
        if (auctionId && socketRef.current) {
          if (debug) {
            log('📡 Joining auction room...', { auctionId });
          }
          socketRef.current.emit('join_auction', { auctionId });
        } else if (debug) {
          log('⚠️ No auctionId provided, skipping room join');
        }
      });

      // Connection failed
      socketRef.current.on('connect_error', (error: Error & { type?: string; description?: string }) => {
        if (debug) {
          log('❌ Connection ERROR:', {
            message: error.message,
            type: error.type || 'unknown',
            description: error.description || '',
            error: error,
          }, 'error');
        }
        setStatus('disconnected');
        
        if (error.message && !error.message.includes('timeout')) {
          toast({
            title: 'Connection error',
            description: `Unable to connect: ${error.message}`,
            variant: 'destructive',
          });
        }
      });

      // Disconnected
      socketRef.current.on('disconnect', (reason) => {
        if (debug) {
          log('❌ Socket DISCONNECTED', {
            reason,
            willReconnect: reason === 'io server disconnect',
          });
        }
        setStatus('disconnected');
      });

      // Reconnection attempt
      socketRef.current.on('reconnect_attempt', (attemptNumber) => {
        if (debug) {
          log('🔄 Reconnection attempt', { attemptNumber });
        }
      });

      // Reconnection successful
      socketRef.current.on('reconnect', (attemptNumber) => {
        if (debug) {
          log('✅ Reconnected successfully!', { attemptNumber });
        }
        setStatus('connected');
        
        if (auctionId && socketRef.current) {
          socketRef.current.emit('join_auction', { auctionId });
        }
      });

      // Reconnection failed
      socketRef.current.on('reconnect_failed', () => {
        if (debug) {
          log('❌ Reconnection FAILED - giving up', {}, 'error');
        }
        setStatus('disconnected');
      });

      // Event handlers with detailed logging
      socketRef.current.on('NEW_BID', (event: NewBidEvent) => {
        if (debug) {
          log('💰 NEW_BID event received!', {
            auctionId: event.auctionId,
            amount: event.amount,
            bidderName: event.bidderName,
            timestamp: event.timestamp,
          });
        }
        onNewBid?.(event);
      });

      socketRef.current.on('AUCTION_ENDING_SOON', (event: AuctionEndingSoonEvent) => {
        if (debug) {
          log('⏰ AUCTION_ENDING_SOON event received!', {
            auctionId: event.auctionId,
            secondsRemaining: event.secondsRemaining,
          });
        }
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
        if (debug) {
          log('🏆 AUCTION_SOLD event received!', {
            auctionId: event.auctionId,
            winnerName: event.winnerName,
            finalPrice: event.finalPrice,
          });
        }
        onAuctionSold?.(event);
        if (event.auctionId === auctionId) {
          toast({
            title: 'Auction sold!',
            description: `Won by ${event.winnerName} for $${event.finalPrice.toLocaleString()}`,
          });
        }
      });

      socketRef.current.on('AUCTION_EXPIRED', (event: AuctionExpiredEvent) => {
        if (debug) {
          log('⏸️ AUCTION_EXPIRED event received!', {
            auctionId: event.auctionId,
          });
        }
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
        if (debug) {
          log('👥 VIEWER_COUNT event received!', {
            auctionId: event.auctionId,
            count: event.count,
          });
        }
        if (event.auctionId === auctionId) {
          setViewerCount(event.count);
        }
        onViewerCount?.(event);
      });

      // Log all events (for debugging)
      if (debug) {
        socketRef.current.onAny((eventName, ...args) => {
          log(`📨 Event received: ${eventName}`, args);
        });
      }

    } catch (error) {
      if (debug) {
        log('❌ Failed to create socket instance', error, 'error');
      }
      setStatus('disconnected');
    }
  }, [auctionId, onNewBid, onAuctionEndingSoon, onAuctionSold, onAuctionExpired, onViewerCount, toast, debug, connectionAttempts]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (debug) {
        log('🔌 Disconnecting socket...', { auctionId });
      }
      if (auctionId) {
        socketRef.current.emit('leave_auction', { auctionId });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setStatus('disconnected');
      if (debug) {
        log('✅ Socket disconnected');
      }
    }
  }, [auctionId, debug]);

  useEffect(() => {
    if (debug) {
      log('🚀 useSocket hook initialized', {
        auctionId,
        status: 'initializing',
      });
    }
    connect();

    return () => {
      if (debug) {
        log('🧹 Cleaning up socket connection...');
      }
      disconnect();
    };
  }, [connect, disconnect, debug]);

  // Rejoin room when auctionId changes
  useEffect(() => {
    if (auctionId && socketRef.current?.connected) {
      if (debug) {
        log('🔄 Auction ID changed, rejoining room...', { auctionId });
      }
      socketRef.current.emit('join_auction', { auctionId });
    }
  }, [auctionId, debug]);

  // Log status changes
  useEffect(() => {
    if (debug) {
      log('📊 Status changed', { status, viewerCount });
    }
  }, [status, viewerCount, debug]);

  return {
    status,
    viewerCount,
    isConnected: status === 'connected',
    connect,
    disconnect,
    socket: socketRef.current, // Expose socket instance for debugging
    connectionAttempts,
  };
}

