import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { auctionsApi } from '../lib/api';
import { Layout } from '../components/layout/Layout';
import { AuctionCard } from '../components/auctions/AuctionCards';
import { AuctionCardSkeleton } from '../components/auctions/AuctionCardSkeleton';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Grid3X3, List, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AuctionStatus } from '../types';

export default function AuctionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AuctionStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const limit = 12;

  const { data, isLoading, error } = useQuery({
    queryKey: ['auctions', page, status],
    queryFn: () => auctionsApi.list({
      page,
      limit,
      status: status as AuctionStatus,
      // image: imageUrl,
      // ...(status !== 'all' && { status }),
    }),
  });

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Auctions</h1>
            <p className="text-muted-foreground mt-1">Browse and bid on live auctions</p>
          </div>
          <Link to="/auctions/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Auction
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Tabs value={status} onValueChange={(v) => { setStatus(v as AuctionStatus | 'all'); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="sold">Sold</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 sm:ml-auto">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Auctions Grid/List */}
        {isLoading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'flex flex-col gap-4'
          }>
            {Array.from({ length: 8 }).map((_, i) => (
              <AuctionCardSkeleton key={i} viewMode={viewMode} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load auctions. Please try again.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No auctions found</p>
            <Link to="/auctions/create">
              <Button className="mt-4">Create the first auction</Button>
            </Link>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'flex flex-col gap-4'
          }>
            {data?.items.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && Math.ceil(data.total / data.limit) > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(data.total / data.limit)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(Math.ceil(data.total / data.limit), p + 1))}
              disabled={page === Math.ceil(data.total / data.limit)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
