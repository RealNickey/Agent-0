# Session Management API Documentation

## Overview

The Agent-0 Session Management API provides persistent storage for conversation history, context, and user preferences using Upstash Redis. Sessions automatically expire after 24 hours and are limited to 20 messages for optimal performance.

---

## Quick Start

```typescript
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';

function MyComponent() {
  const {
    sessionId,
    session,
    isSessionReady,
    logMessage,
    updateSessionContext,
    getSessionHistory
  } = useLiveAPIContext();

  // Session is auto-initialized on mount
  useEffect(() => {
    if (isSessionReady) {
      console.log('Session ready:', sessionId);
    }
  }, [isSessionReady, sessionId]);

  // Log a voice interaction
  const handleVoiceInput = async (transcript: string) => {
    await logMessage('user', transcript, 'voice');
  };

  // Update context after movie search
  const handleMovieSearch = async (query: string) => {
    await updateSessionContext({
      lastMovieSearch: query,
      currentTopic: 'Movies'
    });
  };

  return <div>Session ID: {sessionId}</div>;
}
```

---

## API Endpoints

### 1. Create Session

**Endpoint:** `POST /api/session/create`

Creates a new session with optional preferences.

```typescript
// Request
fetch('/api/session/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'optional-custom-id',
    preferences: {
      preferredResponseStyle: 'casual',
      movieGenres: ['sci-fi', 'action']
    }
  })
});

// Response
{
  "success": true,
  "session": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "conversationId": "conv-123",
    "createdAt": 1698765432000,
    "userId": "user_2abc123def"
  }
}
```

**Status Codes:**
- `201` - Session created successfully
- `500` - Server error

---

### 2. Get Session

**Endpoint:** `GET /api/session/:sessionId`

Retrieves a complete session including messages, context, and preferences.

```typescript
// Request
fetch('/api/session/550e8400-e29b-41d4-a716-446655440000');

// Response
{
  "success": true,
  "session": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user_2abc123def",
    "conversationId": "conv-123",
    "createdAt": 1698765432000,
    "lastActivityAt": 1698769032000,
    "messages": [
      {
        "role": "user",
        "content": "Find sci-fi movies",
        "timestamp": 1698765500000,
        "type": "voice",
        "metadata": {
          "audioMetadata": {
            "duration": 2500,
            "vadTriggered": true
          }
        }
      }
    ],
    "context": {
      "currentTopic": "Movies",
      "lastMovieSearch": "Interstellar",
      "voiceSettings": {
        "volume": 0.8,
        "vadSensitivity": 0.5
      }
    },
    "preferences": {
      "preferredResponseStyle": "casual",
      "movieGenres": ["sci-fi"]
    }
  }
}
```

**Status Codes:**
- `200` - Session retrieved
- `404` - Session not found
- `403` - Unauthorized (session belongs to another user)
- `500` - Server error

---

### 3. Add Message

**Endpoint:** `POST /api/session/message`

Adds a message to an existing session. Automatically limits history to 20 messages.

```typescript
// Request
fetch('/api/session/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    role: 'user',
    content: 'Show me movies like Interstellar',
    type: 'voice',
    metadata: {
      audioMetadata: {
        duration: 3200,
        vadTriggered: true
      }
    }
  })
});

// Response
{
  "success": true,
  "messageCount": 5,
  "lastMessage": {
    "role": "user",
    "content": "Show me movies like Interstellar",
    "timestamp": 1698765600000,
    "type": "voice"
  }
}
```

**Parameters:**
- `sessionId` (required) - Session identifier
- `role` (required) - `user`, `assistant`, or `system`
- `content` (required) - Message text content
- `type` (optional) - `voice`, `text`, `tool`, or `system` (default: `text`)
- `metadata` (optional) - Additional metadata object

**Status Codes:**
- `200` - Message added successfully
- `400` - Missing required fields
- `404` - Session not found
- `403` - Unauthorized
- `500` - Server error

---

### 4. Update Session Context

**Endpoint:** `POST /api/session/context`

Updates the session context with new information.

```typescript
// Request
fetch('/api/session/context', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    context: {
      currentTopic: 'Space exploration movies',
      lastMovieSearch: 'Interstellar',
      lastChartGenerated: {
        mark: 'bar',
        encoding: { /* ... */ }
      },
      voiceSettings: {
        volume: 0.9,
        vadSensitivity: 0.6
      }
    }
  })
});

// Response
{
  "success": true,
  "context": {
    "currentTopic": "Space exploration movies",
    "lastMovieSearch": "Interstellar",
    "voiceSettings": {
      "volume": 0.9,
      "vadSensitivity": 0.6
    }
  }
}
```

