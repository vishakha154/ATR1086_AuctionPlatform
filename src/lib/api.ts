import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  AuctionItem,
  CreateAuctionDto,
  PlaceBidDto,
  Bid,
  PaginatedResponse,
  PaginationParams,
  User,
  ApiError,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.25.78:3000';

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
    const { data } = await api.post<AuthResponse>('/api/v1/auth/login', credentials);
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/api/v1/auth/register', credentials);
    return data;
  },
};

// Auctions API
export const auctionsApi = {
  list: async (params?: PaginationParams): Promise<PaginatedResponse<AuctionItem>> => {
    const { data } = await api.get<PaginatedResponse<AuctionItem>>('/api/v1/auctions', { params });
    return data;
  },

  getById: async (id: string): Promise<AuctionItem> => {
    const { data } = await api.get<AuctionItem>(`/auctions/${id}`);
    return data;
  },

  create: async (auction: CreateAuctionDto): Promise<AuctionItem> => {
    const { data } = await api.post<AuctionItem>('/api/v1/auctions', auction);
    return data;
  },

  placeBid: async (auctionId: string, bid: PlaceBidDto): Promise<Bid> => {
    const { data } = await api.post<Bid>(`/auctions/${auctionId}/bid`, bid);
    return data;
  },

  myAuctions: async (params?: PaginationParams): Promise<PaginatedResponse<AuctionItem>> => {
    const { data } = await api.get<PaginatedResponse<AuctionItem>>('/api/v1/auctions/my-auctions', { params });
    return data;
  },
};

// Users API
export const usersApi = {
  getMe: async (): Promise<User & { wonAuctions?: AuctionItem[] }> => {
    const { data } = await api.get<User & { wonAuctions?: AuctionItem[] }>('/users/me');
    return data;
  },
};

export default api;
