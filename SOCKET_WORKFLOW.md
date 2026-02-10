# Socket Implementation - How It Works

## 🔄 Complete Workflow

### 1. **Page Load & Socket Connection**

```
User opens Auction Detail Page
    ↓
useSocketDebug hook initializes
    ↓
Checks for authentication token
    ↓
Creates Socket.IO connection to backend
    ↓
Socket connects to: http://192.168.25.78:5000
    ↓
Socket emits: join_auction { auctionId: "..." }
    ↓
User sees: ✅ "Live" status indicator
```

**Console Output:**
```
[Socket] 🔌 Socket Configuration: {url: "...", auctionId: "..."}
[Socket] 🚀 useSocket hook initialized
[Socket] 🔄 Attempting to connect...
[Socket] ✅ Socket CONNECTED successfully!
[Socket] 📡 Joining auction room...
```

---

### 2. **Placing a Bid**

```
User fills bid form and clicks "Place Bid"
    ↓
BidForm component calls: auctionsApi.placeBid()
    ↓
HTTP POST request sent to backend API
    ↓
Backend processes bid:
    - Validates bid amount
    - Saves bid to database
    - Updates auction current price
    ↓
Backend emits Socket.IO event: NEW_BID
    ↓
Socket.IO broadcasts to ALL connected clients in auction room
    ↓
Frontend receives NEW_BID event
    ↓
handleNewBid callback executes:
    - Updates local price state
    - Adds bid to local bid history
    - Shows "outbid" notification (if applicable)
    - Invalidates React Query cache
    ↓
UI updates INSTANTLY (no page refresh needed)
```

**Console Output:**
```
💰 NEW_BID event received! {
  auctionId: "...",
  amount: 150,
  bidderName: "user@example.com",
  timestamp: "2024-01-15T10:30:00Z"
}
🎯 Handling new bid event: {...}
```

**Visual Changes:**
- ✅ Price updates with animation
- ✅ Bid appears in bid history
- ✅ Bid form minimum bid updates
- ✅ Toast notification (if outbid)

---

### 3. **Real-Time Updates for Other Users**

```
User A places bid
    ↓
Backend saves bid and emits NEW_BID
    ↓
Socket.IO broadcasts to room
    ↓
User B (on same auction page) receives event
    ↓
User B's page updates automatically:
    - Price changes
    - New bid appears
    - Bid form updates
```

**No page refresh needed!** All users see updates instantly.

---

### 4. **Socket Events Flow**

```
┌─────────────────────────────────────────────────┐
│           Socket.IO Server (Backend)           │
│              Port: 5000                         │
└─────────────────────────────────────────────────┘
                    ↕
         Socket.IO Connection
                    ↕
┌─────────────────────────────────────────────────┐
│         Frontend (useSocketDebug)               │
│                                                  │
│  Events Received:                               │
│  • NEW_BID                                      │
│  • AUCTION_ENDING_SOON                          │
│  • AUCTION_SOLD                                  │
│  • AUCTION_EXPIRED                               │
│  • VIEWER_COUNT                                  │
│                                                  │
│  Events Sent:                                    │
│  • join_auction                                  │
│  • leave_auction                                 │
└─────────────────────────────────────────────────┘
```

---

### 5. **Event Types & What They Do**

#### 📨 **NEW_BID**
- **When:** Someone places a bid
- **What happens:**
  - Price updates instantly
  - Bid added to history
  - Form minimum updates
  - Outbid notification (if applicable)

#### ⏰ **AUCTION_ENDING_SOON**
- **When:** Auction has < 60 seconds remaining
- **What happens:**
  - Toast notification appears
  - Countdown updates

#### 🏆 **AUCTION_SOLD**
- **When:** Auction ends with a winner
- **What happens:**
  - Status changes to "sold"
  - Winner information displayed
  - Bidding disabled

#### ⏸️ **AUCTION_EXPIRED**
- **When:** Auction ends with no bids
- **What happens:**
  - Status changes to "expired"
  - Bidding disabled

#### 👥 **VIEWER_COUNT**
- **When:** Users join/leave auction page
- **What happens:**
  - Viewer count updates
  - Shows "X watching" indicator

