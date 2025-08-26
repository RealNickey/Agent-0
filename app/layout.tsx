import type { Metadata } from "next";
import Providers from "./providers";
import "../src/tailwind.css";
import "../src/index.css";

export const metadata: Metadata = {
  title: "Multimodal Live Console",
  description: "Multimodal Live API Web Console",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SSR-friendly initial theme: prefer system preference, no client branching here
  const prefersDark = false; // SSR can't read media, keep static and let client adjust with ThemeToggle
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
