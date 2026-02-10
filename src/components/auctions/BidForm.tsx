import { useState, useEffect } from 'react';
import { auctionsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';

interface BidFormProps {
  auctionId: string;
  currentPrice: number;
  onBidPlaced?: () => void;
  isCreator?: boolean;
  isHighestBidder?: boolean;
}

export function BidForm({
  auctionId,
  currentPrice,
  onBidPlaced,
  isCreator = false,
  isHighestBidder = false
}: BidFormProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Ensure currentPrice is a valid number, default to 0 if invalid
  const validCurrentPrice = Number(currentPrice) || 0;
  const minimumBid = validCurrentPrice > 0 ? Math.ceil(validCurrentPrice) + 1 : 1;

  // Update placeholder when current price changes (from socket updates)
  useEffect(() => {
    // If user has entered an amount less than new minimum, clear it
    const currentAmount = parseFloat(amount);
    if (amount && !isNaN(currentAmount) && currentAmount < minimumBid) {
      setAmount('');
    }
  }, [minimumBid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isCreator || isHighestBidder) return;

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
      const response = await auctionsApi.placeBid(auctionId, { amount: bidAmount });
      toast({
        title: 'Bid placed!',
        description: response.message,
      });
      setAmount('');
      onBidPlaced?.();
    } catch (error) {
      // Extract error message from API response
      let errorMessage = 'Failed to place bid';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: 'Bid failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Placing Bid...';
    if (isCreator) return 'Your Auction';
    if (isHighestBidder) return 'Highest Bidder';
    return 'Place Bid';
  };

  const isButtonDisabled = isLoading || isCreator || isHighestBidder;

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
            // placeholder={minimumBid.toString()}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7"
            disabled={isButtonDisabled}
          />
        </div>
        {!isCreator && !isHighestBidder && (
          <p className="text-xs text-muted-foreground">
            Minimum bid: ${minimumBid.toLocaleString()}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isButtonDisabled}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {getButtonText()}
      </Button>
    </form>
  );
}
