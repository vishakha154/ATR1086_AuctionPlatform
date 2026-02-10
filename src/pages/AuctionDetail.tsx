import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auctionsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuctionSocket } from '../hooks/useAuctionSocket';
import { Layout } from '../components/layout/Layout';
import { AuctionCountdown } from '../components/auctions/AuctionCountdown';
import { BidForm } from '../components/auctions/BidForm';
import { BidHistory } from '../components/auctions/BidHistory';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { ImageIcon, Users, ArrowLeft, Trophy, User, Wifi, WifiOff } from 'lucide-react';
import type { AuctionItem, Bid } from '../types';

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [localBids, setLocalBids] = useState<Bid[]>([]);
  const [localPrice, setLocalPrice] = useState<number | null>(null);
  const processedBidsRef = useRef<Set<string>>(new Set()); // Track processed bids to avoid duplicates
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: auction, isLoading, error } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => auctionsApi.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds - don't refetch too frequently
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Only refetch if data is stale
  });


  const handleAuctionSold = useCallback(() => {
    // Refresh auction data when sold
    queryClient.invalidateQueries({ queryKey: ['auction', id] });
    queryClient.invalidateQueries({ queryKey: ['auctions'] });
    // Clear local state
    setLocalPrice(null);
    setLocalBids([]);
  }, [id, queryClient]);

  const handleAuctionExpired = useCallback(() => {
    // Refresh auction data when expired
    queryClient.invalidateQueries({ queryKey: ['auction', id] });
    queryClient.invalidateQueries({ queryKey: ['auctions'] });
    // Clear local state
    setLocalPrice(null);
    setLocalBids([]);
  }, [id, queryClient]);

  // Get token for WebSocket
  const token = localStorage.getItem('token');

  // Initialize WebSocket connection
  const { socket, balance: socketBalance, isConnected: socketConnected, error: socketError } = useWebSocket(token);

  // Use auction-specific socket hooks
  const { currentPrice: socketPrice, latestBid, viewerCount } = useAuctionSocket(socket, id || null);

  // Handle new bid from socket
  useEffect(() => {
    if (!latestBid || latestBid.auctionId !== id) return;

    // Create a unique key for this bid to avoid processing duplicates
    const bidKey = `${latestBid.bidderId}-${latestBid.amount}-${latestBid.timestamp}`;
    if (processedBidsRef.current.has(bidKey)) {
      return; // Already processed this bid
    }
    processedBidsRef.current.add(bidKey);

    // Update local price immediately
    setLocalPrice(latestBid.currentPrice);

    // Add new bid to local bids list
    const newBid: Bid = {
      id: `temp-${Date.now()}`,
      amount: latestBid.amount,
      bidderId: latestBid.bidderId,
      bidder: {
        id: latestBid.bidderId,
        email: latestBid.bidderName,
        balance: 0,
        createdAt: ''
      },
      auctionItemId: id!,
      createdAt: latestBid.timestamp,
    };

    setLocalBids((prev) => {
      const exists = prev.some(
        (bid) => bid.amount === latestBid.amount && bid.createdAt === latestBid.timestamp
      );
      if (exists) return prev;
      return [newBid, ...prev];
    });

    // Debounce query invalidation - clear existing timeout and set new one
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }
    refetchTimeoutRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['auction', id] });
      refetchTimeoutRef.current = null;
    }, 2000); // Wait 2 seconds before refetching to batch multiple rapid bids

    // Show toast if user was outbid (check against current auction data)
    const isNotOwnBid = latestBid.bidderId !== user?.id;
    const auctionData = queryClient.getQueryData<AuctionItem>(['auction', id]);
    if (isNotOwnBid && auctionData?.bids?.[0]?.bidderId === user?.id) {
      toast({
        title: "You've been outbid!",
        description: `Someone placed a bid of $${latestBid.amount.toLocaleString()}`,
        variant: 'destructive',
      });
    }
  }, [latestBid, id, user, toast, queryClient]);

  // Update price from socket
  useEffect(() => {
    if (socketPrice > 0) {
      setLocalPrice(socketPrice);
    }
  }, [socketPrice]);

  // Log socket status
  useEffect(() => {
    console.log('🎯 AuctionDetail - Socket Status:', {
      isConnected: socketConnected,
      viewerCount,
      socketPrice,
      socketError,
      auctionId: id,
    });
  }, [socketConnected, viewerCount, socketPrice, socketError, id]);

  // Cleanup refs when auction ID changes
  useEffect(() => {
    return () => {
      processedBidsRef.current.clear();
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, [id]);

  // Use socket price if available, otherwise fall back to local or auction price
  const currentPrice = socketPrice || localPrice || parseFloat(auction?.currentPrice || '0') || 0;
  const allBids = [...localBids, ...(auction?.bids ?? [])].slice(0, 20);

  const statusConfig = {
    active: { label: 'Active', className: 'bg-status-active text-white' },
    sold: { label: 'Sold', className: 'bg-status-sold text-white' },
    expired: { label: 'Expired', className: 'bg-status-expired text-white' },
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !auction) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-destructive text-lg">Auction not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/auctions')}>
            Back to Auctions
          </Button>
        </div>
      </Layout>
    );
  }

  const status = statusConfig[auction.status];
  const isEnding = auction.status === 'active' && new Date(auction.endsAt).getTime() - Date.now() < 60000;

  return (
    <Layout>
      <div className="container py-8">
        {/* Back button and connection status */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/auctions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Auctions
          </Button>
          <div className="flex items-center gap-4">
            {viewerCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {viewerCount} watching
              </div>
            )}
            {/* <div className="flex items-center gap-1 text-sm">
              {socketConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Disconnected</span>
                </>
              )}
            </div> */}
            {socketError && (
              <div className="text-xs text-destructive">
                {socketError}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
                alt={auction.title}
                className="w-full h-full object-cover"
              />
              <Badge className={`absolute top-4 right-4 ${isEnding ? 'bg-status-ending text-white animate-pulse' : status?.className}`}>
                {isEnding ? 'Ending Soon!' : status?.label}
              </Badge>
            </div>

            {/* Title and description */}
            <div>
              <h1 className="text-3xl font-bold">{auction.title}</h1>
              <p className="text-muted-foreground mt-3 leading-relaxed">{auction.description}</p>
            </div>

            {/* Creator info */}
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Listed by</p>
                  <p className="font-medium">{auction.creator?.email?.split('@')[0] ?? 'Unknown'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Winner display */}
            {auction.status === 'sold' && auction.winner && (
              <Card className="border-gold bg-gold/5">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Winner</p>
                    <p className="font-medium">{auction.winner.email?.split('@')[0]}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-muted-foreground">Final Price</p>
                    <p className="font-bold text-gold">${auction.currentPrice.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bidding card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Bid</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary animate-price-update" key={currentPrice}>
                    ${currentPrice.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Starting: ${auction?.startingPrice?.toLocaleString()}
                  </p>
                </div>

                {(auction.status === 'active' || auction.status === 'draft') && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Time Remaining</p>
                    <AuctionCountdown endsAt={auction.endsAt} />
                  </div>
                )}

                {id && (
                  <div className="border-t pt-4">
                    <BidForm
                      auctionId={id}
                      currentPrice={Number(currentPrice) || parseFloat(auction.currentPrice) || parseFloat(auction.startingPrice) || 0}
                      isCreator={user?.id === auction.creatorId}
                      isHighestBidder={allBids.length > 0 && allBids[0].bidderId === user?.id}
                      onBidPlaced={() => {
                        // Use refetch instead of invalidate to avoid multiple calls
                        queryClient.refetchQueries({ queryKey: ['auction', id] });
                      }}
                    />
                  </div>
                )}

                {auction.status === 'expired' && (
                  <div className="text-center py-4 text-muted-foreground">
                    This auction ended with no bids
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bid history */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bid History</CardTitle>
              </CardHeader>
              <CardContent>
                <BidHistory bids={allBids} currentUserId={user?.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
