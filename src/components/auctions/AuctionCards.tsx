import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuctionCountdown } from './AuctionCountdown';
import { ImageIcon, Users } from 'lucide-react';
import type { AuctionItem } from '@/types';

interface AuctionCardProps {
  auction: AuctionItem;
  viewMode?: 'grid' | 'list';
}

export function AuctionCard({ auction, viewMode = 'grid' }: AuctionCardProps) {
  const statusConfig = {
    active: { label: 'Active', className: 'bg-status-active text-white' },
    sold: { label: 'Sold', className: 'bg-status-sold text-white' },
    expired: { label: 'Expired', className: 'bg-status-expired text-white' },
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  };

  const status = statusConfig[auction.status];
  const isEnding = auction.status === 'active' && new Date(auction.endsAt).getTime() - Date.now() < 60000;

  if (viewMode === 'list') {
    return (
      <Link to={`/auctions/${auction.id}`}>
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-muted flex items-center justify-center flex-shrink-0 rounded-l-lg overflow-hidden">
              <img
                src={
                  (auction.imageUrl && typeof auction.imageUrl === 'string' && auction.imageUrl.startsWith('http'))
                    ? auction.imageUrl
                    : `https://loremflickr.com/600/400/abstract?lock=${auction.id}`
                }
                alt={auction.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg line-clamp-1">{auction.title}</h3>
                  <Badge className={isEnding ? 'bg-status-ending text-white animate-pulse' : status?.className}>
                    {isEnding ? 'Ending Soon' : status?.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{auction.description}</p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Current Price</p>
                  <p className="text-xl font-bold text-primary">${parseFloat(auction?.currentPrice ?? '0')?.toLocaleString()}</p>
                </div>
                {auction.status === 'active' && (
                  <AuctionCountdown endsAt={auction.endsAt} compact />
                )}
                {auction.bidCount !== undefined && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {auction.bidCount} bids
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/auctions/${auction.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow flex flex-col">
        <CardHeader className="p-0">
          <div className="aspect-video bg-muted flex items-center justify-center rounded-t-lg relative overflow-hidden">
            <img
              src={
                (auction.imageUrl && typeof auction.imageUrl === 'string' && auction.imageUrl.startsWith('http'))
                  ? auction.imageUrl
                  : `https://loremflickr.com/600/400/abstract?lock=${auction.id}`
              }
              alt={auction.title}
              className="w-full h-full object-cover"
            />
            <Badge className={`absolute top-2 right-2 ${isEnding ? 'bg-status-ending text-white animate-pulse' : status?.className}`}>
              {isEnding ? 'Ending Soon' : status?.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1">
          <h3 className="font-semibold line-clamp-1">{auction.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{auction?.description}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
          <div className="w-full flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Current Price</p>
              <p className="text-lg font-bold text-primary">${parseFloat(auction?.currentPrice ?? '0')?.toLocaleString()}</p>
            </div>
            {auction.bidCount !== undefined && (
              <span className="text-sm text-muted-foreground">{auction.bidCount} bids</span>
            )}
          </div>
          {auction.status === 'active' && (
            <AuctionCountdown endsAt={auction.endsAt} compact />
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
