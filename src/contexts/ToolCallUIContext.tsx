"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

interface ToolCallUI {
  id: string;
  component: ReactNode;
}

interface ToolCallUIContextType {
  toolCallUIs: ToolCallUI[];
  addToolCallUI: (id: string, component: ReactNode) => void;
  removeToolCallUI: (id: string) => void;
  hasUI: boolean;
}

const ToolCallUIContext = createContext<ToolCallUIContextType | undefined>(
  undefined
);

export const ToolCallUIProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toolCallUIs, setToolCallUIs] = useState<ToolCallUI[]>([]);

  const addToolCallUI = useCallback((id: string, component: ReactNode) => {
    setToolCallUIs((prev) => {
      if (prev.find((ui) => ui.id === id)) {
        return prev;
      }
      return [...prev, { id, component }];
    });
  }, []);

  const removeToolCallUI = useCallback((id: string) => {
    setToolCallUIs((prev) => prev.filter((ui) => ui.id !== id));
  }, []);

  const hasUI = useMemo(() => toolCallUIs.length > 0, [toolCallUIs]);

  const value = useMemo(
    () => ({
      toolCallUIs,
      addToolCallUI,
      removeToolCallUI,
      hasUI,
    }),
    [toolCallUIs, addToolCallUI, removeToolCallUI, hasUI]
  );

  return (
    <ToolCallUIContext.Provider value={value}>
      {children}
    </ToolCallUIContext.Provider>
  );
};

export const useToolCallUI = () => {
  const context = useContext(ToolCallUIContext);
  if (context === undefined) {
    throw new Error("useToolCallUI must be used within a ToolCallUIProvider");
  }
  return context;
};