---

### 6. **Connection States**

```
disconnected → connecting → connected
     ↑                            ↓
     └──────── disconnect ───────┘
```

**Visual Indicators:**
- 🔴 **disconnected**: Gray WiFi icon + "disconnected"
- 🟡 **connecting**: Gray WiFi icon + "connecting"
- 🟢 **connected**: Green WiFi icon + "Live"

---

### 7. **Error Handling & Reconnection**

```
Connection Lost
    ↓
Socket detects disconnect
    ↓
Automatic reconnection attempt (5 tries)
    ↓
If successful:
    - Rejoins auction room
    - Resumes receiving events
    ↓
If failed:
    - Shows error toast
    - Status: "disconnected"
```

**Console Output:**
```
[Socket] ❌ Socket DISCONNECTED {reason: "transport close"}
[Socket] 🔄 Reconnection attempt {attemptNumber: 1}
[Socket] ✅ Reconnected successfully!
[Socket] 📡 Joining auction room...
```

---

### 8. **Testing the Flow**

#### **Test Scenario 1: Single User**
1. Open auction detail page
2. Check console for connection logs
3. Place a bid
4. See price update instantly
5. Check console for NEW_BID event

#### **Test Scenario 2: Multiple Users**
1. **Window 1**: Open auction page (User A)
2. **Window 2**: Open same auction (User B)
3. **Window 1**: Place bid
4. **Window 2**: Should see instant update
5. **Both consoles**: Show NEW_BID event

#### **Test Scenario 3: Connection Issues**
1. Disconnect internet
2. See "disconnected" status
3. Reconnect internet
4. See automatic reconnection
5. Events resume

---

### 9. **Key Components**

#### **useSocketDebug Hook**
- Manages socket connection
- Handles all socket events
- Provides connection status
- Logs everything for debugging

#### **AuctionDetail Page**
- Uses useSocketDebug hook
- Handles NEW_BID events
- Updates UI in real-time
- Shows connection status

#### **BidForm Component**
- Places bids via API
- Updates when price changes
- Validates bid amounts

---

### 10. **Backend Requirements**

Your backend socket server must:

1. **Listen on port 5000** (or configure VITE_SOCKET_URL)
2. **Handle authentication** via token in auth
3. **Support room joining:**
   ```javascript
   socket.on('join_auction', ({ auctionId }) => {
     socket.join(`auction:${auctionId}`);
   });
   ```
4. **Emit events to room:**
   ```javascript
   io.to(`auction:${auctionId}`).emit('NEW_BID', {
     auctionId,
     amount,
     bidderName,
     timestamp: new Date().toISOString()
   });
   ```

---

### 11. **Debugging Checklist**

✅ **Socket connects?**
- Check console for "✅ Socket CONNECTED"
- Check Network tab → WS filter

✅ **Joins room?**
- Check console for "📡 Joining auction room"
- Verify auctionId is correct

✅ **Receives events?**
- Check console for "💰 NEW_BID event received"
- Verify event data structure

✅ **UI updates?**
- Price changes instantly
- Bid history updates
- Form minimum updates

---

## 🎯 Quick Start

1. **Start your backend socket server** on port 5000
2. **Open auction detail page** in browser
3. **Open browser console** (F12)
4. **Look for connection logs**
5. **Place a bid** and watch console
6. **Open second window** to see real-time updates

---

## 📊 Expected Console Output

```
[Socket 10:30:45 AM] 🔌 Socket Configuration: {...}
[Socket 10:30:45 AM] 🚀 useSocket hook initialized
[Socket 10:30:45 AM] 🔄 Attempting to connect...
[Socket 10:30:46 AM] ✅ Socket CONNECTED successfully!
[Socket 10:30:46 AM] 📡 Joining auction room...
[Socket 10:30:46 AM] 📊 Status changed {status: "connected"}
🎯 AuctionDetail - Socket Status: {status: "connected", isConnected: true}
[Socket 10:31:00 AM] 💰 NEW_BID event received! {...}
🎯 Handling new bid event: {...}
```

That's how the complete socket system works! 🚀

