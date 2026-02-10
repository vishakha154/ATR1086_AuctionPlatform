import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  AuctionItem,
  CreateAuctionDto,
  PlaceBidDto,
  PlaceBidResponse,
  Bid,
  PaginatedResponse,
  PaginationParams,
  User,
  ApiError,
  UserStatisticsResponse,
  UserProfileResponse,
  MyAuctionsResponse,
  WonAuctionsResponse,
  WinHistoryResponse,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.25.78:3000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login on unauthorized
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', credentials);
    return data;
  },
};

// Auctions API
export const auctionsApi = {
  list: async (params?: PaginationParams): Promise<PaginatedResponse<AuctionItem>> => {
    const { data } = await api.get<PaginatedResponse<AuctionItem>>('/auctions', { params });
    return data;
  },

  getById: async (id: string): Promise<AuctionItem> => {
    const { data } = await api.get<{ message: string; auction: AuctionItem }>(`/auctions/${id}`);
    return data.auction;
  },

  create: async (auction: CreateAuctionDto): Promise<AuctionItem> => {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('title', auction.title);
    formData.append('description', auction.description);
    formData.append('startingPrice', auction.startingPrice.toString());
    formData.append('endsAt', auction.endsAt);

    if (auction.imageUrl) {
      // If imageUrl is a base64 string, convert it to a Blob
      if (auction.imageUrl.startsWith('data:')) {
        const response = await fetch(auction.imageUrl);
        const blob = await response.blob();
        formData.append('image', blob, 'image.jpg');
      } else {
        formData.append('imageUrl', auction.imageUrl);
      }
    }

    const { data } = await api.post<{ message: string; auction: AuctionItem }>('/auctions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.auction;
  },

  placeBid: async (auctionId: string, bid: PlaceBidDto): Promise<PlaceBidResponse> => {
    const { data } = await api.post<PlaceBidResponse>(`/auctions/${auctionId}/bid`, bid);
    return data;
  },

  myAuctions: async (params?: PaginationParams): Promise<PaginatedResponse<AuctionItem>> => {
    const { data } = await api.get<MyAuctionsResponse>('/auctions/my-auctions', { params });
    // Transform the response to match PaginatedResponse format
    return {
      items: data.auctions || [],
      total: data.count || 0,
      page: params?.page || 1,
      limit: params?.limit || 20,
    };
  },

  getAvailable: async (params?: PaginationParams): Promise<PaginatedResponse<AuctionItem>> => {
    const { data } = await api.get<PaginatedResponse<AuctionItem>>('/auctions/available', { params });
    return data;
  },

  getDashboard: async (params?: PaginationParams): Promise<PaginatedResponse<AuctionItem>> => {
    const { data } = await api.get<PaginatedResponse<AuctionItem>>('/auctions/dashboard', { params });
    return data;
  },
};

// Users API
export const usersApi = {
  getMe: async (): Promise<User> => {
    const { data } = await api.get<UserProfileResponse>('/users/me');
    return data.user;
  },
  getStatistics: async (): Promise<UserStatisticsResponse> => {
    const { data } = await api.get<UserStatisticsResponse>('/users/statistics');
    return data;
  },
  getWonAuctions: async (): Promise<WonAuctionsResponse> => {
    const { data } = await api.get<WonAuctionsResponse>('/users/won-auctions');
    return data;
  },
  getWinHistory: async (params?: PaginationParams): Promise<WinHistoryResponse> => {
    const { data } = await api.get<WinHistoryResponse>('/users/win-history', { params });
    return data;
  },
};

export default api;
