# Testing Checklist - Gemini Connection Fixes

## Prerequisites
- [ ] Node.js installed (v18+)
- [ ] Valid Gemini API key in `.env.local` as `REACT_APP_GEMINI_API_KEY`
- [ ] Optional: Clerk credentials if testing authentication
- [ ] Optional: TMDb API key if testing movie features

## Setup
```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000`

## Connection Stability Tests

### Test 1: Initial Connection
- [ ] Open the dashboard page
- [ ] Check browser console for "Connected" toast notification
- [ ] Verify no immediate disconnection within first 10 seconds
- [ ] Verify no error messages in console
- [ ] **Expected**: Connection establishes and remains stable

### Test 2: Idle Connection Stability
- [ ] Connect to Gemini
- [ ] Leave the page idle for 2 minutes without interaction
- [ ] Check console logs every 30 seconds
- [ ] **Expected**: Connection remains stable, no reconnection attempts
- [ ] **Expected**: No health check ping messages in logs

### Test 3: Active Usage
- [ ] Connect to Gemini
- [ ] Send 3-5 messages in succession
- [ ] Wait for responses to each message
- [ ] **Expected**: All messages sent and responses received
- [ ] **Expected**: No disconnections during active use
- [ ] **Expected**: Toast notifications show connection remains stable

### Test 4: Network Interruption Recovery
- [ ] Connect to Gemini
- [ ] Open browser DevTools → Network tab
- [ ] Set throttling to "Offline" for 3 seconds
- [ ] Set back to "No throttling"
- [ ] **Expected**: Connection attempts to reconnect
- [ ] **Expected**: Reconnection succeeds after network restored
- [ ] **Expected**: No infinite reconnection loops

### Test 5: Intentional Disconnect
- [ ] Connect to Gemini
- [ ] Click disconnect button (if available) or close browser tab
- [ ] Check console logs
- [ ] **Expected**: Clean disconnect with code 1000 or 1001
- [ ] **Expected**: No reconnection attempts after intentional disconnect

### Test 6: Long Session Stability
- [ ] Connect to Gemini
- [ ] Leave connection open for 5+ minutes
- [ ] Send a message after 5 minutes
- [ ] **Expected**: Connection remains active
- [ ] **Expected**: Message is sent successfully
- [ ] **Expected**: No "session validation failed" warnings

## Anonymous User Usage Limits

### Test 7: Usage Tracking
- [ ] Open in incognito/private browsing mode (not signed in)
- [ ] Connect to Gemini
- [ ] Send exactly the limit number of messages (check usage context)
- [ ] **Expected**: After limit reached, login prompt appears
- [ ] **Expected**: No additional messages sent after limit
- [ ] **Expected**: Connection remains stable even when limit reached

### Test 8: Authenticated User
- [ ] Sign in with Clerk authentication
- [ ] Connect to Gemini
- [ ] Send 10+ messages
- [ ] **Expected**: No usage limit enforced
- [ ] **Expected**: All messages sent successfully
- [ ] **Expected**: Connection remains stable

## Performance Tests

### Test 9: Memory Usage
- [ ] Connect to Gemini
- [ ] Open browser DevTools → Performance/Memory tab
- [ ] Record heap snapshot
- [ ] Use application for 5 minutes
- [ ] Take another heap snapshot
- [ ] Disconnect
- [ ] Take final heap snapshot
- [ ] **Expected**: No significant memory leaks
- [ ] **Expected**: Memory returns to baseline after disconnect

### Test 10: CPU Usage
- [ ] Connect to Gemini
- [ ] Monitor CPU usage in browser task manager
- [ ] During idle periods (2+ minutes)
- [ ] **Expected**: CPU usage remains low during idle
- [ ] **Expected**: No high CPU spikes from health check timers

## Error Handling Tests

### Test 11: Invalid API Key
- [ ] Set an invalid API key in `.env.local`
- [ ] Try to connect
- [ ] **Expected**: Clear error message displayed
- [ ] **Expected**: No infinite reconnection loops
- [ ] **Expected**: User informed to check API key

### Test 12: API Rate Limiting
- [ ] Connect and send many messages rapidly (20+ in 10 seconds)
- [ ] **Expected**: Graceful handling of any rate limit errors
- [ ] **Expected**: Connection remains stable or reconnects appropriately
- [ ] **Expected**: User notified if rate limited

## Health Check Verification

### Test 13: Health Check Timing
- [ ] Connect to Gemini
- [ ] Open browser console
- [ ] Filter logs for "health" or "ping"
- [ ] Wait for 2 minutes
- [ ] **Expected**: No active ping messages sent
- [ ] **Expected**: Health checks are passive (monitoring only)
- [ ] **Expected**: Health check interval is approximately 60 seconds

### Test 14: Stale Connection Detection
- [ ] Connect to Gemini
- [ ] Use DevTools to simulate very slow network (2G throttling)
- [ ] Wait for 3+ minutes with no messages
- [ ] **Expected**: Stale connection detected if no activity
- [ ] **Expected**: Session validation runs before reconnecting
- [ ] **Expected**: Appropriate warnings logged

## Integration Tests

### Test 15: TMDb Tool Integration
- [ ] Connect to Gemini
- [ ] Ask about a movie (e.g., "Tell me about Inception")
- [ ] **Expected**: Connection remains stable during tool calls
- [ ] **Expected**: Movie data displayed correctly
- [ ] **Expected**: No disconnections during API calls

### Test 16: Audio Streaming
- [ ] Connect to Gemini
- [ ] Enable microphone (if prompted)
- [ ] Speak a message
- [ ] Listen to response audio
- [ ] **Expected**: Audio input and output work correctly
- [ ] **Expected**: Connection remains stable during audio streaming
- [ ] **Expected**: No audio pipeline errors

## Cross-Browser Testing

### Test 17: Chrome/Edge
- [ ] Run all core tests (1-6) in Chrome/Edge
- [ ] **Expected**: All tests pass

### Test 18: Firefox
- [ ] Run all core tests (1-6) in Firefox
- [ ] **Expected**: All tests pass

### Test 19: Safari (if available)
- [ ] Run all core tests (1-6) in Safari
- [ ] **Expected**: All tests pass or known issues documented

## Console Log Verification

### Test 20: Clean Logs
- [ ] Connect to Gemini
- [ ] Use application normally for 5 minutes
- [ ] Review all console logs
- [ ] **Expected**: No error messages
- [ ] **Expected**: No repeated warning messages
- [ ] **Expected**: Connection state changes logged appropriately

## Post-Testing Checklist

After completing all tests:
- [ ] Document any issues found
- [ ] Note browser/OS versions tested
- [ ] Capture screenshots of any errors
- [ ] Verify all expected behaviors match actual behaviors
- [ ] Report any unexpected disconnections with full context

## Success Criteria

✅ Connection remains stable for 5+ minutes idle  
✅ No immediate disconnections after connection  
✅ Proper reconnection on network interruption  
✅ No reconnection loops on normal disconnects  
✅ Usage limits work correctly for anonymous users  
✅ No memory leaks detected  
✅ Health checks are passive and non-intrusive  
✅ All integrations (TMDb, audio) work with stable connection  

## Notes

- Record timestamps of any disconnections
- Save browser console logs if issues occur
- Note any patterns in disconnection timing
- Check network tab for WebSocket frame details if debugging needed
