import { useState, useEffect } from 'react';
import { auctionsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface BidFormProps {
  auctionId: string;
  currentPrice: number;
  onBidPlaced?: () => void;
}

export function BidForm({ auctionId, currentPrice, onBidPlaced }: BidFormProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const minimumBid = currentPrice + 1;

  // Update placeholder when current price changes (from socket updates)
  useEffect(() => {
    // If user has entered an amount less than new minimum, clear it
    const currentAmount = parseFloat(amount);
    if (amount && !isNaN(currentAmount) && currentAmount < minimumBid) {
      setAmount('');
    }
  }, [minimumBid, amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bidAmount = parseFloat(amount);
    if (isNaN(bidAmount) || bidAmount < minimumBid) {
      toast({
        title: 'Invalid bid amount',
        description: `Bid must be at least $${minimumBid.toLocaleString()}`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await auctionsApi.placeBid(auctionId, { amount: bidAmount });
      toast({
        title: 'Bid placed!',
        description: `Your bid of $${bidAmount.toLocaleString()} has been placed`,
      });
      setAmount('');
      onBidPlaced?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to place bid';
      toast({
        title: 'Bid failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bid-amount">Your Bid</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="bid-amount"
            type="number"
            step="0.01"
            min={minimumBid}
            placeholder={minimumBid.toString()}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7"
            disabled={isLoading}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum bid: ${minimumBid.toLocaleString()}
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Place Bid
      </Button>
    </form>
  );
}
