# Timer and Stopwatch Tool

## Overview

The Arc Countdown timer and stopwatch tool has been integrated into the assistant, providing persistent time management capabilities through voice commands and explicit function calls.

## Features

### Timer Modes

1. **Countdown Timer**: Count down from a specified duration
2. **Stopwatch**: Count up from zero

### Available Functions

The following functions are available for the agent to use:

#### `start_timer()`
- **Description**: Start the countdown timer or stopwatch
- **Parameters**: None
- **Example**: "Start the timer"

#### `stop_timer()`
- **Description**: Stop and reset the timer or stopwatch
- **Parameters**: None
- **Example**: "Stop the timer"

#### `pause_timer()`
- **Description**: Pause the running timer or stopwatch
- **Parameters**: None
- **Example**: "Pause the timer"

#### `resume_timer()`
- **Description**: Resume a paused timer or stopwatch
- **Parameters**: None
- **Example**: "Resume the timer"

#### `set_timer_duration(seconds: number)`
- **Description**: Set the duration for the countdown timer in seconds
- **Parameters**:
  - `seconds` (required): Duration in seconds
- **Examples**: 
  - "Set a timer for 5 minutes" → 300 seconds
  - "Set a timer for 1 hour" → 3600 seconds

#### `add_time(seconds: number)`
- **Description**: Add additional time to the running timer
- **Parameters**:
  - `seconds` (required): Number of seconds to add
- **Example**: "Add 30 seconds to the timer"

#### `switch_timer_mode(mode: string)`
- **Description**: Switch between countdown timer and stopwatch modes
- **Parameters**:
  - `mode` (required): Either "countdown" or "stopwatch"
- **Example**: "Switch to stopwatch mode"

## Implementation Details

### Architecture

The timer tool is integrated into the `TMDbTool` component (`src/tools/tmdb/tmdb-tool.tsx`), making it part of the unified assistant that also provides movie search and charting capabilities.

### State Management

The timer maintains persistent state across function calls:
- **Timer Mode**: countdown or stopwatch
- **Running State**: started, paused, or stopped
- **Duration**: current timer value in seconds
- **Initial Seconds**: the starting duration for countdown

### UI Integration

The timer uses the `ArcCountdown` component from `src/components/arc-countdown.tsx`, which provides a visually appealing circular animation with:
- Center display showing MM:SS format
- Circular ring with second markers (0-59)
- Smooth animations for transitions
- Visual feedback for running/paused states

### Activation

The timer UI is activated only when explicitly called through one of the timer functions. It appears in the tool canvas area, replacing any currently displayed content (movies, charts, etc.).

## Usage Examples

### Setting a 5-minute timer
User: "Set a timer for 5 minutes"
Agent calls: `set_timer_duration(300)` → `start_timer()`

### Using a stopwatch
User: "Start a stopwatch"
Agent calls: `switch_timer_mode("stopwatch")` → `start_timer()`

### Pausing and resuming
User: "Pause the timer"
Agent calls: `pause_timer()`

User: "Resume"
Agent calls: `resume_timer()`

### Adding time
User: "Add 1 minute to the timer"
Agent calls: `add_time(60)`

## Technical Notes

- The timer is **single**: only one timer instance can be active at a time
- The timer is **persistent**: state is maintained across function calls within the same session
- The timer is **explicit**: it only activates when called, not automatically
- Time conversions (e.g., "5 minutes" → 300 seconds) are handled by the AI agent's understanding, not the tool

## Future Enhancements

Potential improvements could include:
- Multiple concurrent timers with labels
- Custom alarm sounds
- Timer presets
- Timer history
- Notification support
