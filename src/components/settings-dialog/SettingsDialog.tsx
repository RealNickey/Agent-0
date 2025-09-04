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
        className="font-sans bg-slate-900 border-2 border-blue-500 rounded-[18px] text-slate-100 shadow-2xl shadow-blue-500/20 p-0 m-0 fixed bottom-[140px] right-0 w-[696px] h-[593px] -translate-x-1/4"
        style={{ display: open ? "block" : "none" }}
      >
        <div
          className={`box-border p-8 max-h-full overflow-y-auto overflow-x-hidden bg-slate-800 text-slate-100 rounded-[16px] m-1 ${
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

          <h3 className="text-blue-300 font-bold text-lg mb-3">System Instructions</h3>
          <textarea
            className="rounded-[12px] bg-slate-700 text-slate-100 border-2 border-slate-600 mt-2 font-sans leading-[21px] text-base w-[calc(100%-16px)] min-h-[150px] h-[150px] p-3 resize-y box-border focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-slate-400"
            onChange={updateConfig}
            value={systemInstruction}
            placeholder="Enter system instructions..."
          />
          <h4 className="ml-1 mb-[10px] text-blue-300 font-bold text-md">Function declarations</h4>
          <div className="text-[66%] w-full">
            <div className="grid grid-cols-[1fr_0.5fr_1.5fr] gap-y-1.5">
              {functionDeclarations.map((fd, fdKey) => (
                <div
                  className="contents text-slate-300 items-center h-[35px]"
                  key={`function-${fdKey}`}
                >
                  <span className="font-sans text-xs font-bold text-emerald-400 rounded-lg border-2 border-emerald-500 bg-slate-700 p-[10px]">
                    {fd.name}
                  </span>
                  <span className="p-3 text-slate-400 [&>*:not(:last-child)]:after:content-[',_']">
                    {Object.keys(fd.parameters?.properties || {}).map(
                      (item, k) => (
                        <span key={k}>{item}</span>
                      )
                    )}
                  </span>
                  <input
                    key={`fd-${fd.description}`}
                    className="flex-1 bg-slate-700 border-2 border-slate-600 rounded text-slate-100 p-[4px_8px] hover:bg-slate-600 hover:border-slate-500 focus:bg-slate-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
