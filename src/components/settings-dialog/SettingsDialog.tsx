import {
  ChangeEvent,
  FormEventHandler,
  useCallback,
  useMemo,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import VoiceSelector from "./VoiceSelector";
import ResponseModalitySelector from "./ResponseModalitySelector";
import { FunctionDeclaration, LiveConnectConfig, Tool } from "@google/genai";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

type FunctionDeclarationsTool = Tool & {
  functionDeclarations: FunctionDeclaration[];
};

const dialogVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
};

const overlayVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { config, setConfig, connected } = useLiveAPIContext();
  const functionDeclarations: FunctionDeclaration[] = useMemo(() => {
    if (!Array.isArray(config.tools)) {
      return [];
    }
    return (config.tools as Tool[])
      .filter((t: Tool): t is FunctionDeclarationsTool =>
        Array.isArray((t as any).functionDeclarations)
      )
      .map((t) => t.functionDeclarations)
      .filter((fc) => !!fc)
      .flat();
  }, [config]);

  // system instructions can come in many types
  const systemInstruction = useMemo(() => {
    if (!config.systemInstruction) {
      return "";
    }
    if (typeof config.systemInstruction === "string") {
      return config.systemInstruction;
    }
    if (Array.isArray(config.systemInstruction)) {
      return config.systemInstruction
        .map((p) => (typeof p === "string" ? p : p.text))
        .join("\n");
    }
    if (
      typeof config.systemInstruction === "object" &&
      "parts" in config.systemInstruction
    ) {
      return (
        config.systemInstruction.parts?.map((p) => p.text).join("\n") || ""
      );
    }
    return "";
  }, [config]);

  const updateConfig: FormEventHandler<HTMLTextAreaElement> = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const newConfig: LiveConnectConfig = {
        ...config,
        systemInstruction: event.target.value,
      };
      setConfig(newConfig);
    },
    [config, setConfig]
  );

  const updateFunctionDescription = useCallback(
    (editedFdName: string, newDescription: string) => {
      const newConfig: LiveConnectConfig = {
        ...config,
        tools:
          config.tools?.map((tool) => {
            const fdTool = tool as FunctionDeclarationsTool;
            if (!Array.isArray(fdTool.functionDeclarations)) {
              return tool;
            }
            return {
              ...tool,
              functionDeclarations: fdTool.functionDeclarations.map((fd) =>
                fd.name === editedFdName
                  ? { ...fd, description: newDescription }
                  : fd
              ),
            };
          }) || [],
      };
      setConfig(newConfig);
    },
    [config, setConfig]
  );

  return (
    <div className="settings-dialog modern-settings">
      <Button
        variant="ghost"
        size="icon"
        className="settings-trigger"
        onClick={() => setOpen(!open)}
      >
        <span className="material-symbols-outlined">settings</span>
      </Button>
      
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="settings-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{
                duration: 0.2,
              }}
              onClick={() => setOpen(false)}
            />
            
            {/* Dialog */}
            <motion.div
              className="settings-modal"
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
            >
              <Card className="settings-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="inter-semibold text-xl">
                      Settings
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpen(false)}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </Button>
                  </div>
                  
                  {connected && (
                    <div className="connected-warning">
                      <Badge variant="warning" className="mb-2">
                        Connection Active
                      </Badge>
                      <p className="text-sm text-neutral-400">
                        Settings can only be applied before connecting
                      </p>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className={`settings-content ${connected ? "disabled" : ""}`}>
                    {/* Mode Selectors */}
                    <div className="mode-selectors modern-selectors">
                      <ResponseModalitySelector />
                      <VoiceSelector />
                    </div>

                    {/* System Instructions */}
                    <div className="system-instructions">
                      <h3 className="inter-medium text-lg mb-3 text-white">
                        System Instructions
                      </h3>
                      <textarea
                        className="modern-textarea"
                        placeholder="Enter system instructions..."
                        onChange={updateConfig}
                        value={systemInstruction}
                        rows={4}
                      />
                    </div>

                    {/* Function Declarations */}
                    <div className="function-declarations modern-functions">
                      <h4 className="inter-medium text-base mb-3 text-white">
                        Function Declarations
                      </h4>
                      <div className="fd-grid">
                        {functionDeclarations.map((fd, fdKey) => (
                          <Card key={`function-${fdKey}`} className="fd-card">
                            <div className="fd-header">
                              <span className="fd-name inter-medium text-primary-400">
                                {fd.name}
                              </span>
                              <div className="fd-args">
                                {Object.keys(fd.parameters?.properties || {}).map(
                                  (item, k) => (
                                    <Badge key={k} variant="secondary" className="fd-arg">
                                      {item}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                            <input
                              key={`fd-${fd.description}`}
                              className="fd-description modern-input"
                              type="text"
                              placeholder="Function description..."
                              defaultValue={fd.description}
                              onBlur={(e) =>
                                updateFunctionDescription(fd.name!, e.target.value)
                              }
                            />
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
