import React, { createContext, useContext, useMemo, useState } from "react";

type UIContextValue = {
  canvasMode: boolean;
  setCanvasMode: (v: boolean) => void;
};

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [canvasMode, setCanvasMode] = useState(false);
  const value = useMemo(() => ({ canvasMode, setCanvasMode }), [canvasMode]);
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUIContext() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUIContext must be used within UIProvider");
  return ctx;
}
