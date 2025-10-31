# Anonymous Usage Implementation

## Overview

Agent-0 now supports anonymous usage similar to ChatGPT. Users can access and interact with the AI assistant without requiring authentication, but are subject to usage limits. When the limit is reached, users are prompted to sign in for unlimited access.

## Features

### Anonymous Access
- Users can immediately access the application without signing in
- No forced authentication on the landing page
- All features available to authenticated users work for anonymous users (within limits)

### Usage Tracking
- **Message Limit**: Anonymous users get **10 free messages** per browser session
- **Storage**: Usage data stored in browser's local storage
- **Persistence**: Usage counts persist across page refreshes
- **Session ID**: Each anonymous session gets a unique identifier

### Login Prompts
Users are prompted to sign in when:
1. They reach the 10-message limit
2. They attempt to send a message after reaching the limit

### Visual Indicators
- **Left Panel**: Shows usage progress bar for anonymous users
  - Green: 0-49% usage
  - Yellow: 50-79% usage
  - Red: 80-100% usage
- **Modal Dialog**: Appears when limit is reached with benefits of signing in

## Implementation Details

### Files Created

#### 1. `src/lib/usage-tracker.ts`
Core usage tracking utilities:
- `getUsageData()`: Retrieve current usage from localStorage
- `saveUsageData()`: Save usage data to localStorage
- `incrementMessageCount()`: Increment and save message count
- `hasReachedLimit()`: Check if user has reached the limit
- `getRemainingMessages()`: Get number of messages remaining
- `resetUsageData()`: Clear usage data (called after login)
- `getUsagePercentage()`: Calculate usage percentage for UI display

**Configuration**:
```typescript
const ANONYMOUS_MESSAGE_LIMIT = 10; // Change this to adjust the limit
```

#### 2. `src/contexts/UsageContext.tsx`
React context providing usage state throughout the app:
- Integrates with Clerk to detect anonymous vs. authenticated users
- Provides usage statistics and control methods
- Automatically resets usage data when user signs in
- Manages login prompt visibility state

**Exported Hook**: `useUsage()`

