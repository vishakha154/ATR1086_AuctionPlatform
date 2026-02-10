import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Bid } from '@/types';

interface BidHistoryProps {
  bids: Bid[];
  currentUserId?: string;
}

export function BidHistory({ bids, currentUserId }: BidHistoryProps) {
  if (bids.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No bids yet. Be the first!
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {bids.map((bid, index) => (
        <div
          key={bid.id}
          className={cn(
            "flex items-center justify-between py-2 px-3 rounded-md transition-colors",
            index === 0 && "animate-bid-flash bg-success/5",
            bid.bidderId === currentUserId && "bg-primary/5 border border-primary/20"
          )}
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {bid.bidder?.email?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-sm font-medium">
                {bid.bidder?.email?.split('@')[0] ?? 'Anonymous'}
                {bid.bidderId === currentUserId && (
                  <span className="ml-1 text-xs text-primary">(You)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <p className="font-semibold">${bid.amount.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
