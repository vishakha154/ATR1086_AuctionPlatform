import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface BidData {
  auctionId: string;
  amount: number;
  bidderName: string;
  bidderId: string;
  currentPrice: number;
  timestamp: string;
}

interface UseAuctionSocketReturn {
  currentPrice: number;
  latestBid: BidData | null;
  viewerCount: number;
  joinAuction: (auctionId: string) => void;
  leaveAuction: (auctionId: string) => void;
}

export function useAuctionSocket(
  socket: Socket | null,
  auctionId: string | null
): UseAuctionSocketReturn {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [latestBid, setLatestBid] = useState<BidData | null>(null);
  const [viewerCount, setViewerCount] = useState<number>(0);

  useEffect(() => {
    if (!socket || !auctionId) {
      console.log('⚠️ useAuctionSocket: No socket or auctionId', { socket: !!socket, auctionId });
      return;
    }

    console.log('📡 Joining auction room:', auctionId);
    socket.emit('join_auction', { auctionId });

    // Listen for new bids
    const handleNewBid = (data: BidData) => {
      console.log('🎯 New bid received:', data);
      setLatestBid(data);
      setCurrentPrice(data.currentPrice);
    };

    // Listen for price updates (separate event from NEW_BID)
    const handlePriceUpdate = (data: { auctionId: string; currentPrice: number }) => {
      if (data.auctionId === auctionId) {
        console.log('💰 Price updated:', data.currentPrice);
        setCurrentPrice(data.currentPrice);
      }
    };

    // Listen for viewer count
    const handleViewerCount = (data: { auctionId: string; count: number }) => {
      if (data.auctionId === auctionId) {
        console.log('👥 Viewer count updated:', data.count);
        setViewerCount(data.count);
      }
    };

    // Listen for auction ending soon
    const handleEndingSoon = (data: { auctionId: string; secondsRemaining: number }) => {
      if (data.auctionId === auctionId) {
        console.log(`⏰ Auction ending in ${data.secondsRemaining} seconds`);
      }
    };

    // Listen for auction sold
    const handleSold = (data: { auctionId: string; winnerName: string; finalPrice: number }) => {
      if (data.auctionId === auctionId) {
        console.log(`🏆 Auction sold to ${data.winnerName} for $${data.finalPrice}`);
      }
    };

    // Register event listeners
    socket.on('NEW_BID', handleNewBid);
    socket.on('AUCTION_PRICE_UPDATED', handlePriceUpdate);
    socket.on('VIEWER_COUNT', handleViewerCount);
    socket.on('AUCTION_ENDING_SOON', handleEndingSoon);
    socket.on('AUCTION_SOLD', handleSold);

    // Cleanup: leave room and remove listeners
    return () => {
      console.log('📡 Leaving auction room:', auctionId);
      socket.emit('leave_auction', { auctionId });
      socket.off('NEW_BID', handleNewBid);
      socket.off('AUCTION_PRICE_UPDATED', handlePriceUpdate);
      socket.off('VIEWER_COUNT', handleViewerCount);
      socket.off('AUCTION_ENDING_SOON', handleEndingSoon);
      socket.off('AUCTION_SOLD', handleSold);
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

