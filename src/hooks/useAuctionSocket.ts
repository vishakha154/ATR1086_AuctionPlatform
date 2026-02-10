import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import type {
  NewBidEvent,
  AuctionPriceUpdatedEvent,
  ViewerCountEvent,
  AuctionEndingSoonEvent,
  AuctionSoldEvent,
  AuctionExpiredEvent,
} from '@/types';

interface UseAuctionSocketReturn {
  currentPrice: number;
  latestBid: NewBidEvent | null;
  viewerCount: number;
  joinAuction: (auctionId: string) => void;
  leaveAuction: (auctionId: string) => void;
}

export function useAuctionSocket(
  socket: Socket | null,
  auctionId: string | null
): UseAuctionSocketReturn {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [latestBid, setLatestBid] = useState<NewBidEvent | null>(null);
  const [viewerCount, setViewerCount] = useState<number>(0);

  useEffect(() => {
    if (!socket || !auctionId) {
      console.log('⚠️ useAuctionSocket: No socket or auctionId', { socket: !!socket, auctionId });
      return;
    }

    console.log('📡 Joining auction room:', auctionId);
    socket.emit('join_auction', { auctionId });

    // Listen for new bids
    const handleNewBid = (data: NewBidEvent) => {
      if (data.auctionId === auctionId) {
        console.log('🎯 New bid received:', data);
        setLatestBid(data);
        setCurrentPrice(data.currentPrice);
      }
    };

    // Listen for price updates (separate event from NEW_BID)
    const handlePriceUpdate = (data: AuctionPriceUpdatedEvent) => {
      if (data.auctionId === auctionId) {
        console.log('💰 Price updated:', data.newPrice);
        setCurrentPrice(data.newPrice);
      }
    };

    // Listen for viewer count
    const handleViewerCount = (data: ViewerCountEvent) => {
      if (data.auctionId === auctionId) {
        console.log('👥 Viewer count updated:', data.count);
        setViewerCount(data.count);
      }
    };

    // Listen for auction ending soon
    const handleEndingSoon = (data: AuctionEndingSoonEvent) => {
      if (data.auctionId === auctionId) {
        console.log(`⏰ Auction ending in ${data.secondsRemaining} seconds`);
      }
    };

    // Listen for auction sold
    const handleSold = (data: AuctionSoldEvent) => {
      if (data.auctionId === auctionId) {
        console.log(`🏆 Auction sold to ${data.winnerName} for $${data.finalPrice}`);
      }
    };

    // Listen for auction expired
    const handleExpired = (data: AuctionExpiredEvent) => {
      if (data.auctionId === auctionId) {
        console.log('⏱️ Auction expired');
      }
    };

    // Register event listeners
    socket.on('NEW_BID', handleNewBid);
    socket.on('AUCTION_PRICE_UPDATED', handlePriceUpdate);
    socket.on('VIEWER_COUNT', handleViewerCount);
    socket.on('AUCTION_ENDING_SOON', handleEndingSoon);
    socket.on('AUCTION_SOLD', handleSold);
    socket.on('AUCTION_EXPIRED', handleExpired);

    // Cleanup: leave room and remove listeners
    return () => {
      console.log('📡 Leaving auction room:', auctionId);
      socket.emit('leave_auction', { auctionId });
      socket.off('NEW_BID', handleNewBid);
      socket.off('AUCTION_PRICE_UPDATED', handlePriceUpdate);
      socket.off('VIEWER_COUNT', handleViewerCount);
      socket.off('AUCTION_ENDING_SOON', handleEndingSoon);
      socket.off('AUCTION_SOLD', handleSold);
      socket.off('AUCTION_EXPIRED', handleExpired);
    };
  }, [socket, auctionId]);

  const joinAuction = useCallback((id: string) => {
    if (socket) {
      console.log('📡 Manually joining auction:', id);
      socket.emit('join_auction', { auctionId: id });
    }
  }, [socket]);

  const leaveAuction = useCallback((id: string) => {
    if (socket) {
      console.log('📡 Manually leaving auction:', id);
      socket.emit('leave_auction', { auctionId: id });
    }
  }, [socket]);

  return {
    currentPrice,
    latestBid,
    viewerCount,
    joinAuction,
    leaveAuction,
  };
}


