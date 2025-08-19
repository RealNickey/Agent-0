/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use client";

import { ReactNode } from "react";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "../src/tailwind.css"; // Tailwind layers (base, components, utilities)
import "../src/index.css"; // Legacy global resets
import "../src/App.scss"; // CSS variables & legacy styles
import "../src/components/audio-pulse/audio-pulse.scss";
import "../src/components/logger/logger.scss";
import "../src/components/side-panel/side-panel.scss";
import "../src/components/side-panel/react-select.scss";
import "../src/components/settings-dialog/settings-dialog.scss";
import "../src/components/control-tray/control-tray.scss";

interface LayoutContentProps {
  children: ReactNode;
}

function LayoutContent({ children }: LayoutContentProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasValidClerkKey = publishableKey && publishableKey.startsWith('pk_');

  if (!hasValidClerkKey) {
    // Without valid Clerk keys, show a notice and the app content
    return (
      <>
        <header style={{ padding: "1rem", background: "#fff3cd", borderBottom: "1px solid #ffeaa7", color: "#856404" }}>
          <strong>Notice:</strong> Clerk authentication is not configured. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in your .env.local file.
          <br />
          <small>Get your keys from: <a href="https://dashboard.clerk.com/last-active?path=api-keys" target="_blank" rel="noopener noreferrer">https://dashboard.clerk.com</a></small>
        </header>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        {children}
      </>
    );
  }

  return (
    <ClerkProvider>
      <header style={{ padding: "1rem", background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
        <SignedOut>
          <div style={{ display: "flex", gap: "1rem" }}>
            <SignInButton />
            <SignUpButton />
          </div>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <noscript>You need to enable JavaScript to run this app.</noscript>
      {children}
    </ClerkProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Multimodal Live - Console</title>
        <meta name="description" content="Multimodal Live API Web Console" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <LayoutContent>
          {children}
        </LayoutContent>
      </body>
    </html>
  );
}