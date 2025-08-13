# Live API Web Console - Copilot Instructions

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the information here.

## Project Overview

Live API Web Console is a Next.js-based starter application for using Google's Gemini multimodal Live API over WebSocket. It provides real-time audio streaming, video capture, Google Search grounding, and graph rendering capabilities using vega-embed.

**Technology Stack:**
- Next.js 15.4.6 with React 19
- TypeScript 5.6.3
- Tailwind CSS 4.1.11
- Google GenAI Live API (@google/genai)
- WebSocket-based real-time communication
- Audio worklets for real-time audio processing

## Working Effectively

### Environment Setup
- **CRITICAL**: Create `.env` file from `.env.example` and add your Gemini API key:
  ```bash
  cp .env.example .env
  # Edit .env and set: REACT_APP_GEMINI_API_KEY='your-api-key-here'
  ```
- Get a free API key at: https://aistudio.google.com/apikey
- The application will throw a runtime error in the browser if `REACT_APP_GEMINI_API_KEY` is not set
- **Note**: Build and dev server will start without .env file, but app will fail at runtime

### Build and Development Process
- Install dependencies: `npm install` -- takes ~75 seconds. NEVER CANCEL. Set timeout to 120+ seconds.
- Development server: `npm run dev` -- starts in ~2 seconds, opens http://localhost:3000
- Production build: `npm run build` -- takes ~30 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Production server: `npm start` -- starts in ~400ms after build
- HTTPS development: `npm run dev-https` -- experimental HTTPS support
- Linting: `npm run lint` -- takes ~3 seconds, uses Next.js ESLint config

### Validation Requirements
**ALWAYS run these validation steps after making changes:**

1. **Build Validation:**
   ```bash
   npm run lint && npm run build
   ```
   - Lint must pass with no errors
   - Build must complete successfully in ~30 seconds
   - NEVER CANCEL builds - they are fast in this project

2. **Development Testing:**
   ```bash
   npm run dev
   ```
   - Server should start and be accessible at http://localhost:3000
   - Check console for any runtime errors
   - Verify `.env` file is loaded (shown in Next.js startup logs)

3. **Functional Validation Scenarios:**
   - **UI Components**: Verify side panel opens/closes, control tray is visible
   - **API Integration**: Check that app starts without API errors when valid key is provided
   - **Real-time Features**: Audio recording, video capture, and WebSocket connection status
   - **Graph Rendering**: Altair component should render without errors

## Key Application Areas

### Core Components (`/src/components/`)
- `altair/` - Vega-embed graph rendering with Google Search integration
- `control-tray/` - Media controls for audio/video recording
- `side-panel/` - Chat interface and logging panel  
- `logger/` - Real-time event logging and debugging
- `audio-pulse/` - Audio visualization components
- `settings-dialog/` - Configuration interface

### Core Logic (`/src/lib/`)
- `genai-live-client.ts` - WebSocket client for Live API communication
- `audio-streamer.ts` - Real-time audio streaming
- `audio-recorder.ts` - Microphone input handling
- `worklets/` - Audio processing worklets for real-time audio
- `store-logger.ts` - Zustand store for logging state

### WebSocket Integration (`/src/hooks/`)
- `use-live-api.ts` - Main hook for Live API connection and state
- `use-media-stream-mux.ts` - Media stream multiplexing
- `use-webcam.ts` - Camera access and controls
- `use-screen-capture.ts` - Screen sharing functionality

### Critical Files to Monitor
- `src/App.tsx` - Main application entry point with API key validation
- `src/contexts/LiveAPIContext.tsx` - Live API context provider
- `src/types.ts` - TypeScript definitions for Live API
- `.env` - Environment variables (API key)
- `next.config.js` - Next.js configuration with WebSocket support

## Common Development Tasks

### Adding New Features
- **Audio/Video**: Modify components in `control-tray/` and related hooks
- **Chat Interface**: Update `side-panel/` components and Live API context
- **Visualizations**: Extend `altair/` component for new graph types
- **Real-time Logging**: Add events to `store-logger.ts` and `logger/` component

### Debugging Real-time Features
- Use browser DevTools Network tab to monitor WebSocket connections
- Check console logs for Live API events and errors
- Monitor `logger/` component for real-time debugging information
- Verify microphone and camera permissions in browser

### Code Style and Standards
- Always run `npm run lint` before committing changes
- Follow existing TypeScript patterns and Google license headers
- Use existing component patterns for consistency
- Import hooks and utilities from their respective directories

## Deployment and Production

### Google App Engine Deployment
- Configuration in `app.yaml` (Node.js 20 runtime)
- Build outputs to `.next/` directory
- Static files served from build directory
- Requires valid Gemini API key in production environment

### Build Artifacts
- `.next/` - Next.js build output (DO NOT commit)
- `node_modules/` - Dependencies (DO NOT commit)
- Production build creates optimized bundles with hashed filenames

## Troubleshooting

### Common Issues
- **API Key Error**: Ensure `.env` file exists with valid `REACT_APP_GEMINI_API_KEY`
- **WebSocket Connection**: Check network connectivity and API key validity
- **Audio/Video Permissions**: Browser must grant microphone/camera access
- **Build Failures**: Run `npm run lint` first to catch TypeScript/ESLint errors

### Performance Considerations
- Audio worklets run in separate threads for real-time processing
- WebSocket connection maintains persistent state
- Graph rendering may be resource-intensive with large datasets
- Media streams require proper cleanup on component unmount

## Testing

**Note**: No comprehensive test suite is currently configured. The existing `src/App.test.tsx` is outdated.

### Manual Testing Checklist
- [ ] Application starts without errors
- [ ] Side panel opens and closes properly
- [ ] Control tray shows media controls
- [ ] WebSocket connection status updates correctly
- [ ] Audio recording indicators work
- [ ] Graph rendering component loads without errors
- [ ] Linting passes without warnings

### Testing with API Integration
- Use a valid Gemini API key for full functionality testing
- Test conversation flow and tool calls
- Verify Google Search grounding works
- Test graph generation and rendering capabilities

## File Structure Reference

```
├── .env (required - API key)
├── .github/
│   └── copilot-instructions.md
├── package.json (build scripts and dependencies)
├── next.config.js (Next.js configuration)
├── tailwind.config.js (styling configuration)
├── tsconfig.json (TypeScript configuration)
├── app.yaml (Google App Engine deployment)
├── pages/ (Next.js pages)
├── src/
│   ├── App.tsx (main application)
│   ├── components/ (UI components)
│   ├── contexts/ (React contexts)
│   ├── hooks/ (custom React hooks)
│   ├── lib/ (core logic and utilities)
│   └── types.ts (TypeScript definitions)
└── public/ (static assets)
```

Remember: Always validate your changes by running the development server and testing the real-time features that make this application unique.