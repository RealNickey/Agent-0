# Live API - Web Console

This repository contains a Next.js-based starter app for using the [Live API](<[https://ai.google.dev/gemini-api](https://ai.google.dev/api/multimodal-live)>) over a websocket. It provides modules for streaming audio playback, recording user media such as from a microphone, webcam or screen capture as well as a unified log view to aid in development of your application.

[![Live API Demo](readme/thumbnail.png)](https://www.youtube.com/watch?v=J_q7JY1XxFE)

Watch the demo of the Live API [here](https://www.youtube.com/watch?v=J_q7JY1XxFE).

## Usage

To get started, [create a free Gemini API key](https://aistudio.google.com/apikey) and add it to the `.env` file. Then:

```
$ npm install && npm run dev
```

We have provided several example applications on other branches of this repository:

- [demos/GenExplainer](https://github.com/google-gemini/multimodal-live-api-web-console/tree/demos/genexplainer)
- [demos/GenWeather](https://github.com/google-gemini/multimodal-live-api-web-console/tree/demos/genweather)
- [demos/GenList](https://github.com/google-gemini/multimodal-live-api-web-console/tree/demos/genlist)

## Example

Below is an example of an entire application that will use Google Search grounding and then render graphs using [vega-embed](https://github.com/vega/vega-embed):

```typescript
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";

export const declaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph in json format.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      json_graph: {
        type: SchemaType.STRING,
        description:
          "JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

export function Altair() {
  const [jsonString, setJSONString] = useState<string>("");
  const { client, setConfig } = useLiveAPIContext();

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      systemInstruction: {
        parts: [
          {
            text: 'You are my helpful assistant. Any time I ask you for a graph call the "render_altair" function I have provided you. Dont ask for additional information just make your best judgement.',
          },
        ],
      },
      tools: [{ googleSearch: {} }, { functionDeclarations: [declaration] }],
    });
  }, [setConfig]);

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log(`got toolcall`, toolCall);
      const fc = toolCall.functionCalls.find(
        (fc) => fc.name === declaration.name
      );
      if (fc) {
        const str = (fc.args as any).json_graph;
        setJSONString(str);
      }
    };
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);
  return <div className="vega-embed" ref={embedRef} />;
}
```

## development

This project was migrated from Create React App to Next.js.
Project consists of:

- an Event-emitting websocket-client to ease communication between the websocket and the front-end
- communication layer for processing audio in and out
- a boilerplate view for starting to build your apps and view logs

## Authentication (Clerk)

This project uses [Clerk](https://clerk.com/) for authentication. A minimal integration has been added:

1. `ClerkProvider` wraps the app in `pages/_app.tsx`.
2. Landing page (`/` in `pages/index.tsx`) displays a sign-in form (`<SignIn />`) when signed out and automatically redirects signed-in users to `/dashboard`.
3. The dashboard (`/dashboard`) is the original streaming console UI and is server-side protected. If a user isn't authenticated it redirects back to `/`.

### Required Environment Variables

Add these to your `.env` (see `.env.example`):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_backend_secret
```

### How It Works

- The landing page uses `getServerSideProps` to redirect already-authenticated users to the dashboard early (better UX and avoids a flash of the sign-in form).
- The dashboard page also uses `getServerSideProps` to guard access on the server—unauthenticated users are redirected back to `/`.
- Client side, `useAuth()` provides instant redirect if a session is established after load.

### Next Steps (Optional Enhancements)

- Add user profile / sign-out controls to the UI.
- Persist user-specific settings linked to their Clerk `userId`.
- Introduce role-based access if needed (e.g., gating experimental features).

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `.next` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### `npm start`

Starts the production server after running `npm run build`.

### `npm run dev-https`

Runs the development server with HTTPS enabled using Next.js experimental HTTPS support.

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
