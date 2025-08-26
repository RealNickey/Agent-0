"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  if (!mounted) return null;
  return (
    <Button variant="outline" size="icon" onClick={toggle} aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
