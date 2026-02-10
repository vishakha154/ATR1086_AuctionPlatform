import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gavel, ArrowRight, Users, Clock, Shield } from 'lucide-react';

export default function Index() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Gavel className="h-4 w-4" />
            Real-Time Auction Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Bid Live. Win Big.
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the thrill of real-time auctions. Create listings, place bids, and watch prices update instantly with our WebSocket-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auctions')} className="gap-2">
              Browse Auctions
              <ArrowRight className="h-4 w-4" />
            </Button>
            {!isAuthenticated && (
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Why LiveBid?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-Time Updates</h3>
                <p className="text-muted-foreground">
                  See bids appear instantly with our WebSocket technology. Never miss a moment in the auction.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Bidding</h3>
                <p className="text-muted-foreground">
                  Your bids are protected with balance escrow and concurrent bid handling. Fair and transparent.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Live Community</h3>
                <p className="text-muted-foreground">
                  See how many people are watching each auction. Compete with bidders from around the world.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Bidding?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of users already using LiveBid to buy and sell through live auctions.
          </p>
          <Link to={isAuthenticated ? '/auctions/create' : '/auth'}>
            <Button size="lg" className="gap-2">
              {isAuthenticated ? 'Create Your First Auction' : 'Sign Up Now'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
