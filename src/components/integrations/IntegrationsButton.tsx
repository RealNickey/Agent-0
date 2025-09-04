"use client";

import { useState } from "react";

/**
 * IntegrationsButton: A button with a grid icon for accessing integrations.
 * Uses a custom grid icon that matches the project theme.
 */
export default function IntegrationsButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-center gap-1 h-[70px]">
      <button
        className="flex items-center justify-center bg-neutral-20 text-neutral-60 text-xl leading-7 lowercase cursor-pointer animate-opacity-pulse transition-all duration-200 ease-in-out w-12 h-12 rounded-[18px] border border-transparent select-none focus:border-2 focus:border-neutral-20 focus:outline focus:outline-2 focus:outline-neutral-80 hover:bg-transparent hover:border-neutral-20 bg-transparent border-0"
        onClick={() => setOpen(!open)}
        title="Integrations"
        aria-label="Open integrations"
      >
        {/* Custom grid icon matching the attached logo */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="text-neutral-60"
        >
          <rect
            x="3"
            y="3"
            width="7"
            height="7"
            rx="2"
            fill="currentColor"
            opacity="0.8"
          />
          <rect
            x="14"
            y="3"
            width="7"
            height="7"
            rx="2"
            fill="currentColor"
            opacity="0.8"
          />
          <rect
            x="3"
            y="14"
            width="7"
            height="7"
            rx="2"
            fill="currentColor"
            opacity="0.8"
          />
          <rect
            x="14"
            y="14"
            width="7"
            height="7"
            rx="2"
            fill="currentColor"
            opacity="0.8"
          />
        </svg>
      </button>

      {/* Placeholder modal for integrations */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setOpen(false)}
        >
          <dialog
            className="font-mono bg-neutral-5 rounded-[18px] text-neutral-80 border-0 p-0 m-0 fixed top-[55%] left-1/2 w-[500px] h-[400px] -translate-x-1/2 -translate-y-1/2 z-50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="box-border p-8 max-h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-neutral-90">
                  Integrations
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="text-neutral-60 hover:text-neutral-90 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-neutral-20 bg-neutral-10">
                  <h3 className="font-medium text-neutral-90 mb-2">
                    Available Integrations
                  </h3>
                  <p className="text-sm text-neutral-70">
                    Connect external services and tools to enhance your workflow.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 rounded-lg border border-neutral-20 hover:bg-neutral-10 cursor-pointer">
                    <div className="font-medium text-neutral-90">API Keys</div>
                    <div className="text-xs text-neutral-60">Manage external API connections</div>
                  </div>
                  <div className="p-3 rounded-lg border border-neutral-20 hover:bg-neutral-10 cursor-pointer">
                    <div className="font-medium text-neutral-90">Webhooks</div>
                    <div className="text-xs text-neutral-60">Configure webhook endpoints</div>
                  </div>
                  <div className="p-3 rounded-lg border border-neutral-20 hover:bg-neutral-10 cursor-pointer">
                    <div className="font-medium text-neutral-90">Third-party Services</div>
                    <div className="text-xs text-neutral-60">Connect to external platforms</div>
                  </div>
                </div>
              </div>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
}
