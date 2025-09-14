# AI Coding Agent Instructions

Concise, project-specific guidance for this repo (Next.js 15 + client-side multimodal Live API console + TMDb tooling). Focus on THESE patterns when generating or editing code.

## 1. Architecture Overview

- Hybrid structure: `app/` (Next.js App Router) is authoritative; `src/` contains legacy CRA-style components, hooks, lib, and tools reused by pages in `app/`. Prefer placing new server routes in `app/api/*` and new shared client code in `src/*`.
- Core realtime layer: `src/lib/genai-live-client.ts` (EventEmitter wrapper around `@google/genai` live websocket) + React hook `src/hooks/use-live-api.ts` + provider `src/contexts/LiveAPIContext.tsx` expose `client`, `connect()`, `send()`, `sendToolResponse()`, audio events, reconnection & health checks.
- Audio pipeline: `src/lib/audio-streamer.ts`, `src/lib/utils.ts (audioContext)`, `src/lib/worklets/*` + registry `src/lib/audioworklet-registry.ts` manage queued PCM16 -> Web Audio playback with VU metering.
- Tool invocation pattern: Components (e.g. `src/tools/tmdb/tmdb-tool.tsx`, `src/tools/altair/Altair.tsx`) register function declarations via `setConfig({ tools: [...] })`, listen to `client.on("toolcall")`, perform fetches against internal API routes, then respond with `client.sendToolResponse({ functionResponses })`.
- TMDb server utilities: `src/lib/tmdb.ts` provides server-only functions (axios + zod). API routes in `app/api/movies/*` adapt them for client/tool use and apply caching headers.

## 2. Key Workflows & Commands

- Dev: `npm run dev` (optionally `npm run dev-https` for experimental HTTPS audio constraints). Build: `npm run build`; Prod start: `npm start`.
- Environment vars (set in `.env.local`):
  - `REACT_APP_GEMINI_API_KEY` (Gemini Live) passed through `next.config.js` to client.
  - Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (middleware auto-enables only if key starts with `pk_`).
  - TMDb: `TMDB_ACCESS_TOKEN` (preferred) or `TMDB_API_KEY`.
- Authentication: Landing page (`app/page.tsx`) redirects signed-in users to `app/dashboard/page.tsx`; middleware guards API & app routes when Clerk configured.

## 3. Conventions & Patterns

- Dynamic imports with `{ ssr:false }` for browser-only code (audio, media, tools). Maintain this for anything using `window`, MediaStream, AudioContext.
- Path aliases: `@/*` -> `src/*`, `@/app/*` -> `app/*` (see `tsconfig.json`); prefer these over relative paths in new code.
- Server-only modules: mark with `import "server-only"`; never import them in client (e.g. `src/lib/tmdb.ts`). Wrap usages in API routes or server components.
- Tool responses: Always map each `functionCall` to `{ id, name, response: { output: <payload> } }`. Use slight delay (`setTimeout(...,100)`) only if batching pending state; otherwise immediate send is fine.
- Audio: Add worklets via `audioStreamer.addWorklet(name, src, handler)`; reuse existing context IDs to avoid multiple AudioContext instances (browser autoplay policies).
- Health & reconnection: `GenAILiveClient` auto schedules exponential backoff (max 3) on unexpected close; don't layer duplicate reconnect loops.
- Caching strategy: Use `export const revalidate = <seconds>` or `dynamic = 'force-dynamic'` in `app/api/*` routes. Follow existing TTLs (search=120s, popular=600s, details=3600s) for consistency unless requirements change.

## 4. Pitfalls / Gotchas

- Missing TMDb helpers: API routes reference (or tools expect) `getMovieReviews`, `getRecommendedMovies`, and a top‑rated flow, but these functions are NOT implemented in `src/lib/tmdb.ts`. Add them (mirror `getPopularMovies` style with zod validation) before extending tool logic.
- Missing API route: Tool calls `GET /api/movies/top-rated` but no corresponding route exists under `app/api/movies/`; create one (e.g. `top-rated/route.ts`) once a `getTopRatedMovies` helper is added.
- `next.config.js` sets `ignoreBuildErrors: true`; type errors won’t fail CI—manually review Typescript before large refactors.
- Audio worklet registration: Ensure unique `workletName`; registry prevents duplicates but merges handlers—remove listeners if discarding components to avoid leaks.
- Avoid importing `@google/genai` server features directly in serverless edge runtime unless confirmed compatible; current usage is client websocket only.
- Ensure any new API route calling TMDb invokes `assertTmdbEnv()` early to give clear error.

## 5. Adding a New Tool (Example Skeleton)

1. Define `FunctionDeclaration` objects.
2. In a client component inside `LiveAPIProvider`, call `setConfig({ tools:[{ functionDeclarations:[...]}], systemInstruction, responseModalities, speechConfig })`.
3. Listen: `client.on('toolcall', handler)`; for each `functionCall`, perform fetch to internal route (create one under `app/api/...` if needed).
4. Build `functionResponses` array and `client.sendToolResponse({ functionResponses })`.
5. Render UI from fetched data (e.g., map to existing card components).

## 6. When Modifying Core Client

- Preserve public surface of `GenAILiveClient` (`connect`, `disconnect`, `send`, `sendToolResponse`, `sendRealtimeInput`, `endAudioStream`, health check methods) to avoid breaking `use-live-api` hook.
- Validate that events (`audio`, `toolcall`, `content`, `interrupted`, etc.) remain emitted with same payload shapes.

## 7. Style & UI

- Tailwind + shadcn style utilities; merge classes with `cn()` from `src/lib/utils.ts`.
- Reuse existing UI primitives in `src/components/ui/*` for consistency (buttons, dialog, select, theme-toggle).

## 8. Safe Extensions

- Implement missing TMDb endpoints first (reviews, recommendations, top-rated) in `src/lib/tmdb.ts` then adjust API routes/tools.
- Add tests for new server utilities (pattern: validate with zod, throw enriched errors).

Provide reasoning in PR descriptions if diverging from these patterns.
