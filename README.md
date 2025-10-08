# Agent-0: The Orb That Knows Too Much About Movies 🎬🔮

![Thumbnail Placeholder](readme/thumbnail.png)

## 🚀 TL;DR  
*"Siri, if Siri had a glassmorphic folder fetish, an unhealthy obsession with Tom Hanks filmography, and could render Vega-Lite charts while blinking at you creepily."*

## 🤔 What Actually Is This?

Welcome to **Agent-0**, the only voice assistant that simultaneously:
- **Talks to you** using Google's Gemini Live API (because who needs OpenAI when you can have Google watching AND listening?)
- **Blinks at you** through a Siri-inspired orb with ACTUAL ANIMATED EYES (yes, we gave it eyes, and yes, we regret nothing)
- **Knows every movie ever made** thanks to TMDb integration (ask it about "Inception" at 3 AM, we dare you)
- **Renders data visualizations** with Vega-Lite (because sometimes you need a bar chart of your existential crisis)
- **Detects when you stop talking** using Voice Activity Detection (it knows when you've given up mid-sentence)

This is essentially what happens when a developer thinks "I want Siri, but make it **weird**, open-source, and unnecessarily good at movie trivia."

**Built for:** Developers who want a voice assistant that actually works, film buffs who want to argue with AI about Tarantino, and anyone who's ever wanted to see an orb blink back at them.

## 🛠️ Features

### The Good Stuff
- 🎤 **Real-time Voice Streaming**: Talk to an AI that actually listens (unlike your last relationship)
- 👁️ **Blinking Siri Orb**: A circular avatar with eyes that blink. Yes, EYES. On an ORB. It's unsettling and beautiful.
- 🎬 **TMDb Integration**: Search movies, get details, browse what's popular (spoiler: it's always Marvel)
- 📊 **Live Chart Rendering**: Ask for a graph and watch Vega-Lite magic happen in real-time
- 🔊 **Voice Activity Detection**: Knows when you've stopped talking OR given up on life
- 🎨 **Glassmorphic Everything**: Because flat design is SO 2015
- 🔐 **Clerk Authentication**: Guards your movie queries like the nuclear codes

### The Quirky Stuff (We Call Them "Features")
- 🎵 **Audio Worklets**: Custom PCM16 audio processing (sounds fancy, mostly just moves bytes around)
- 📁 **Glass Folders with Floating Photos**: Hover over them. They tilt. You're welcome.
- 🔇 **Silence Detection**: Literally measures your awkward pauses
- 💾 **"Dangerously Ignore Build Errors"**: Our TypeScript is... aspirational (see `next.config.js`)
- 🌓 **Dark Mode**: Because your retinas are already suffering from code review
- 🧠 **AI Reasoning Display**: Watch the AI "think" (really just a loading spinner with delusions of grandeur)

### The "Why Does This Exist?" Stuff
- 📽️ **Movie Card Animations**: Each card has a 700ms cubic-bezier transition. Did we need this? No. Do we regret it? Also no.
- 🎭 **Multiple Tool Contexts**: Altair charts, TMDb queries, and more—all competing for the AI's attention
- 📡 **WebSocket Event Emitters**: Because REST is for people who hate themselves less
- 🎪 **Framer Motion Everywhere**: Animate ALL the things!

## 🧑‍💻 How To Install?