#### 3. `src/components/login-prompt/LoginPromptModal.tsx`
Modal dialog displayed when usage limit is reached:
- Lists benefits of signing in (unlimited messages, history, personalization, priority access)
- Uses Clerk's `openSignIn()` method to trigger authentication
- Allows users to dismiss and continue later (but can't send more messages)

### Files Modified

#### 1. `app/page.tsx`
**Before**: Required authentication, showed sign-in form
**After**: Redirects all users (authenticated or not) to `/dashboard`

```tsx
// Old code removed:
// if (isSignedIn) router.replace("/dashboard");
// <SignedOut><SignIn /></SignedOut>

// New behavior:
router.replace("/dashboard"); // Works for all users
```

#### 2. `app/providers.tsx`
Added `UsageProvider` wrapper:
```tsx
<ClerkProvider>
  <UsageProvider>
    {children}
  </UsageProvider>
</ClerkProvider>
```

#### 3. `src/contexts/LiveAPIContext.tsx`
Enhanced to track and enforce usage limits:
- Listens to `content` events to track user messages
- Wraps `client.send()` to check usage before sending
- Shows login modal automatically when limit reached
- Renders `LoginPromptModal` as part of the provider

#### 4. `src/components/side-panel/LeftPanel.tsx`
Added usage indicator section for anonymous users:
- Displays message count (e.g., "7 of 10 remaining")
- Shows visual progress bar with color coding
- Provides "Sign in for unlimited access" button
- Only visible when panel is expanded and user is anonymous

## User Flow

### Anonymous User Journey
1. User visits the application
2. Automatically redirected to `/dashboard`
3. Can start using the AI assistant immediately
4. See usage indicator in left panel (if expanded)
5. After 10 messages, prompted to sign in
6. Can dismiss prompt but cannot send more messages until signed in

### Authenticated User Journey
1. User signs in via Clerk
2. Usage data is reset/cleared
3. No usage limits or indicators shown
4. Full unlimited access to all features

## Authentication Integration

### Clerk Integration
The implementation works seamlessly with Clerk:
- **ClerkProvider** remains wrapping the app
- `useUser()` hook detects authentication state
- `openSignIn()` method opens Clerk's sign-in modal
- `useAuth()` hook available throughout the app
- Middleware still works for protected routes (if configured)

### Optional Clerk
If Clerk keys are not configured:
- Middleware bypasses (see `middleware.ts`)
- App treats all users as "anonymous"
- Usage limits still apply
- Sign-in button won't work (graceful degradation)

## Configuration

### Adjusting the Message Limit

Edit `src/lib/usage-tracker.ts`:
```typescript
const ANONYMOUS_MESSAGE_LIMIT = 10; // Change to desired limit
```

### Changing Limit Behavior

The usage tracking approach can be modified:
- **Current**: Message-based (each user message counts)
- **Alternatives**: 
  - Time-based (e.g., 1 hour of usage)
  - Token-based (count AI response tokens)
  - API call-based (count all API requests)

To implement alternatives, modify:
1. `src/lib/usage-tracker.ts` - Storage and calculation logic
2. `src/contexts/LiveAPIContext.tsx` - Tracking trigger points

### Disabling Anonymous Access

To require authentication again:
1. Revert changes to `app/page.tsx`
2. Restore the `useAuth()` redirect logic
3. Keep or remove usage tracking (optional)

## Testing

### Test Anonymous Usage
1. Open browser in incognito/private mode
2. Visit the application
3. Send messages and observe usage counter
4. Verify modal appears at message 10
5. Check that sending more messages is blocked

### Test Authentication
1. Click "Sign in" button
2. Complete Clerk sign-in flow
3. Verify usage counter disappears
4. Verify no message limits enforced
5. Test sign-out returns to anonymous state

### Test Persistence
1. Send several messages as anonymous user
2. Refresh the page
3. Verify usage count persists
4. Continue until limit is reached

### Test Edge Cases
- Try to send message exactly at the limit
- Dismiss modal and try to send again
- Sign in after reaching limit
- Multiple browser tabs (same session)
- Clear local storage and verify reset

## API Routes

The current implementation does NOT add rate limiting to API routes. The movie API routes (`app/api/movies/*`) remain unchanged and accessible to all users.

### Recommended Enhancements
For production, consider:
1. **Rate limiting middleware** for API routes
2. **IP-based throttling** for anonymous requests
3. **Higher limits for authenticated users**
4. **Server-side usage tracking** (more secure than localStorage)

Example rate limiting approach:
```typescript
// app/api/movies/route.ts
import { rateLimit } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  const { userId } = auth();
  
  if (!userId) {
    // Apply stricter limits to anonymous users
    const limited = await rateLimit(req, { max: 10, window: '1h' });
    if (limited) {
      return new Response('Rate limit exceeded', { status: 429 });
    }
  }
  
  // Continue with normal logic...
}
```

## Security Considerations

### Current Limitations
1. **Client-side tracking**: Usage data stored in localStorage can be cleared by user
2. **No server enforcement**: Backend doesn't validate usage limits
3. **No identity verification**: Anonymous users can create infinite "sessions"

### Mitigation Strategies
1. **Fingerprinting**: Track by browser fingerprint (more persistent than localStorage)
2. **IP throttling**: Combine with server-side rate limiting by IP
3. **Captcha**: Add captcha challenges for anonymous users
4. **Cookie-based tracking**: Use HTTP-only cookies (harder to clear)

### Acceptable for MVP
The current localStorage approach is sufficient for:
- Reducing abuse from casual users
- Encouraging sign-ups
- Providing smooth anonymous experience
- MVP/demo environments

## Benefits

### For Users
- **Instant access**: No sign-up friction
- **Try before commit**: Test the AI assistant before creating account
- **Privacy**: Can explore features anonymously
- **Clear limits**: Transparent about free tier restrictions

### For Developers
- **Higher conversion**: Users can try before signing up
- **Reduced bounce**: No authentication wall
- **Gradual engagement**: Build trust before asking for commitment
- **Familiar pattern**: Similar to ChatGPT, Claude, etc.

## Future Enhancements

### Potential Improvements
1. **Progressive limits**: Different limits for different features
2. **Time-based reset**: Reset message count daily or weekly
3. **Earned credits**: Watch tutorial = extra messages
4. **Referral system**: Share to get more free messages
5. **A/B testing**: Experiment with different limit values
6. **Analytics integration**: Track conversion rates from anonymous → authenticated
7. **Server-side tracking**: More secure usage enforcement
8. **Grace period**: Allow 1-2 extra messages with warning

### Telemetry Questions
- What percentage of users hit the limit?
- How many convert to authenticated after hitting limit?
- Average messages before sign-up?
- Optimal limit value for conversion?

## Troubleshooting

### Issue: Usage counter doesn't update
- Check browser console for errors
- Verify `UsageProvider` is wrapping the app
- Ensure `useUsage()` hook is called within provider

### Issue: Modal doesn't appear at limit
- Check `showLoginPrompt` state in `UsageContext`
- Verify `trackMessage()` is being called
- Check console for errors in `LiveAPIContext`

### Issue: Clerk sign-in doesn't work
- Verify Clerk keys in `.env.local`
- Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_`
- Ensure `ClerkProvider` is wrapping the app

### Issue: Usage persists after sign-in
- Verify `resetUsageData()` is called in `UsageContext`
- Check `isAnonymous` returns false for authenticated users
- Clear browser's localStorage manually to test

## Related Files

- `middleware.ts` - Clerk middleware configuration
- `app/layout.tsx` - Root layout with providers
- `app/dashboard/page.tsx` - Main application page
- `.github/copilot-instructions.md` - Project conventions

## Summary

The anonymous usage implementation provides a smooth onboarding experience while encouraging users to sign up for unlimited access. The system is:

- **Simple**: Easy to understand and maintain
- **Flexible**: Easy to adjust limits and behavior
- **Scalable**: Can be enhanced with server-side enforcement
- **User-friendly**: Clear feedback and transparent limits
- **Conversion-focused**: Encourages sign-ups at the right moment
