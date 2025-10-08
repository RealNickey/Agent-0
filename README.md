## Agent-0: The AI Assistant I Swore Would Be Jarvis (But Is Currently a Blinking Paperweight) 🤖🔮

## 🚀 TL;DR

*"It's what happens when you try to build Jarvis and Siri's lovechild but your college schedules internal exams with the express purpose of crushing your dreams. It blinks, it knows movies, and that's about it... for now."*

## 🤔 What Actually Is This?

Welcome to Agent-0, the result of a fever dream where I thought, "What if Siri was actually useful, like Jarvis?" This project was destined for greatness. It was going to manage my life, chain tools together like a pro, and maybe even do my laundry.

Then, my exams showed up.

So, for now, Agent-0 is a **glorified, glassmorphic pet rock** that has a few... quirks:

- **It Stares. Unblinkingly. Then Blinks.** Powered by an animated Siri-style orb that watches your every move. We gave it eyes. We may come to regret this.
- **Talks a Big Game.** Uses Google's Gemini Live API to chat, so it sounds impressive while accomplishing absolutely nothing of substance.
- **Certified Film Nerd.** Thanks to TMDb, it can lecture you for hours on Christopher Nolan's filmography but can't yet book you a movie ticket.
- **Makes Pointless Charts.** Renders beautiful Vega-Lite visualizations of data you didn't ask for. It's the AI equivalent of doodling in a meeting.
- **Knows When You've Given Up.** With Voice Activity Detection, it can sense the exact moment your soul leaves your body mid-sentence.
  

> **The grand plan for **tool chaining** and **background tasks** is still there, waiting for schedule to clear up. Until then, feel free to poke the orb.**

***

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


## 🧑‍💻 How To Install?

### Prerequisites 
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

**Step 5:** yk the rest

## 🎮 Usage Examples

### Talk to Your Orb (Voice Commands)

**Movie Queries:**
```
You: "Search for Inception"
Orb: *blinks knowingly* *displays grid of movies*

You: "Tell me about Inception"
Orb: "Ah yes, the dream within a dream within... wait, are WE in a dream?"
```


**Chart Wizardry:**
```
You: "Show me a bar chart of Oscar winners by year"
Orb: *conjures Vega-Lite magic* *renders beautiful visualization*

You: "Plot my declining sanity over time"
Orb: "That would just be a straight line down. Would you like me to make it exponential?"
```

## 🏗️ Architecture (For the Nerds)
```
### The Stack
- **Next.js 15**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Gemini Live API**
- **Web Audio API**
```

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

### Development Philosophy

> "If it compiles, ship it. If it doesn't compile, set `ignoreBuildErrors: true`."  
> — The Team, probably

## 🐛 Known Issues & Quirks

### "Features" (Not Bugs)
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

## 🙏 Credits & Acknowledgments

**Built With:**
- Google's Gemini Live API (for the AI brain)
- The Movie Database (TMDb) API (for movie obsession)
- Clerk (for keeping secrets secret)
- Next.js (for the framework chaos)
- Shadcn UI (for pretty components)
- Framer Motion (for smooth animations)
- Tailwind CSS (for utility class addiction)


## 🎬 Final Words

> "We wanted to build Siri. We ended up building something that judges your movie taste while blinking at you."


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


_"Speak, friend, and the orb will blink." — Gandalf, probably_
