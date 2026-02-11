# Socket Testing Guide

## How to Test Real-Time Bidding Updates

### 1. **Check Socket Connection Status**

#### Visual Indicators:
- Look at the top-right corner of any auction detail page
- You should see:
  - ✅ **Green WiFi icon + "Live"** = Connected
  - ❌ **Gray WiFi icon + "disconnected"** = Not connected
  - 🔄 **"connecting"** = Attempting to connect

#### Browser Console:
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for these messages:
   ```
   🔌 Socket URL: http://192.168.25.78:5000
   ✅ Socket connected
   📡 Joining auction room: [auction-id]
   ```

### 2. **Test Real-Time Bid Updates**

#### Method 1: Two Browser Windows (Recommended)
1. **Window 1**: Open auction detail page (logged in as User A)
2. **Window 2**: Open the same auction page (logged in as User B or incognito)
3. **Window 1**: Place a bid
4. **Window 2**: Should see:
   - Price updates instantly (without page refresh)
   - New bid appears in bid history
   - Price animation plays
   - Console shows: `💰 New bid received: {...}`

#### Method 2: Multiple Devices
1. Open auction on your computer
2. Open same auction on your phone/tablet
3. Place bid from one device
4. Other device should update instantly

### 3. **Check WebSocket Connection in Browser**

#### Chrome/Edge DevTools:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by **WS** (WebSocket)
4. Click on the WebSocket connection
5. You should see:
   - **Status**: 101 Switching Protocols (connected)
   - **Messages** tab showing:
     - `join_auction` events
     - `NEW_BID` events
     - `VIEWER_COUNT` events

#### Firefox DevTools:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by **WS**
4. Click on WebSocket connection
5. Check **Messages** tab for real-time events

### 4. **Verify Socket Server is Running**

#### Check Backend Socket Server:
```bash
# Check if socket server is running on port 5000
curl http://192.168.25.78:5000/socket.io/

# Or check with netstat
netstat -tuln | grep 5000

# Or check with lsof
lsof -i :5000
```

#### Expected Response:
- If socket server is running, you should get a response
- If not running, you'll get connection refused error

### 5. **Test Socket Events Manually**

#### Using Browser Console:
```javascript
// Check if socket is connected
// Open browser console on auction detail page and run:

// Check socket connection
window.socketStatus = 'check'; // This will show in console logs

// Or manually test by checking the socket instance
// (socket is stored in the useSocket hook)
```

### 6. **Common Issues & Solutions**

#### Issue: Socket shows "disconnected"
**Solutions:**
1. Check if socket server is running on port 5000
2. Check firewall settings
3. Verify socket URL in console: `🔌 Socket URL: ...`
4. Check CORS settings on backend

#### Issue: No real-time updates
**Solutions:**
1. Check browser console for errors
2. Verify you're logged in (socket requires auth token)
3. Check Network tab for WebSocket connection
4. Verify auction ID matches in both windows

#### Issue: "Connection refused"
**Solutions:**
1. Start socket server on backend
2. Check if port 5000 is available
3. Verify socket URL matches backend configuration

### 7. **Debug Mode**

The socket implementation includes console logging in development mode:
- ✅ Connection status
- 📡 Room joining
- 💰 New bids received
- 👥 Viewer count updates
- ❌ Disconnections

All logs are prefixed with emojis for easy identification.

### 8. **Quick Test Checklist**

- [ ] Socket shows "Live" status on auction page
- [ ] Console shows "Socket connected" message
- [ ] Console shows "Joining auction room" message
- [ ] Place bid in one window, see update in another
- [ ] Viewer count updates when users join/leave
- [ ] Price animation plays when bid is received
- [ ] Bid form minimum updates when price changes
- [ ] Outbid notification appears when outbid

### 9. **Environment Variables**

Make sure your `.env` file has:
```env
VITE_API_BASE_URL=http://172.16.15.181:3000
VITE_SOCKET_URL=http://172.16.15.181:5000
```

If `VITE_SOCKET_URL` is not set, it will automatically use port 5000 based on your API URL.

### 10. **Network Tab Monitoring**

Watch the Network tab while testing:
1. Open DevTools → Network tab
2. Filter by **WS** (WebSocket)
3. Click on the connection
4. Watch **Messages** tab in real-time
5. You should see bidirectional messages:
   - Outgoing: `join_auction`, `leave_auction`
   - Incoming: `NEW_BID`, `VIEWER_COUNT`, etc.

---

## Need Help?

If socket is not working:
1. Check browser console for errors
2. Check Network tab for WebSocket connection
3. Verify backend socket server is running
4. Check socket URL matches backend configuration
5. Verify authentication token is present

