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
import { FunctionDeclaration, LiveConnectConfig, Tool } from "@google/genai";

type FunctionDeclarationsTool = Tool & {
  functionDeclarations: FunctionDeclaration[];
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
    <div className="flex items-center justify-center gap-1 h-[70px]">
      <button
        className="flex items-center justify-center bg-neutral-20 text-neutral-60 text-xl leading-7 lowercase cursor-pointer animate-opacity-pulse transition-all duration-200 ease-in-out w-12 h-12 rounded-[18px] border border-transparent select-none focus:border-2 focus:border-neutral-20 focus:outline focus:outline-2 focus:outline-neutral-80 hover:bg-transparent hover:border-neutral-20 material-symbols-outlined bg-transparent border-0"
        onClick={() => setOpen(!open)}
      >
        settings
      </button>
      <dialog
         className="font-mono bg-neutral-5 rounded-[18px] text-neutral-80 border-0 p-0 m-0 fixed -top-[400px] right-0 w-[696px] h-[593px] -translate-x-1/4 -translate-y-1/2"
        style={{ display: open ? "block" : "none" }}
      >
        <div
          className={`box-border p-8 max-h-full overflow-y-auto overflow-x-hidden ${
            connected ? "italic" : ""
          }`}
        >
          {connected && (
            <div className="italic">
              <p>
                These settings can only be applied before connecting and will
                override other settings.
              </p>
            </div>
          )}
          <div className="flex gap-4 py-2">
            <ResponseModalitySelector />
            <VoiceSelector />
          </div>

          <h3>System Instructions</h3>
          <textarea
            className="rounded-[12px] bg-neutral-15 text-neutral-80 mt-2 font-google-sans leading-[21px] text-base w-[calc(100%-16px)] min-h-[150px] h-[150px] p-2 border-0 resize-y box-border"
            onChange={updateConfig}
            value={systemInstruction}
          />
          <h4 className="ml-1 mb-[10px]">Function declarations</h4>
          <div className="text-[66%] w-full">
            <div className="grid grid-cols-[1fr_0.5fr_1.5fr] gap-y-1.5">
              {functionDeclarations.map((fd, fdKey) => (
                <div
                  className="contents text-neutral-70 items-center h-[35px]"
                  key={`function-${fdKey}`}
                >
                  <span className="font-mono text-xs font-bold text-blue-400 rounded-lg border border-neutral-20 p-[10px]">
                    {fd.name}
                  </span>
                  <span className="p-3 [&>*:not(:last-child)]:after:content-[',_']">
                    {Object.keys(fd.parameters?.properties || {}).map(
                      (item, k) => (
                        <span key={k}>{item}</span>
                      )
                    )}
                  </span>
                  <input
                    key={`fd-${fd.description}`}
                    className="flex-1 bg-transparent border-none text-inherit text-inherit p-[2px_4px] hover:bg-neutral-20 focus:bg-neutral-20 focus:outline-none"
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
      </dialog>
    </div>
  );
}
