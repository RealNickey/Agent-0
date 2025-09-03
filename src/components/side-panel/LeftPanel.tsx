import cn from "classnames";
import { useMemo, useState } from "react";
import {
  RiSidebarFoldLine,
  RiSidebarUnfoldLine,
  RiCheckboxCircleLine,
  RiStickyNoteLine,
  RiBookOpenLine,
  RiHistoryLine,
  RiTimerLine,
} from "react-icons/ri";

/**
 * LeftPanel: a simple collapsible side panel (no console content)
 * Mirrors SidePanel container styles for visual symmetry.
 */
export default function LeftPanel() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<
    "tasks" | "notes" | "focus" | "library"
  >("tasks");

  // Placeholder history items (replace with real data when wired up)
  const history = useMemo(
    () => [
      { id: "h1", title: "Quick task list", subtitle: "Today" },
      { id: "h2", title: "Movie search session", subtitle: "Yesterday" },
      { id: "h3", title: "Brain dump notes", subtitle: "Mon" },
      { id: "h4", title: "Weekly journal", subtitle: "Sun" },
      { id: "h5", title: "Focus timer test", subtitle: "Last week" },
    ],
    []
  );

  return (
    <div
      className={cn(
        "bg-neutral-0 flex flex-col h-screen transition-all duration-200 ease-in border-r border-gray-600 text-neutral-90 font-mono text-[13px] font-normal leading-[160%]",
        open ? "w-[270px]" : "w-[64px]"
      )}
    >
      {/* Header with Logo and Collapse/Expand */}
      <header
        className={cn(
          "flex items-center border-b border-neutral-20 h-12",
          open ? "px-3 justify-between" : "px-2 justify-center"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-2 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0 pointer-events-none select-none"
          )}
        >
          <div className="h-7 w-7 rounded-md bg-neutral-20 grid place-items-center text-neutral-80 text-[12px] font-bold">
            A0
          </div>
          <span className="text-neutral-90 font-google-sans text-[15px] font-medium tracking-wide">
            Agent-0
          </span>
        </div>

        {/* Toggle Button (always visible) */}
        {open ? (
          <button
            className="h-[30px] transition-transform duration-200 ease-in"
            aria-label="Collapse left panel"
            title="Collapse"
            onClick={() => setOpen(false)}
          >
            <RiSidebarFoldLine color="#b4b8bb" />
          </button>
        ) : (
          <button
            className="h-[30px] transition-transform duration-200 ease-in"
            aria-label="Expand left panel"
            title="Expand"
            onClick={() => setOpen(true)}
          >
            <RiSidebarUnfoldLine color="#b4b8bb" />
          </button>
        )}
      </header>

      {/* Main Nav */}
      <nav className="py-2">
        {/* Icon-only rail when collapsed */}
        {!open && (
          <ul className="flex flex-col items-center gap-1">
            <li>
              <button
                className={cn(
                  "w-10 h-9 rounded-md grid place-items-center text-neutral-70 hover:bg-neutral-10",
                  active === "tasks" && "text-neutral-90 bg-neutral-20"
                )}
                aria-label="Tasks & Reminders"
                title="Tasks & Reminders"
                onClick={() => setActive("tasks")}
              >
                <RiCheckboxCircleLine size={18} />
              </button>
            </li>
            <li>
              <button
                className={cn(
                  "w-10 h-9 rounded-md grid place-items-center text-neutral-70 hover:bg-neutral-10",
                  active === "notes" && "text-neutral-90 bg-neutral-20"
                )}
                aria-label="Notes & Journals"
                title="Notes & Journals"
                onClick={() => setActive("notes")}
              >
                <RiStickyNoteLine size={18} />
              </button>
            </li>
            <li>
              <button
                className={cn(
                  "w-10 h-9 rounded-md grid place-items-center text-neutral-70 hover:bg-neutral-10",
                  active === "focus" && "text-neutral-90 bg-neutral-20"
                )}
                aria-label="Focus Mode"
                title="Focus Mode"
                onClick={() => setActive("focus")}
              >
                <RiTimerLine size={18} />
              </button>
            </li>
            <li>
              <button
                className={cn(
                  "w-10 h-9 rounded-md grid place-items-center text-neutral-70 hover:bg-neutral-10",
                  active === "library" && "text-neutral-90 bg-neutral-20"
                )}
                aria-label="Library"
                title="Library"
                onClick={() => setActive("library")}
              >
                <RiBookOpenLine size={18} />
              </button>
            </li>
          </ul>
        )}

        {/* Full list when expanded */}
        {open && (
          <div className="px-2">
            <div className="text-[11px] uppercase tracking-wide text-neutral-60 px-2 py-2">Workspace</div>
            <ul className="flex flex-col gap-1">
              <li>
                <button
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-2 text-neutral-80 hover:bg-neutral-10",
                    active === "tasks" && "bg-neutral-20 text-neutral-90"
                  )}
                  onClick={() => setActive("tasks")}
                  aria-label="Tasks & Reminders"
                >
                  <RiCheckboxCircleLine size={18} />
                  <span className="text-[13px]">Tasks & Reminders</span>
                </button>
              </li>
              <li>
                <button
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-2 text-neutral-80 hover:bg-neutral-10",
                    active === "notes" && "bg-neutral-20 text-neutral-90"
                  )}
                  onClick={() => setActive("notes")}
                  aria-label="Notes & Journals"
                >
                  <RiStickyNoteLine size={18} />
                  <span className="text-[13px]">Notes & Journals</span>
                </button>
              </li>
              <li>
                <button
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-2 text-neutral-80 hover:bg-neutral-10",
                    active === "focus" && "bg-neutral-20 text-neutral-90"
                  )}
                  onClick={() => setActive("focus")}
                  aria-label="Focus Mode"
                >
                  <RiTimerLine size={18} />
                  <span className="text-[13px]">Focus Mode</span>
                </button>
              </li>
              <li>
                <button
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-2 text-neutral-80 hover:bg-neutral-10",
                    active === "library" && "bg-neutral-20 text-neutral-90"
                  )}
                  onClick={() => setActive("library")}
                  aria-label="Library"
                >
                  <RiBookOpenLine size={18} />
                  <span className="text-[13px]">Library</span>
                </button>
              </li>
            </ul>

            {/* History */}
            <div className="text-[11px] uppercase tracking-wide text-neutral-60 px-2 py-2 mt-3">History</div>
            <ul className="flex flex-col gap-1 max-h-[45vh] overflow-y-auto pr-1">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    className="w-full text-left rounded-md px-2 py-2 hover:bg-neutral-10"
                    title={h.title}
                  >
                    <div className="flex items-center gap-2">
                      <RiHistoryLine size={16} className="text-neutral-60" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-[13px] text-neutral-90">{h.title}</div>
                        <div className="text-[11px] text-neutral-60">{h.subtitle}</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Footer (collapsed rail shows nothing) */}
      {open && (
        <footer className="mt-auto p-2 border-t border-neutral-20 text-[11px] text-neutral-60">
          <div className="px-1">v0.1 · Personal workspace</div>
        </footer>
      )}
    </div>
  );
}
