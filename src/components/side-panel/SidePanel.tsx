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
import { RiSidebarFoldLine, RiSidebarUnfoldLine, RiSendPlane2Fill } from "react-icons/ri";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";
import Logger, { LoggerFilterType } from "../logger/Logger";
import { Button } from "../ui/button";

const filterOptions = [
  { value: "conversations", label: "Conversations" },
  { value: "tools", label: "Tool Use" },
  { value: "none", label: "All" },
];

// Animation variants
const sidebarVariants = {
  open: {
    width: "400px",
    opacity: 1,
  },
  closed: {
    width: "60px",
    opacity: 0.9,
  },
};

const contentVariants = {
  open: {
    opacity: 1,
    x: 0,
  },
  closed: {
    opacity: 0,
    x: -20,
  },
};

const buttonVariants = {
  hover: {
    scale: 1.05,
  },
  tap: {
    scale: 0.95,
  },
};

export default function SidePanel() {
  const { connected, client } = useLiveAPIContext();
  const [open, setOpen] = useState(true);
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
    client.send([{ text: textInput }]);

    setTextInput("");
    if (inputRef.current) {
      inputRef.current.innerText = "";
    }
  };

  return (
    <motion.div 
      className={cn("side-panel", { open })}
      variants={sidebarVariants}
      animate={open ? "open" : "closed"}
      initial="open"
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      <motion.header className="top modern-panel-header">
        <AnimatePresence mode="wait">
          {open && (
            <motion.h2
              variants={contentVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="inter-semibold text-lg text-white"
            >
              Console
            </motion.h2>
          )}
        </AnimatePresence>
        
        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="ghost"
            size="icon"
            className="opener modern-toggle-button"
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <RiSidebarFoldLine className="w-5 h-5 text-neutral-400" />
            ) : (
              <RiSidebarUnfoldLine className="w-5 h-5 text-neutral-400" />
            )}
          </Button>
        </motion.div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.section 
            className="indicators modern-indicators"
            variants={contentVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="modern-select-wrapper">
              <Select
                className="react-select modern-select"
                classNamePrefix="react-select"
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    background: "var(--neutral-800)",
                    borderColor: state.isFocused ? "var(--primary-500)" : "var(--neutral-700)",
                    color: "white",
                    minHeight: "36px",
                    borderRadius: "8px",
                    border: `1px solid ${state.isFocused ? "var(--primary-500)" : "var(--neutral-700)"}`,
                    boxShadow: state.isFocused ? "0 0 0 2px var(--primary-500)25" : "none",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "var(--primary-500)",
                    },
                  }),
                  option: (styles, { isFocused, isSelected }) => ({
                    ...styles,
                    backgroundColor: isSelected
                      ? "var(--primary-500)"
                      : isFocused
                      ? "var(--neutral-700)"
                      : "var(--neutral-800)",
                    color: "white",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }),
                  menu: (styles) => ({
                    ...styles,
                    backgroundColor: "var(--neutral-800)",
                    border: "1px solid var(--neutral-700)",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }),
                  singleValue: (styles) => ({
                    ...styles,
                    color: "white",
                  }),
                }}
                defaultValue={selectedOption}
                options={filterOptions}
                onChange={(e) => {
                  setSelectedOption(e);
                }}
              />
            </div>
            
            <motion.div 
              className={cn("streaming-indicator modern-status", { connected })}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className={cn("status-dot", { connected })} />
              <span className="status-text inter-medium">
                {connected ? "Streaming" : "Paused"}
              </span>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.div 
        className="side-panel-container modern-logger-container" 
        ref={loggerRef}
        variants={contentVariants}
        animate={open ? "open" : "closed"}
      >
        <Logger
          filter={(selectedOption?.value as LoggerFilterType) || "none"}
        />
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div 
            className={cn("input-container modern-input-container", { disabled: !connected })}
            variants={contentVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="input-content modern-input-content">
              <textarea
                className="input-area modern-textarea"
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
                placeholder="Type something..."
                disabled={!connected}
              />

              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="default"
                  size="icon"
                  className="send-button modern-send-button"
                  onClick={handleSubmit}
                  disabled={!connected || !textInput.trim()}
                >
                  <RiSendPlane2Fill className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
