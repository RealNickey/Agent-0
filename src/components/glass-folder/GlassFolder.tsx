import React from "react";

/**
 * GlassFolder
 * A glassmorphic folder SVG with three square "photos" peeking out behind it.
 * Hover: photos float upward; folder tilts forward on the X-axis.
 */
export default function GlassFolder() {
  return (
    <div className="relative select-none" style={{ perspective: "1200px" }}>
      <div className="group relative w-[350px] h-[260px] mx-auto">
        {/* Photos behind the folder */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-[300px] h-[140px] z-0 pointer-events-none">
          {/* Left photo */}
          <div
            className="absolute left-0 top-0 w-[150px] h-[150px] rounded-md border-8 border-white/95 shadow-xl overflow-hidden transform-gpu rotate-[-10deg] transition-transform duration-500 group-hover:translate-x-[-34px] group-hover:-translate-y-14"
            style={{
              backgroundImage: "url('https://via.placeholder.com/160')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backdropFilter: "blur(8px)",
            }}
            aria-hidden
          />

          {/* Middle photo */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-2 w-[170px] h-[170px] rounded-md border-8 border-white/95 shadow-2xl overflow-hidden transform-gpu transition-transform duration-500 group-hover:-translate-y-16"
            style={{
              backgroundImage: "url('https://via.placeholder.com/180')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backdropFilter: "blur(8px)",
            }}
            aria-hidden
          />

          {/* Right photo */}
          <div
            className="absolute right-0 top-0 w-[150px] h-[150px] rounded-md border-8 border-white/95 shadow-lg overflow-hidden transform-gpu rotate-[10deg] transition-transform duration-500 group-hover:translate-x-[34px] group-hover:-translate-y-14"
            style={{
              backgroundImage: "url('https://via.placeholder.com/160')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backdropFilter: "blur(8px)",
            }}
            aria-hidden
          />
        </div>

        {/* Folder (front) */}
        <div className="relative z-10 transform-gpu transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateX(10deg)]">
          <div className="relative">
            {/* The provided folder SVG with glass look */}
            <svg
              className="relative w-[350px] h-[260px] drop-shadow-2xl"
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.35))",
              }}
            >
              <path
                d="M1.50004 22C-1.38507 35.0383 14.7205 266.712 19 279C23.2796 291.288 27.5324 295.564 39.5 297C51.4677 298.436 336.79 300.799 355.5 297C374.21 293.201 379.168 287.641 382 274C384.832 260.359 400.461 95.3823 399 74.5C397.539 53.6177 391.482 47.9575 374.5 45C357.518 42.0425 226 45 212 45C198 45 190.965 39.0491 183 26C175.035 12.9509 172.009 12.5546 165.5 7.5C158.991 2.44544 154.477 1.54683 145.5 2C136.523 2.45317 34.5485 -0.251994 21.5 2C8.45162 4.25199 4.38516 8.96173 1.50004 22Z"
                fill="rgba(255,255,255,0.12)"
                stroke="rgba(255,255,255,0.55)"
              />
              <path
                d="M35 248H364.5M35 262H364.5"
                stroke="white"
                strokeWidth="3"
                opacity={0.75}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
