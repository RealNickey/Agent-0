"use client";

import cn from "classnames";
import { useMemo, useState } from "react";
import { useClerk, useUser, SignOutButton } from "@clerk/nextjs";
import {
  RiSidebarFoldLine,
  RiSidebarUnfoldLine,
  RiCheckboxCircleLine,
  RiStickyNoteLine,
  RiBookOpenLine,
  RiHistoryLine,
  RiTimerLine,
  RiUser3Line,
  RiLogoutBoxRLine,
} from "react-icons/ri";

/**
 * LeftPanel: a simple collapsible side panel (no console content)
 * Mirrors SidePanel container styles for visual symmetry.
 */
function useClerkData() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user, isSignedIn } = useUser();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { signOut, openSignIn, openUserProfile } = useClerk();
  return { user, isSignedIn, signOut, openSignIn, openUserProfile };
}

export default function LeftPanel() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<"tasks" | "notes" | "focus" | "library">(
    "tasks"
  );
  const [accountOpen, setAccountOpen] = useState(false);

  const { user, isSignedIn, signOut, openSignIn, openUserProfile } =
    useClerkData();

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
        "bg-sidebar flex flex-col h-screen transition-all duration-200 ease-in border-r border-sidebar-border text-sidebar-foreground font-sans text-[13px] leading-[160%] shadow-sm",
        open ? "w-[280px]" : "w-[64px]"
      )}
    >
      {/* Header with Logo and Collapse/Expand */}
      <header
        className={cn(
          "relative flex items-center border-b border-sidebar-border h-12",
          open ? "px-3" : "px-2"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-2 transition-all duration-200",
            open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}
        >
          <div className="h-7 w-7 rounded-md bg-muted grid place-items-center text-muted-foreground text-[12px] font-bold">
            A0
          </div>
          <span className="text-sidebar-foreground font-google-sans text-[15px] font-medium tracking-wide">
            Agent-0
          </span>
        </div>

        {/* Toggle Button (always visible, pinned right) */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
          {open ? (
            <button
              className="h-[30px] w-[30px] grid place-items-center rounded-md hover:bg-sidebar-accent/10 transition-colors text-muted-foreground"
              aria-label="Collapse left panel"
              title="Collapse"
              onClick={() => setOpen(false)}
            >
              <RiSidebarFoldLine />
            </button>
          ) : (
            <button
              className="h-[30px] w-[30px] grid place-items-center rounded-md hover:bg-sidebar-accent/10 transition-colors text-muted-foreground"
              aria-label="Expand left panel"
              title="Expand"
              onClick={() => setOpen(true)}
            >
              <RiSidebarUnfoldLine />
            </button>
          )}
        </div>
      </header>

      {/* Main Nav */}
      <nav className="py-2">
        {/* Icon-only rail when collapsed */}
        {!open && (
          <ul className="flex flex-col items-center gap-1">
            <li>
              <button
                className={cn(
                  "relative group w-10 h-9 rounded-md grid place-items-center text-sidebar-foreground/70 hover:bg-sidebar-accent/10",
                  active === "tasks" &&
                    "text-sidebar-foreground bg-muted before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:bg-primary before:rounded"
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
                  "relative group w-10 h-9 rounded-md grid place-items-center text-sidebar-foreground/70 hover:bg-sidebar-accent/10",
                  active === "notes" &&
                    "text-sidebar-foreground bg-muted before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:bg-primary before:rounded"
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
                  "relative group w-10 h-9 rounded-md grid place-items-center text-sidebar-foreground/70 hover:bg-sidebar-accent/10",
                  active === "focus" &&
                    "text-sidebar-foreground bg-muted before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:bg-primary before:rounded"
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
                  "relative group w-10 h-9 rounded-md grid place-items-center text-sidebar-foreground/70 hover:bg-sidebar-accent/10",
                  active === "library" &&
                    "text-sidebar-foreground bg-muted before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:bg-primary before:rounded"
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
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 py-2">
              Workspace
            </div>
            <ul className="flex flex-col gap-1">
              <li>
                <button
                  className={cn(
                    "relative w-full flex items-center gap-2 rounded-md px-2 py-2 text-sidebar-foreground/80 hover:bg-sidebar-accent/10",
                    active === "tasks" &&
                      "bg-muted text-sidebar-foreground before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:bg-primary before:rounded"
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
                    "relative w-full flex items-center gap-2 rounded-md px-2 py-2 text-sidebar-foreground/80 hover:bg-sidebar-accent/10",
                    active === "notes" &&
                      "bg-muted text-sidebar-foreground before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:bg-primary before:rounded"
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
                    "relative w-full flex items-center gap-2 rounded-md px-2 py-2 text-sidebar-foreground/80 hover:bg-sidebar-accent/10",
                    active === "focus" &&
                      "bg-muted text-sidebar-foreground before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:bg-primary before:rounded"
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
                    "relative w-full flex items-center gap-2 rounded-md px-2 py-2 text-sidebar-foreground/80 hover:bg-sidebar-accent/10",
                    active === "library" &&
                      "bg-muted text-sidebar-foreground before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:bg-primary before:rounded"
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
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 py-2 mt-3">
              History
            </div>
            <ul className="flex flex-col gap-1 max-h-[45vh] overflow-y-auto pr-1">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    className="group w-full text-left rounded-md px-2 py-2 hover:bg-muted hover:ring-1 hover:ring-sidebar-ring"
                    title={h.title}
                  >
                    <div className="flex items-center gap-2">
                      <RiHistoryLine
                        size={16}
                        className="text-muted-foreground group-hover:text-sidebar-foreground/80"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-[13px] text-sidebar-foreground">
                          {h.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {h.subtitle}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Account footer */}
      <div className="mt-auto relative border-t border-sidebar-border bg-sidebar/80">
        {/* Expanded account row */}
        {open ? (
          <div className="p-2">
            <button
              className="w-full flex items-center gap-2 rounded-md px-2 py-2 hover:bg-sidebar-accent/10 text-left"
              aria-label="Account menu"
              onClick={() => setAccountOpen((v) => !v)}
            >
              {/* Avatar from Clerk profile */}
              {isSignedIn && user?.imageUrl ? (
                // Profile photo
                <img
                  src={user.imageUrl}
                  alt={user.fullName ?? user.username ?? "User avatar"}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-sidebar-ring"
                  referrerPolicy="no-referrer"
                />
              ) : (
                // Fallback to initial
                <div className="h-7 w-7 rounded-full bg-muted grid place-items-center text-[11px] text-muted-foreground">
                  {isSignedIn
                    ? (
                        user?.firstName?.[0] ||
                        user?.lastName?.[0] ||
                        "U"
                      ).toUpperCase()
                    : "?"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-sidebar-foreground">
                  {isSignedIn
                    ? user?.fullName || user?.username || "Account"
                    : "Sign in"}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {isSignedIn
                    ? user?.primaryEmailAddress?.emailAddress
                    : "Access your account"}
                </div>
              </div>
            </button>

            {accountOpen && (
              <div className="absolute bottom-12 left-2 right-2 rounded-md border border-sidebar-border bg-sidebar shadow-lg z-10">
                <ul className="py-1">
                  {isSignedIn ? (
                    <>
                      <li>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-muted text-sidebar-foreground/80"
                          onClick={() => {
                            setAccountOpen(false);
                            try {
                              openUserProfile?.();
                            } catch {
                              // no-op fallback if not available
                            }
                          }}
                        >
                          <RiUser3Line size={16} />
                          Manage account
                        </button>
                      </li>
                      <li>
                        <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-muted text-destructive"
                            onClick={() => setAccountOpen(false)}
                          >
                            <RiLogoutBoxRLine size={16} />
                            Logout
                          </button>
                        </SignOutButton>
                      </li>
                    </>
                  ) : (
                    <li>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-muted text-sidebar-foreground/80"
                        onClick={() => {
                          setAccountOpen(false);
                          try {
                            openSignIn?.();
                          } catch {
                            window.location.href = "/";
                          }
                        }}
                      >
                        <RiUser3Line size={16} />
                        Sign in
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : (
          // Collapsed account button (icon-only)
          <div className="p-2 flex justify-center">
            <button
              className="w-10 h-9 rounded-md grid place-items-center text-sidebar-foreground/70 hover:bg-sidebar-accent/10"
              aria-label={isSignedIn ? "Account menu" : "Sign in"}
              onClick={() => {
                if (isSignedIn) setAccountOpen((v) => !v);
                else {
                  try {
                    openSignIn?.();
                  } catch {
                    window.location.href = "/";
                  }
                }
              }}
              title={
                isSignedIn
                  ? user?.fullName || user?.username || "Account"
                  : "Sign in"
              }
            >
              {isSignedIn && user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName ?? user.username ?? "User avatar"}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-sidebar-ring"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <RiUser3Line size={18} />
              )}
            </button>
            {accountOpen && isSignedIn && (
              <div className="absolute bottom-12 left-2 right-2 rounded-md border border-sidebar-border bg-sidebar shadow-lg z-10">
                <ul className="py-1">
                  <li>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-muted text-sidebar-foreground/80"
                      onClick={() => {
                        setAccountOpen(false);
                        try {
                          openUserProfile?.();
                        } catch {
                          // no-op
                        }
                      }}
                    >
                      <RiUser3Line size={16} />
                      Manage account
                    </button>
                  </li>
                  <li>
                    <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-muted text-destructive"
                        onClick={() => setAccountOpen(false)}
                      >
                        <RiLogoutBoxRLine size={16} />
                        Logout
                      </button>
                    </SignOutButton>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
