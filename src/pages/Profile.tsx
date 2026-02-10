import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { usersApi, auctionsApi } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AuctionCard } from '@/components/auctions/AuctionCards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { AuctionCard } from '@/components/auctions/AuctionCard';
import { User, Wallet, Trophy, Gavel, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuctionItem } from '@/types';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: usersApi.getMe,
    enabled: isAuthenticated,
  });

  const { data: myAuctions, isLoading: auctionsLoading } = useQuery({
    queryKey: ['my-auctions'],
    queryFn: () => auctionsApi.list({ limit: 50 }),
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex items-center justify-center py-12">
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const isLoading = profileLoading || auctionsLoading;
  const wonAuctions = profile?.wonAuctions ?? [];
  const createdAuctions = myAuctions?.items.filter((a: AuctionItem) => a.creatorId === user?.id) ?? [];

  return (
    <Layout>
      <div className="container py-8">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user?.email?.split('@')[0]}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={() => { logout(); navigate('/auth'); }}>
            Sign Out
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">${profile?.balance?.toLocaleString() ?? '0'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auctions Won</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{wonAuctions.length}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <Gavel className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auctions Created</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{createdAuctions.length}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="won" className="mt-6">
          <TabsList>
            <TabsTrigger value="won">Won Auctions</TabsTrigger>
            <TabsTrigger value="created">My Auctions</TabsTrigger>
          </TabsList>

          <TabsContent value="won" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : wonAuctions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You haven't won any auctions yet</p>
                  <Link to="/auctions">
                    <Button className="mt-4">Browse Auctions</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wonAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="created" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : createdAuctions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You haven't created any auctions yet</p>
                  <Link to="/auctions/create">
                    <Button className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Create Auction
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {createdAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