**Status Codes:**
- `200` - Context updated
- `400` - Missing required fields
- `404` - Session not found
- `403` - Unauthorized
- `500` - Server error

---

### 5. Update Session (Generic)

**Endpoint:** `POST /api/session/:sessionId`

General endpoint to update context, preferences, and metadata.

```typescript
// Request
fetch('/api/session/550e8400-e29b-41d4-a716-446655440000', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    context: {
      currentTopic: 'Action movies'
    },
    preferences: {
      preferredResponseStyle: 'detailed'
    },
    metadata: {
      deviceType: 'desktop'
    }
  })
});

// Response
{
  "success": true,
  "session": { /* updated session */ }
}
```

---

## TypeScript Types

### Core Types

```typescript
type MessageType = 'voice' | 'text' | 'tool' | 'system';

interface SessionMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  type: MessageType;
  metadata?: {
    functionCall?: string;
    toolResponse?: any;
    audioMetadata?: {
      duration?: number;
      vadTriggered?: boolean;
    };
  };
}

interface SessionContext {
  currentTopic?: string;
  lastMovieSearch?: string;
  lastChartGenerated?: any;
  voiceSettings?: {
    volume: number;
    vadSensitivity: number;
  };
  activeTools?: string[];
  conversationSummary?: string;
}

interface SessionPreferences {
  preferredResponseStyle?: 'casual' | 'professional' | 'detailed';
  movieGenres?: string[];
  chartPreferences?: {
    defaultColorScheme?: string;
    preferredChartTypes?: string[];
  };
}

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

---

## Context Hook API

### Available Methods

```typescript
const {
  // Session state
  sessionId: string | null;
  session: AgentSession | null;
  isSessionReady: boolean;

  // Session methods
  initializeSession: () => Promise<string | null>;
  logMessage: (
    role: 'user' | 'assistant' | 'system',
    content: string,
    type?: MessageType,
    metadata?: SessionMessage['metadata']
  ) => Promise<void>;
  updateSessionContext: (context: Partial<SessionContext>) => Promise<void>;
  getSessionHistory: () => SessionMessage[];
} = useLiveAPIContext();
```

### Usage Examples

#### Log Voice Interaction

```typescript
await logMessage(
  'user',
  'Find action movies from 2020',
  'voice',
  {
    audioMetadata: {
      duration: 2800,
      vadTriggered: true
    }
  }
);
```

#### Update Context After Movie Search

```typescript
await updateSessionContext({
  lastMovieSearch: 'Inception',
  currentTopic: 'Christopher Nolan films',
  activeTools: ['tmdb']
});
```

#### Save Chart Preferences

```typescript
await updateSessionContext({
  lastChartGenerated: vegaLiteSpec,
});
```

#### Get Conversation History

```typescript
const messages = getSessionHistory();
console.log(`${messages.length} messages in session`);
```

---

## Error Handling

All API endpoints return consistent error responses:

```typescript
{
  "success": false,
  "error": "Human-readable error message",
  "details": "Technical error details (in development)"
}
```

### Common Error Scenarios

1. **Session Not Found (404)**
   - Session expired (>24 hours old)
   - Invalid session ID
   - Solution: Create new session

2. **Unauthorized (403)**
   - Attempting to access another user's session
   - Solution: Use own session ID

3. **Redis Connection Failed**
   - Automatic fallback to in-memory storage
   - User sees no error, but data won't persist across refreshes

---

## Configuration

### Session Limits

Configured in `src/lib/sessionManager.ts`:

```typescript
const SESSION_TTL = 24 * 60 * 60; // 24 hours
const MAX_MESSAGES_PER_SESSION = 20; // Message history limit
```

### Graceful Degradation

If Redis is unavailable:
- Sessions stored in memory
- Persists within single browser session
- Lost on page refresh
- No user-facing errors

---

## Testing

Run comprehensive tests:

```bash
# Start development server
npm run dev

# In another terminal
node scripts/test-session.js
```

Expected output confirms:
- ✓ Session creation
- ✓ Message logging
- ✓ Context updates
- ✓ Message history limiting (≤20)

---

## Performance

- **Session Retrieval**: <100ms (Upstash Regional)
- **Message Logging**: Non-blocking async
- **Storage**: ~1-5 KB per session
- **TTL Refresh**: Automatic on each update

---

## Security

✅ Clerk authentication integration  
✅ User isolation (can't access other users' sessions)  
✅ TLS encryption in transit  
✅ Data encryption at rest (Upstash)  
✅ Automatic session expiry  
✅ No sensitive data storage  

---

**Version:** 1.0.0  
**Last Updated:** October 18, 2025
