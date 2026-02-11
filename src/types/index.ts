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
  confirmPassword: string;
}

export interface ForgotPasswordCredentials {
  email: string;
}

export interface VerifyOtpCredentials {
  email: string;
  otp: string;
}

export interface ResetPasswordCredentials {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserStatistics {
  balance: number;
  auctionsWon: number;
  auctionsCreated: number;
}

export interface UserStatisticsResponse {
  message: string;
  statistics: UserStatistics;
  timestamp?: string;
}

export interface UserProfileResponse {
  message: string;
  user: User;
}

// Win types
export interface Win {
  id: string;
  auctionId: string;
  finalPrice: number;
  endedAt: string;
  createdAt: string;
  auction: AuctionItem;
}

export interface WonAuctionsResponse {
  message: string;
  wins: Win[];
  count: number;
  timestamp: string;
}

export interface WinHistoryResponse {
  message: string;
  wins: Win[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  timestamp: string;
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
    passwordHash?: string;
    balance?: string;
    createdAt?: string;
  };
  winnerId?: string | null;
  winner?: User;
  endsAt: string;
  createdAt: string;
  bids?: Bid[];
  bidCount?: number;
  imageUrl?: string;
  timeRemaining?: {
    milliseconds: number;
    hours: number;
    minutes: number;
    formatted: string;
  };
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

export interface PlaceBidResponse {
  message: string;
  bid: {
    id: string;
    amount: number;
    auctionItemId: string;
    createdAt: string;
  };
  auction: {
    id: string;
    title: string;
    currentPrice: number;
    endsAt: string;
  };
  bidderBalance: number;
  isHighestBid: boolean;
  previousHighestBid?: {
    amount: number;
    bidderId: string;
  };
  timestamp: string;
}

// Pagination
export interface PaginatedResponse<T> {
  message?: string;
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  hasMore?: boolean;
  timestamp?: string;
}

// My Auctions Response (different format from standard pagination)
export interface MyAuctionsResponse {
  message: string;
  auctions: AuctionItem[];
  count: number;
  timestamp: string;
}

// Legacy Won Auctions Response (for backward compatibility)
export interface WonAuctionsResponseLegacy {
  message: string;
  auctions: AuctionItem[];
  count: number;
  timestamp: string;
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
  bidderId: string;
  currentPrice: number;
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
  timestamp: string;
}

export interface AuctionExpiredEvent {
  auctionId: string;
}

export interface ViewerCountEvent {
  auctionId: string;
  count: number;
}

export interface AuctionWonEvent {
  message: string;
  auctionTitle: string;
  finalPrice: number;
  auctionId: string;
  winnerName?: string;
  timestamp: string;
}

export interface AuctionPriceUpdatedEvent {
  auctionId: string;
  newPrice: number;
}

// API Error
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
