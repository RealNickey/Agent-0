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

import cn from "classnames";
import { useEffect, useRef, useState } from "react";
import { RiSidebarFoldLine, RiSidebarUnfoldLine } from "react-icons/ri";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";
import { showToast } from "../../lib/toast";
import Logger, { LoggerFilterType } from "../logger/Logger";

const filterOptions = [
  { value: "conversations", label: "Conversations" },
  { value: "tools", label: "Tool Use" },
  { value: "none", label: "All" },
];

export default function SidePanel() {
  const { connected, client } = useLiveAPIContext();
  const [open, setOpen] = useState(false);
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const { log, logs } = useLoggerStore();

  const [textInput, setTextInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  //scroll the log to the bottom when new logs come in
  useEffect(() => {
    if (loggerRef.current) {
      const el = loggerRef.current;
      const scrollHeight = el.scrollHeight;
      if (scrollHeight !== loggerLastHeightRef.current) {
        el.scrollTop = scrollHeight;
        loggerLastHeightRef.current = scrollHeight;
      }
    }
  }, [logs]);

  // listen for log events and store them
  useEffect(() => {
    client.on("log", log);
    return () => {
      client.off("log", log);
    };
  }, [client, log]);

  const handleSubmit = () => {
    if (!textInput.trim()) {
      showToast.warning("Please enter a message");
      return;
    }
    
    if (!connected) {
      showToast.error("Not connected", "Please connect to Gemini Live API first");
      return;
    }

    try {
      client.send([{ text: textInput }]);
      showToast.success("Message sent");
      
      setTextInput("");
      if (inputRef.current) {
        inputRef.current.innerText = "";
      }
    } catch (error) {
      showToast.error("Failed to send message", error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <div
      className={cn(
        "bg-sidebar flex flex-col h-screen transition-all duration-200 ease-in border-r border-sidebar-border text-sidebar-foreground font-mono text-[13px] font-normal leading-[160%]",
        open ? "w-[400px]" : "w-[60px]"
      )}
    >
      <header
        className={cn(
          "flex justify-between items-center border-b border-sidebar-border",
          open
            ? "px-5 py-3 w-[calc(100%-45px)]"
            : "px-2 py-3 w-full justify-center"
        )}
      >
        <h2
          className={cn(
            "text-sidebar-foreground font-google-sans text-[21px] font-medium leading-4 transition-all duration-200 ease-in",
            open
              ? "opacity-100 block relative left-0"
              : "opacity-0 hidden -left-full"
          )}
        >
          Console
        </h2>
        {open ? (
          <button
            className="h-[30px] transition-transform duration-200 ease-in text-muted-foreground hover:bg-sidebar-accent/10 rounded"
            onClick={() => setOpen(false)}
          >
            <RiSidebarFoldLine color="#b4b8bb" />
          </button>
        ) : (
          <button
            className="h-[30px] transition-transform duration-200 ease-in text-muted-foreground hover:bg-sidebar-accent/10 rounded"
            onClick={() => setOpen(true)}
          >
            <RiSidebarUnfoldLine color="#b4b8bb" />
          </button>
        )}
      </header>

      <section
        className={cn(
          "flex px-6 py-6 justify-end gap-[21px] transition-all duration-200 ease-in",
          open ? "opacity-100" : "opacity-0 hidden"
        )}
      >
        <Select
          className="bg-muted text-sidebar-foreground h-[30px] w-[193px]"
          classNamePrefix="react-select"
          styles={{
            control: (baseStyles) => ({
              ...baseStyles,
              background: "var(--color-muted)",
              color: "var(--color-sidebar-foreground)",
              minHeight: "33px",
              maxHeight: "33px",
              border: 0,
            }),
            option: (styles, { isFocused, isSelected }) => ({
              ...styles,
              backgroundColor: isFocused
                ? "var(--color-muted)"
                : isSelected
                ? "var(--color-muted)"
                : undefined,
            }),
            menu: (styles) => ({
              ...styles,
              background: "var(--color-sidebar)",
              color: "var(--color-sidebar-foreground)",
            }),
            singleValue: (styles) => ({
              ...styles,
              color: "var(--color-sidebar-foreground)",
            }),
          }}
          defaultValue={selectedOption}
          options={filterOptions}
          onChange={(e) => {
            setSelectedOption(e);
          }}
        />
        <div
          className={cn(
            "select-none rounded border border-sidebar-border bg-muted flex h-[30px] pl-1 justify-center items-center gap-1.5 flex-shrink-0 text-center font-mono text-sm font-normal w-[136px]",
            connected ? "text-primary" : "text-muted-foreground"
          )}
        >
          {connected ? "🔵 Streaming" : "⏸️ Paused"}
        </div>
      </section>

      <div
        className={cn(
          "self-end w-[400px] flex-grow overflow-x-hidden overflow-y-auto transition-all duration-200 ease-in delay-100",
          open ? "opacity-100 block" : "opacity-0 hidden"
        )}
        ref={loggerRef}
      >
        <Logger
          filter={(selectedOption?.value as LoggerFilterType) || "none"}
        />
      </div>

      <div
        className={cn(
          "h-[50px] flex-grow-0 flex-shrink-0 border-t border-sidebar-border p-[14px_25px] overflow-hidden transition-all duration-200 ease-in",
          open ? "opacity-100 block" : "opacity-0 hidden",
          !connected && "pointer-events-none [&>*]:pointer-events-none"
        )}
      >
        <div className="relative bg-muted border border-border h-[22px] rounded-[10px] p-[11px_18px]">
          <textarea
            className="bg-transparent text-sidebar-foreground absolute top-0 left-0 z-[2] inline-block w-[calc(100%-72px)] max-h-5 outline-none flex-1 break-words overflow-auto p-[14px_18px] border-0 resize-none"
            ref={inputRef}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }
            }}
            onChange={(e) => setTextInput(e.target.value)}
            value={textInput}
          />
          <span
            className={cn(
              "absolute left-0 top-0 flex items-center z-[1] h-full w-full pointer-events-none select-none p-[0px_18px] whitespace-pre-wrap text-muted-foreground",
              textInput.length ? "hidden" : "block"
            )}
          >
            Type&nbsp;something...
          </span>

          <button
            className="absolute top-1/2 right-0 -translate-y-1/2 bg-transparent border-0 text-muted-foreground/60 cursor-pointer transition-colors duration-100 ease-in z-[2] hover:text-muted-foreground material-symbols-outlined filled"
            onClick={handleSubmit}
          >
            send
          </button>
        </div>
      </div>
    </div>
  );
}
