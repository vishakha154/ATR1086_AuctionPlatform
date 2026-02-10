// User types
export interface User {
  id: string;
  email: string;
  balance: number;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

// Auction types
export type AuctionStatus = 'draft' | 'active' | 'sold' | 'expired';

export interface AuctionItem {
  id: string;
  title: string;
  description: string;
  startingPrice: string;
  currentPrice: string;
  status: AuctionStatus;
  creatorId: string;
  creator?: {
    id: string;
    email: string;
    passwordHash: string;
    balance: string;
    createdAt: string;
  };
  winnerId?: string | null;
  winner?: User;
  endsAt: string;
  createdAt: string;
  bids?: Bid[];
  bidCount?: number;
}

export interface CreateAuctionDto {
  title: string;
  description: string;
  startingPrice: number;
  endsAt: string;
  imageUrl?: string | null;
}

// Bid types
export interface Bid {
  id: string;
  amount: number;
  bidderId: string;
  bidder?: User;
  auctionItemId: string;
  createdAt: string;
}

export interface PlaceBidDto {
  amount: number;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: AuctionStatus;
}

// Socket.IO events
export interface NewBidEvent {
  auctionId: string;
  amount: number;
  bidderName: string;
  timestamp: string;
}

export interface AuctionEndingSoonEvent {
  auctionId: string;
  secondsRemaining: number;
}

export interface AuctionSoldEvent {
  auctionId: string;
  winnerName: string;
  finalPrice: number;
}

export interface AuctionExpiredEvent {
  auctionId: string;
}

export interface ViewerCountEvent {
  auctionId: string;
  count: number;
}

// API Error
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
