import {
  ChangeEvent,
  FormEventHandler,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import VoiceSelector from "./VoiceSelector";
import ResponseModalitySelector from "./ResponseModalitySelector";
import OrbSelector from "./OrbSelector";
import OrbColorCustomizer from "./OrbColorCustomizer";
import { FunctionDeclaration, LiveConnectConfig, Tool } from "@google/genai";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type FunctionDeclarationsTool = Tool & {
  functionDeclarations: FunctionDeclaration[];
};

export default function SettingsDialog() {
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <span className="material-symbols-outlined">settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="font-sans bg-card border-border rounded-lg text-card-foreground shadow-lg p-6 w-full max-w-[95vw] sm:max-w-3xl lg:max-w-[1200px]">
        <DialogHeader>
          <DialogTitle className="text-accent-blue-headers font-bold text-lg">
            Settings
          </DialogTitle>
        </DialogHeader>
        <div
          className={`box-border max-h-full overflow-y-auto overflow-x-hidden ${
            connected ? "italic" : ""
          }`}
        >
          {connected && (
            <div className="italic mb-4">
              <p>
                These settings can only be applied before connecting and will
                override other settings.
              </p>
            </div>
          )}
          <div className="flex gap-4 py-2">
            <ResponseModalitySelector />
            <VoiceSelector />
            <OrbSelector />
          </div>

          <OrbColorCustomizer />

          <h3 className="text-accent-blue-headers font-bold text-lg mb-3 mt-4">
            System Instructions
          </h3>
          <textarea
            className="rounded-lg bg-muted text-muted-foreground border-border border mt-2 font-sans leading-normal text-base w-full min-h-[150px] p-3 resize-y box-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder-muted-foreground"
            onChange={updateConfig}
            value={systemInstruction}
            placeholder="Enter system instructions..."
          />
          <h4 className="ml-1 mb-2 text-accent-blue-headers font-bold text-md mt-4">
            Function declarations
          </h4>
          <div className="text-sm w-full">
            <div className="grid grid-cols-[1fr_0.5fr_1.5fr] gap-y-2">
              {functionDeclarations.map((fd, fdKey) => (
                <div
                  className="contents text-muted-foreground items-center"
                  key={`function-${fdKey}`}
                >
                  <span className="font-sans text-xs font-bold text-accent-green rounded-md border border-green-700 bg-muted p-2">
                    {fd.name}
                  </span>
                  <span className="p-2 text-muted-foreground [&>*:not(:last-child)]:after:content-[',_']">
                    {Object.keys(fd.parameters?.properties || {}).map(
                      (item, k) => (
                        <span key={k}>{item}</span>
                      )
                    )}
                  </span>
                  <input
                    key={`fd-${fd.description}`}
                    className="flex-1 bg-muted border border-border rounded text-card-foreground p-2 hover:bg-neutral-80 focus:bg-neutral-80 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    type="text"
                    defaultValue={fd.description}
                    onBlur={(e) =>
                      updateFunctionDescription(fd.name!, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