### Prerequisites (aka "The Gauntlet")
1. **Node.js** (we assume you have this, you're a developer)
2. **A Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey)) - Free, unlike therapy
3. **TMDb API Key** ([Register here](https://www.themoviedb.org/settings/api)) - For movie addiction enablement
4. **Clerk Account** (Optional, but recommended if you don't want randos using your AI) - [Sign up](https://clerk.com/)
5. **A sense of humor** (Required, non-negotiable)

### Installation Steps

**Step 1:** Clone this beautiful monstrosity
```bash
git clone https://github.com/RealNickey/Agent-0.git
cd Agent-0
```

**Step 2:** Install dependencies (grab a coffee, maybe two)
```bash
npm install
```

**Step 3:** Create your `.env.local` file (copy from `.env.example`)
```bash
cp .env.example .env.local
```

**Step 4:** Add your API keys to `.env.local`
```env
# The Big One - Gemini API
REACT_APP_GEMINI_API_KEY='your_gemini_key_here'

# Movie Time
TMDB_ACCESS_TOKEN='your_tmdb_token_here'
# OR (if you're old school)
TMDB_API_KEY='your_tmdb_api_key_here'

# Optional: Lock down your app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='your_clerk_pub_key'
CLERK_SECRET_KEY='your_clerk_secret'
```

**Step 5:** Fire it up! 🚀
```bash
npm run dev
```

**Step 6:** Open [http://localhost:3000](http://localhost:3000) and witness the orb

**Step 7 (Optional):** Run with HTTPS because you're fancy
```bash
npm run dev-https
```

## 🎮 Usage Examples

### Talk to Your Orb (Voice Commands)

**Movie Queries:**
```
You: "Show me popular movies right now"
Orb: *blinks knowingly* *displays grid of movies*

You: "Tell me about Inception"
Orb: "Ah yes, the dream within a dream within... wait, are WE in a dream?"

You: "Find movies with Ryan Gosling"
Orb: *immediately becomes more attractive* *shows results*
```

**Chart Wizardry:**
```
You: "Show me a bar chart of Oscar winners by year"
Orb: *conjures Vega-Lite magic* *renders beautiful visualization*

You: "Plot my declining sanity over time"
Orb: "That would just be a straight line down. Would you like me to make it exponential?"
```

**General Queries:**
```
You: "What's the weather?"
Orb: "I'm a movie bot, not a meteorologist. Want to watch 'The Day After Tomorrow' instead?"
```

### Example Voice Flow

1. **Sign in** (if you have Clerk enabled)
2. **Click the microphone** in the control tray
3. **Start talking** (the orb will blink at you approvingly)
4. **Watch the magic** as it searches TMDb, renders charts, or just vibes
5. **Stop talking** (VAD will detect your silence in ~1 second)
6. **Get response** via audio AND visual UI

### Code Example: Custom Tool Integration

Want to add your own tool? Here's how the movie search works:

```typescript
// Define your tool
const searchMoviesTool: FunctionDeclaration = {
  name: "search_movies",
  description: "Search for movies by title or keywords",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Search query" },
    },
    required: ["query"],
  },
};

// Listen for tool calls
useEffect(() => {
  const handleToolCall = async (toolCall: LiveServerToolCall) => {
    const searchCall = toolCall.functionCalls.find(
      (fc) => fc.name === "search_movies"
    );
    
    if (searchCall) {
      // Make your API call
      const results = await fetch(`/api/movies/search?query=${searchCall.args.query}`);
      const data = await results.json();
      
      // Send response back to AI
      client.sendToolResponse({
        functionResponses: [{
          id: searchCall.id,
          name: "search_movies",
          response: { output: JSON.stringify(data) }
        }]
      });
    }
  };
  
  client.on("toolcall", handleToolCall);
  return () => client.off("toolcall", handleToolCall);
}, [client]);
```

## 🏗️ Architecture (For the Nerds)

### The Stack
- **Next.js 15**: Because we like living dangerously (App Router + Pages Router hybrid chaos)
- **React 19**: Fresh off the press, bugs included
- **TypeScript**: Set to "ignore build errors" mode (we're rebels)
- **Tailwind CSS**: For when you need 47 utility classes on a single div
- **Framer Motion**: Animate everything, performance is optional
- **Gemini Live API**: Google's answer to "what if Siri, but developer-friendly?"
- **Web Audio API**: For processing audio through worklets (it's complicated)

### Project Structure (The Chaos Map)

```
Agent-0/
├── app/                      # Next.js 15 App Router stuff
│   ├── dashboard/           # Where the magic happens
│   ├── api/movies/         # TMDb proxy routes
│   └── page.tsx            # Clerk sign-in page
├── src/                     # Legacy CRA structure (we had a past)
│   ├── components/         # React components
│   │   ├── ui/            # Shadcn components + VoiceOrb
│   │   ├── glass-folder/  # Glassmorphic folders (yes, really)
│   │   └── movie-card.tsx # Movie cards with 700ms transitions
│   ├── lib/               # The serious stuff
│   │   ├── genai-live-client.ts    # WebSocket wrapper
│   │   ├── audio-streamer.ts       # PCM16 audio pipeline
│   │   ├── tmdb.ts                 # Movie API client
│   │   └── worklets/              # Audio processing workers
│   ├── hooks/             # React hooks
│   │   ├── use-live-api.ts        # Main Gemini Live hook
│   │   └── use-screen-capture.ts  # Screen sharing
│   ├── contexts/          # React contexts
│   │   └── LiveAPIContext.tsx     # Global AI state
│   └── tools/            # AI tool implementations
│       ├── tmdb/         # Movie search tools
│       └── altair/       # Chart rendering tools
├── public/               # Static assets
├── .env.example         # Template for your secrets
└── README.md           # You are here 📍
```

### How It Works (Simplified)

1. **You talk** → Microphone captures PCM16 audio
2. **Audio processing** → Worklets measure volume & detect silence
3. **WebSocket** → Streams to Gemini Live API
4. **AI thinks** → Gemini processes speech & decides to use tools
5. **Tool calls** → Searches TMDb, renders charts, etc.
6. **AI responds** → Audio streams back through Web Audio API
7. **UI updates** → React components animate with Framer Motion
8. **Orb blinks** → Because why not?

### Key Technologies Explained

**GenAI Live Client** (`src/lib/genai-live-client.ts`)
- EventEmitter-based WebSocket wrapper
- Handles: audio, video, tool calls, interruptions
- Auto-reconnects (with exponential backoff, we're not animals)

**Audio Pipeline** (`src/lib/audio-streamer.ts`)
- Queued PCM16 playback
- VU metering via AudioWorklets
- Handles stream interruptions gracefully

**Voice Activity Detection** (See `VAD_TESTING_GUIDE.md`)
- Client-side silence detection
- Configurable thresholds (because your microphone is probably trash)
- Sends `audioStreamEnd` when you shut up

**Tool System**
- Components register function declarations
- Listen for `client.on('toolcall')` events
- Fetch data from internal API routes
- Respond via `client.sendToolResponse()`

### Development Philosophy

> "If it compiles, ship it. If it doesn't compile, set `ignoreBuildErrors: true`."  
> — The Team, probably

## 🔐 Authentication (Bouncer Mode)

We use **Clerk** to keep the randos out. It's optional, but recommended if you don't want your API keys funding someone else's movie marathon.

### Setup
1. Get keys from [clerk.com](https://clerk.com/)
2. Add to `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='pk_test_...'
CLERK_SECRET_KEY='sk_test_...'
```
3. That's it. Middleware auto-enables if your key starts with `pk_`

### How It Works
- **Landing page** (`app/page.tsx`): Shows sign-in form
- **Dashboard** (`app/dashboard/page.tsx`): Protected route, requires auth
- **Middleware** (`middleware.ts`): Guards API routes automatically
- **No auth?** You get redirected. No movie queries for you.

## 🎨 Customization & Configuration

### Voice Activity Detection Tuning

Edit in `app/dashboard/page.tsx`:
```tsx
<ControlTray
  vadSilenceMs={1200}    // Wait 1.2s of silence before responding
  vadMinVolume={0.004}    // Volume threshold (lower = more sensitive)
/>
```

**Tweaking Guide:**
- **Orb cuts you off mid-sentence?** → Increase `vadSilenceMs` to 1500-1800
- **Orb takes FOREVER to respond?** → Decrease `vadSilenceMs` to 800-1000  
- **Orb ignores your whispers?** → Lower `vadMinVolume` to 0.002
- **Orb thinks your breathing is speech?** → Raise `vadMinVolume` to 0.006

### Orb Appearance

Customize in `src/components/ui/voiceOrb.tsx`:
```tsx
<SiriOrb
  size="250px"
  colors={{
    c1: "#6D8EC5",  // Blue-ish
    c2: "#D3622C",  // Orange-ish
    c3: "#F0C845",  // Yellow-ish
  }}
  animationDuration={20}
  isListening={true}
  audioLevel={0.5}
  isSleeping={false}
/>
```

**Make it your own:**
- Change colors to match your brand (or your existential mood)
- Adjust size (bigger = more intimidating)
- Toggle `isSleeping` for a narcoleptic orb experience

### Theme Toggle

Dark mode is default (because we respect your retinas). Toggle in the UI or modify `src/components/ui/theme-toggle.tsx`.

### Adding New Tools

See `src/tools/tmdb/tmdb-tool.tsx` for reference:
1. Define `FunctionDeclaration` with schema
2. Register in `setConfig({ tools: [...] })`
3. Listen for `client.on('toolcall')`
4. Fetch data, return via `client.sendToolResponse()`
5. Update UI state to display results

**Pro tip:** Keep tool descriptions clear. The AI is smart, but it's not psychic.

## 📜 Available Scripts

### `npm run dev`
Start development server. Orb will be available at `http://localhost:3000`.
- Hot reload enabled (your changes update instantly)
- Console shows errors (that we may or may not fix)

### `npm run dev-https`
Same as above, but with HTTPS (experimental).
- Useful for testing MediaStream constraints
- Required for some browser audio features
- Certificate warnings included at no extra charge

### `npm run build`
Build for production.
- Bundles everything into `.next/`
- Minifies JavaScript (makes it even harder to read)
- Ignores TypeScript errors (see config)
- Takes 2-5 minutes depending on your machine's will to live

### `npm start`
Run production build locally.
- Must run `npm run build` first
- Good for testing before deployment
- Still won't fix your TypeScript errors

### `npm run lint`
Run ESLint.
- Will find problems
- May or may not offer solutions
- We run it, we just don't always listen to it

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy
5. Profit?

### Other Platforms
The app is a standard Next.js 15 project, so it should work on:
- **Netlify** (with Next.js plugin)
- **Railway** (just works™)
- **Self-hosted** (you brave soul)
- **Google Cloud Run** (see `app.yaml`)

**Important:** Wherever you deploy, make sure to set all environment variables from `.env.example`.

_This is an experiment showcasing the Live API, not an official Google product. We’ll do our best to support and maintain this experiment but your mileage may vary. We encourage open sourcing projects as a way of learning from each other. Please respect our and other creators' rights, including copyright and trademark rights when present, when sharing these works and creating derivative work. If you want more info on Google's policy, you can find that [here](https://developers.google.com/terms/site-policies)._

## TMDb API Client Utility

We include a server-only TMDb client at `src/lib/tmdb.ts` built with axios + zod for type-safe, reusable movie endpoints (search, details, reviews, credits, discover, popular, top rated, trending) and image helpers.

Environment variables (set in `.env.local` for local dev):

- `TMDB_ACCESS_TOKEN`: TMDb v4 auth token (recommended)
- or `TMDB_API_KEY`: TMDb v3 API key (fallback)

Example (server component or server action):

```ts
import { searchMovies, toMovieCard } from "@/src/lib/tmdb";

export default async function Page() {
  const data = await searchMovies({ query: "Inception" });
  const cards = data.results.map(toMovieCard);
  return <pre>{JSON.stringify(cards.slice(0, 3), null, 2)}</pre>;
}
```

## 🐛 Known Issues & Quirks

### "Features" (Not Bugs)
- **TypeScript errors ignored** in production builds (by design, see `next.config.js`)
- **Orb blinks randomly** even when not listening (it's thinking about movies)
- **Audio sometimes lags** on first playback (browser autoplay policies)
- **Voice cuts off mid-word** if VAD is too aggressive (adjust `vadSilenceMs`)
- **Charts render off-screen** occasionally (refresh usually fixes it)
- **Movie posters sometimes 404** (TMDb API is moody)

### Actual Issues
- **High memory usage** during extended voice sessions (WebSocket buffers)
- **iOS Safari WebRTC** can be finicky (use Chrome on iOS if possible)
- **Clerk redirects** might flash briefly (SSR timing thing)
- **Vega-Lite bundle size** is chonky (~500KB, sorry)

### Debug Tips
- Check browser console (F12) for errors
- Enable verbose logging in `src/lib/genai-live-client.ts`
- Test microphone permissions in browser settings
- Verify API keys are set correctly
- Try turning it off and on again (seriously, it works)

## 🤝 Contributing

Want to make the orb even weirder? Contributions welcome!

### Guidelines
1. **Keep it fun**: Serious code, humorous comments
2. **Test your changes**: Or at least pretend you did
3. **Follow existing patterns**: Unless you have a better pattern
4. **Update docs**: Especially if you add new quirks
5. **Be kind**: Code reviews should be constructive, not destructive

### Areas We'd Love Help With
- [ ] Reducing bundle size (Vega-Lite is thicc)
- [ ] Better error handling (less crashes, more grace)
- [ ] Mobile optimization (orb looks weird on phones)
- [ ] More tool integrations (weather? stocks? existential questions?)
- [ ] Testing (what's testing? jk we need it)
- [ ] Accessibility (screen readers vs. voice UI = interesting challenge)

### PR Checklist
- [ ] Code actually runs
- [ ] No new TypeScript errors (unless ignoring them is funnier)
- [ ] README updated if needed
- [ ] Orb still blinks
- [ ] You tested it (right? RIGHT?)

## 📚 Documentation

### Additional Guides
- **[MOVIE_REVIEW_TOOL.md](MOVIE_REVIEW_TOOL.md)** - Deep dive into TMDb integration
- **[VAD_TESTING_GUIDE.md](VAD_TESTING_GUIDE.md)** - Voice Activity Detection tuning
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

### External Resources
- [Gemini Live API Docs](https://ai.google.dev/api/multimodal-live)
- [TMDb API Docs](https://developer.themoviedb.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Vega-Lite Documentation](https://vega.github.io/vega-lite/)

## 🙏 Credits & Acknowledgments

**Built With:**
- Google's Gemini Live API (for the AI brain)
- The Movie Database (TMDb) API (for movie obsession)
- Clerk (for keeping secrets secret)
- Next.js (for the framework chaos)
- Shadcn UI (for pretty components)
- Framer Motion (for smooth animations)
- Tailwind CSS (for utility class addiction)

**Inspired By:**
- Siri (the orb concept)
- HAL 9000 (the unsettling vibes)
- Every movie recommendation engine that thinks it knows you
- Developers who type "ignore errors" into config files

**Special Thanks:**
- Coffee (lots of coffee)
- Stack Overflow (you know why)
- That one YouTube tutorial on WebSockets
- Everyone who said "why?" (motivation is motivation)

## ⚖️ License

This project is licensed under the **Apache License 2.0**.

See [LICENSE](LICENSE) file for details.

**TL;DR:** You can use it, modify it, distribute it. Just don't sue us if the orb gains sentience.

## 🎬 Final Words

> "We wanted to build Siri. We ended up building something that judges your movie taste while blinking at you."

This is an **experiment** showcasing Google's Live API. It's not an official Google product. It's not an official anything product. It's a voice-powered, movie-obsessed, chart-rendering orb that exists because we could, not because we should.

**Use it to:**
- Search for movies
- Generate charts
- Practice talking to AI
- Question your life choices
- Wonder why the orb is staring at you

**Not responsible for:**
- API costs from excessive movie searches
- Existential crises caused by the orb's gaze
- Arguments with the AI about film taste
- Any damage to your dignity from talking to a circle

---

**Star this repo** if you appreciate the chaos. **Fork it** if you want to make it worse.

**Questions?** Open an issue. We'll respond when the orb tells us to.

**Bugs?** Those are features. But also open an issue.

**Want to chat?** The orb is always listening. (Literally. Check your mic permissions.)

---

Made with ☕, 🎬, and questionable decisions.

_"Speak, friend, and the orb will blink." — Gandalf, probably_
