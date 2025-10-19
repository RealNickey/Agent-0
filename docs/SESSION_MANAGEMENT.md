# Agent-0 Session Management Setup Guide

## Overview

Agent-0 now includes **Upstash Redis session persistence** that maintains conversation context, voice preferences, and movie search history across browser sessions.

## Features

✅ **Session Persistence** - 24-hour session lifetime with automatic TTL refresh  
✅ **Message History** - Automatically logs voice and text interactions (limited to 20 most recent)  
✅ **Context Preservation** - Saves movie searches, chart preferences, and voice settings  
✅ **User Isolation** - Clerk authentication ensures users can only access their own sessions  
✅ **Graceful Degradation** - Falls back to in-memory storage if Redis is unavailable  

---

## Setup Instructions

### 1. Create Upstash Redis Database

1. Go to [https://console.upstash.com/](https://console.upstash.com/)
2. Sign up or log in
3. Click **"Create Database"**
4. Choose:
   - **Type**: Regional (for lower latency) or Global (for multi-region)
   - **Region**: Select closest to your deployment
   - **Name**: `agent0-sessions` (or your preferred name)
5. Click **"Create"**

### 2. Get Redis Credentials

From your Upstash database dashboard:

1. Click on your database name
2. Scroll to **"REST API"** section
3. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Configure Environment Variables

Add to your `.env.local` file:

```bash
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL='https://your-endpoint.upstash.io'
UPSTASH_REDIS_REST_TOKEN='your-token-here'

# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET='your-random-secret-here'
```

### 4. Install Dependencies

Dependencies are already installed if you ran `npm install` after pulling this branch:

```bash
npm install @upstash/redis uuid
npm install -D @types/uuid
```

### 5. Test the Setup

Run the test script to verify everything works:

```bash
node scripts/test-session.js
```

Expected output:
```
═══════════════════════════════════════
  Agent-0 Session Management Tests
═══════════════════════════════════════

🧪 Test 1: Create Session
✓ Session created: abc-123-def-456

🧪 Test 2: Add user message
✓ Message added (total: 1)

...
✓ All tests completed!
```

---

## API Reference

### Session Endpoints

#### `POST /api/session/create`

Create a new session.

**Request:**
```json
{
  "conversationId": "optional-id",
  "preferences": {
    "preferredResponseStyle": "casual",
    "movieGenres": ["sci-fi", "action"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "abc-123",
    "conversationId": "xyz-789",
    "createdAt": 1698765432000,
    "userId": "user_xxx"
  }
}
```

#### `GET /api/session/:sessionId`

Retrieve a session by ID.

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "abc-123",
    "messages": [...],
    "context": {...},
    "preferences": {...}
  }
}
```

#### `POST /api/session/message`

Add a message to a session.

**Request:**
```json
{
  "sessionId": "abc-123",
  "role": "user",
  "content": "Find me sci-fi movies",
  "type": "voice",
  "metadata": {
    "audioMetadata": {
      "duration": 2500,
      "vadTriggered": true
    }
  }
}
```

#### `POST /api/session/context`

Update session context.

**Request:**
```json
{
  "sessionId": "abc-123",
  "context": {
    "lastMovieSearch": "Interstellar",
    "currentTopic": "Space movies",
    "voiceSettings": {
      "volume": 0.8,
      "vadSensitivity": 0.5
    }
  }
}
```

---

## Integration with Existing Features

### Automatic Session Initialization

Sessions are automatically created when the LiveAPIProvider mounts:

```tsx
// In your dashboard or main app component
<LiveAPIProvider options={apiOptions}>
  {/* Your app */}
</LiveAPIProvider>
```

### Logging Voice Interactions

The `LiveAPIContext` now includes session methods:

```tsx
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';

function MyComponent() {
  const { logMessage, updateSessionContext } = useLiveAPIContext();

  const handleVoiceInput = async (transcript: string) => {
    await logMessage('user', transcript, 'voice', {
      audioMetadata: { duration: 3000, vadTriggered: true }
    });
  };

  const handleMovieSearch = async (query: string) => {
    await updateSessionContext({
      lastMovieSearch: query,
      currentTopic: 'Movies'
    });
  };
}
```

### Accessing Session History

```tsx
const { getSessionHistory, session } = useLiveAPIContext();

// Get all messages
const messages = getSessionHistory();

// Access current session data
console.log(session?.context.lastMovieSearch);
```

---

## Session Data Structure

```typescript
interface AgentSession {
  sessionId: string;
  userId?: string;
  conversationId: string;
  createdAt: number;
  lastActivityAt: number;
  messages: SessionMessage[];
  context: SessionContext;
  preferences: SessionPreferences;
  metadata: {
    userAgent?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
  };
}
```

### Message Types

- `voice` - Voice interactions via Live API
- `text` - Text-based chat
- `tool` - Tool/function call results
- `system` - System messages

### Context Fields

- `currentTopic` - Current conversation topic
- `lastMovieSearch` - Last TMDb search query
- `lastChartGenerated` - Last Vega-Lite chart spec
- `voiceSettings` - Volume and VAD sensitivity
- `activeTools` - Currently active tool names

---

## Configuration Options

### Session TTL

Default: 24 hours. Modify in `src/lib/sessionManager.ts`:

```typescript
const SESSION_TTL = 24 * 60 * 60; // seconds
```

### Message History Limit

Default: 20 messages. Modify in `src/lib/sessionManager.ts`:

```typescript
const MAX_MESSAGES_PER_SESSION = 20;
```

---

## Troubleshooting

### Session Not Persisting

1. **Check Redis Connection**
   ```bash
   node -e "require('./src/lib/redis.ts').testRedisConnection().then(console.log)"
   ```

2. **Verify Environment Variables**
   ```bash
   echo $UPSTASH_REDIS_REST_URL
   echo $UPSTASH_REDIS_REST_TOKEN
   ```

3. **Check Browser Console**
   - Open DevTools → Application → Local Storage
   - Look for `agent0_session_id` key

### Session Returns 404

- Session may have expired (>24 hours old)
- Clear localStorage: `localStorage.removeItem('agent0_session_id')`
- Refresh page to create new session

### Redis Connection Errors

If Redis is down, Agent-0 automatically falls back to in-memory storage:
- Sessions work for single browser session
- Lost on page refresh
- No error shown to user

---

## Security Considerations

✅ **User Isolation** - Sessions are tied to Clerk userId  
✅ **Session Validation** - All API routes verify session ownership  
✅ **Data Encryption** - Upstash Redis uses TLS encryption at rest and in transit  
✅ **TTL Management** - Sessions auto-expire after 24 hours  
✅ **No Sensitive Data** - Avoid storing passwords or payment info in sessions  

---

## Performance Notes

- **Session Retrieval**: <100ms with Upstash Regional
- **Message Logging**: Non-blocking (fire-and-forget pattern)
- **History Limiting**: Automatic cleanup keeps Redis storage lean
- **Caching**: Consider adding client-side caching for frequent reads

---

## Next Steps

1. ✅ Test session creation and retrieval
2. ✅ Verify browser refresh preserves conversation
3. ✅ Check voice interaction logging
4. ⏭️ Deploy to production with Upstash Redis
5. ⏭️ Monitor session metrics in Upstash dashboard

## Support

For issues or questions:
- Check [Upstash Redis Docs](https://docs.upstash.com/redis)
- Review `scripts/test-session.js` for examples
- Check browser console for client-side errors
- Review server logs for API errors

---

**Last Updated**: October 18, 2025  
**Version**: 1.0.0
