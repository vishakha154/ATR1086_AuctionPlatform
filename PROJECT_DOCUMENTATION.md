# Auction Bidding Platform - Integration Documentation

## 1. Project Overview
The **Auction Bidding Platform** is a real-time web application designed for creating, viewing, and bidding on items in live auctions. It features a modern, responsive interface with real-time updates for bid increments, auction statuses, and viewer counts.

### Core Functionalities
- **User Authentication**: Secure Login and Registration with JWT-based sessions.
- **Live Auctions**: Real-time bidding engine powered by WebSockets.
- **Auction Management**: Create new auctions with image uploads and expiry timers.
- **User Dashboard**: Overview of user statistics, balance, and bidding history.
- **Real-time Notifications**: Instant updates for new bids, outbidding, and auction results.

---

## 2. Module & Feature Explanation

### Authentication Module
- **Registration/Login**: Handles user entry. Stores a JWT in `localStorage` for persistent sessions.
- **Protected Routes**: Ensures only authenticated users can access bidding and profile features.

### Auctions Module
- **Auction Listing**: Paginated view of active, coming, and dashboard-featured auctions.
- **Auction Detail**: Comprehensive view of a single item, current high bidder, and countdown timer.
- **Creation**: Form to list new items, supporting `multipart/form-data` for image uploads.

### Bidding Module
- **Real-time Engine**: Uses Socket.io to synchronize bids across all connected clients.
- **Bid Validation**: Prevents bidding below the minimum increment or on expired auctions.

### Profile Module
- **Statistics**: Shows total auctions won, active bids, and current balance.
- **Activity Log**: Lists history of won auctions and participation.

---

## 3. Integration Process & API Flow

### Authentication Flow (REST)
1.  **Frontend**: User submits credentials via `Auth.tsx`.
2.  **API**: `authApi.login()` sends a `POST /auth/login` request.
3.  **Backend**: Validates credentials and returns a `JWT` token.
4.  **Frontend**: Stores token in `localStorage` and initializes `api` (Axios) headers.

### Bidding Process (REST + WebSocket)
1.  **Subscription**: On `AuctionDetail.tsx` load, `useSocket` emits `join_auction { auctionId }`.
2.  **Action**: User submits bid via `BidForm.tsx` calling `auctionsApi.placeBid()`.
3.  **Backend Processing**:
    - Validates bid price.
    - Saves to Database.
    - Emits `NEW_BID` event to the auction room.
4.  **Live Update**: Frontend receives `NEW_BID` via `useSocket`, updates local state, and triggers UI animations without refreshing.

---

## 4. Technologies & Frameworks

### Frontend
- **Framework**: React 18 with TypeScript.
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS + Shadcn UI (Radix UI primitives).
- **State Management**: TanStack Query (React Query) for server state.
- **Communication**: Axios (REST) & Socket.io-client (Real-time).
- **Forms**: React Hook Form + Zod (Validation).

### Backend (Inferred from Frontend implementation)
- **Engine**: Likely NestJS or Node.js.
- **Communication**: Socket.io Server for event broadcasting.
- **Storage**: PostgreSQL/MySQL (Database) and Redis (Broadcasting/Caching).

---

## 5. Folder & File Structure

```text
frontend/
├── src/
│   ├── components/       # Reusable UI (auctions, ui, layout)
│   ├── contexts/         # React Contexts (e.g., Theme)
│   ├── hooks/            # Custom hooks (useSocket, useAuth)
│   ├── lib/              # Utils and API configuration (api.ts)
│   ├── pages/            # View components (Auth, Auctions, Profile)
│   ├── types/            # TypeScript interfaces and definitions
│   ├── App.tsx           # Router and Provider configuration
│   └── main.tsx          # Application entry point
├── public/               # Static assets
└── types/                # Global type declarations
```

---

## 6. Key Functions & Logic

### `api.ts` (REST Implementation)
- **`api.interceptors.request`**: Automatically attaches the JWT token from `localStorage` to every outgoing request.
- **`auctionsApi.create`**: Handles complex `FormData` creation for image uploads.
- **`auctionsApi.placeBid`**: The core endpoint for bidding interaction.

### `useSocket.ts` (Real-time Implementation)
- **`connect()`**: Establishes a WebSocket connection with the `token` for authentication.
- **`join_auction`**: Emits a room-join event so the server sends updates only for that specific auction.
- **Event Listeners**: Handles `NEW_BID`, `AUCTION_SOLD`, and `VIEWER_COUNT` to update the UI reactively.

---

## 7. Environment Setup

Required `.env` variables for the frontend:
```env
VITE_API_BASE_URL=http://172.16.15.181:3000/api/v1
VITE_SOCKET_URL=http://172.16.15.181:5000
```

> [!IMPORTANT]
> When deploying to **Vercel**, make sure to set these variables in the **Vercel Dashboard** (Settings -> Environment Variables). The codebase is configured to fallback to `localhost` in development but requires these for production.

---

## 8. API Reference Examples

### Auth API Reference
- **POST `/auth/forgot-password`**: Request an OTP for password reset.
- **POST `/auth/verify-otp`**: Verify the 6-digit OTP sent via email.
- **POST `/auth/reset-password`**: Reset password using email, OTP, and new password.

### POST `/auctions/:id/bid`
**Payload:**
```json
{
  "amount": 1500
}
```
**Response (200 OK):**
```json
{
  "message": "Bid placed successfully",
  "bid": {
    "id": "uuid",
    "amount": 1500,
    "bidderName": "Jane Doe",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Socket Event: `NEW_BID`
**Event Data:**
```json
{
  "auctionId": "...",
  "amount": 1500,
  "bidderName": "Jane Doe",
  "timestamp": "..."
}
```

---

## 9. Handling Errors, Validations, and Security

- **Axios Interceptors**: Globally handles `401 Unauthorized` by clearing local storage and redirecting to the login page.
- **Zod Validation**: All forms (Login, Create Auction, Bidding) are validated on the client-side before submission.
- **Socket Reconnection**: `useSocket` implements a retry logic (5 attempts) with status reporting (`connecting`, `connected`, `disconnected`).
- **JWT Security**: Authentication is stateless; the server verifies the signature on every protected request.
