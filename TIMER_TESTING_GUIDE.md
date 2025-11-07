# Timer Tool Testing Guide

## Overview
The Arc Countdown timer tool has been successfully integrated into the assistant. This guide explains how to test and verify the implementation.

## Quick Start

### Prerequisites
1. Set up environment variables in `.env.local`:
   ```
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key
   TMDB_ACCESS_TOKEN=your_tmdb_token
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Navigate to `http://localhost:3000/dashboard`

## Testing the Timer Tool

### Basic Timer Operations

#### Test 1: Set and Start a Timer
1. Say or type: "Set a timer for 2 minutes"
2. **Expected Behavior**:
   - Agent calls `set_timer_duration(120)` then `start_timer()`
   - Timer UI appears showing 02:00
   - Timer begins counting down
   - Visual feedback shows "Running"

#### Test 2: Pause Timer
1. While timer is running, say: "Pause the timer"
2. **Expected Behavior**:
   - Agent calls `pause_timer()`
   - Timer stops counting
   - Visual feedback shows "Paused"
   - Time remains frozen

#### Test 3: Resume Timer
1. While timer is paused, say: "Resume the timer"
2. **Expected Behavior**:
   - Agent calls `resume_timer()`
   - Timer continues counting from paused time
   - Visual feedback shows "Running"

#### Test 4: Stop Timer
1. While timer is running or paused, say: "Stop the timer"
2. **Expected Behavior**:
   - Agent calls `stop_timer()`
   - Timer resets to default (02:20)
   - Visual feedback shows "Ready to start"

#### Test 5: Add Time
1. Start a timer with: "Set a timer for 1 minute"
2. Say: "Add 30 seconds to the timer"
3. **Expected Behavior**:
   - Agent calls `add_time(30)`
   - Timer updates to show 01:30
   - Timer continues or resets based on current state

### Stopwatch Operations

#### Test 6: Switch to Stopwatch
1. Say: "Start a stopwatch"
2. **Expected Behavior**:
   - Agent calls `switch_timer_mode("stopwatch")` then `start_timer()`
   - Timer UI shows "Stopwatch"
   - Timer counts up from 00:00

#### Test 7: Switch Back to Countdown
1. Say: "Switch to countdown timer mode"
2. **Expected Behavior**:
   - Agent calls `switch_timer_mode("countdown")`
   - Timer resets to default countdown mode (02:20)
   - Timer shows "Ready to start"

### Edge Cases

#### Test 8: Natural Language Duration Conversion
1. Try various formats:
   - "Set a timer for 5 minutes" → 300 seconds
   - "Set a timer for 1 hour" → 3600 seconds
   - "Set a timer for 90 seconds" → 90 seconds
2. **Expected Behavior**:
   - Agent correctly converts to seconds
   - Timer displays correct time in MM:SS format

#### Test 9: Resume Without Start
1. Say: "Resume the timer" (without starting first)
2. **Expected Behavior**:
   - Agent calls `resume_timer()`
   - Returns error: "Timer is not started. Use start_timer first."
   - No UI change

#### Test 10: Multiple Tool Switching
1. Set a timer
2. Search for a movie
3. Return to timer
4. **Expected Behavior**:
   - Each tool call switches the display content
   - Timer state persists across switches
   - UI smoothly transitions between timer/movies/charts

## Verification Checklist

### Functionality
- [ ] Timer starts and counts down correctly
- [ ] Stopwatch starts and counts up correctly
- [ ] Pause/resume works as expected
- [ ] Stop resets the timer
- [ ] Add time updates the duration
- [ ] Mode switching works correctly
- [ ] Duration setting accepts various time formats

### UI/UX
- [ ] Arc countdown animation is smooth
- [ ] Timer displays in MM:SS format
- [ ] Visual indicators show current state (Running/Paused/Ready)
- [ ] Transitions between tools are smooth
- [ ] Timer persists when switching between tools

### Integration
- [ ] Timer works alongside movie search
- [ ] Timer works alongside chart rendering
- [ ] Tool canvas activates only when called
- [ ] Multiple timer operations in sequence work correctly

### Error Handling
- [ ] Invalid durations are rejected
- [ ] Resume without start shows appropriate error
- [ ] Invalid mode values are rejected
- [ ] Edge cases (0 seconds, negative values) are handled

## Known Limitations

1. **Single Timer**: Only one timer can be active at a time
2. **Session Persistence**: Timer state is lost on page refresh
3. **No Notifications**: Timer completion doesn't trigger alerts (visual only)
4. **Manual Time Tracking**: Timer continues even if UI is hidden

## Debugging

### Enable Verbose Logging
Check browser console for:
- `client.*` logs from GenAILiveClient
- `server.*` logs for websocket diagnostics
- Tool call events and responses

### Common Issues

#### Timer doesn't appear
- Check that tool UI is activated: `toolUIActive` should be `true`
- Verify function calls are being received
- Check console for errors

#### Timer doesn't count
- Verify `isPaused` is `false` and `isStarted` is `true`
- Check that ArcCountdown component is receiving correct props
- Verify key changes on reset/mode switch

#### State not persisting
- Check that state updates are happening in useEffect dependencies
- Verify currentSeconds is being updated correctly
- Check for unintended component remounts

## Next Steps

After successful testing, consider:
1. Adding custom timer presets (e.g., "Pomodoro timer" = 25 minutes)
2. Implementing timer completion notifications
3. Adding timer history/logs
4. Supporting multiple named timers
5. Persisting timer state to localStorage

## Security Summary

CodeQL security analysis completed with **0 alerts**. No vulnerabilities detected in the timer implementation.
