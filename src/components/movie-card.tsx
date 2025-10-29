"use client";

import { useState, type CSSProperties } from "react";
import { Clock, Calendar, Star } from "lucide-react";
import { motion } from "framer-motion";
import * as HoverCard from "@radix-ui/react-hover-card";

interface Movie {
  id: number;
  title: string;
  genre: string;
  rating: number;
  duration: string;
  year: number;
  poster: string;
  backdrop: string;
  description: string;
  director: string;
}

interface MovieCardProps {
  movie: Movie;
}

const buildReelgoodUrl = (title: string, year: number) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return `https://reelgood.com/movie/${slug}-${year}`;
};

export function MovieCard({ movie }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const progressiveBlurMask =
    "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 55%, rgba(0,0,0,0.45) 75%, rgba(0,0,0,1) 100%)";

  const defaultBlurMaskStyle: CSSProperties = {
    maskImage: progressiveBlurMask,
    WebkitMaskImage: progressiveBlurMask,
  };

  return (
    <HoverCard.Root openDelay={0} closeDelay={120} onOpenChange={setIsHovered}>
      <HoverCard.Trigger asChild>
        <a
          href={buildReelgoodUrl(movie.title, movie.year)}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          aria-label={`Open ${movie.title} on Reelgood`}
        >
          <motion.div
            className="relative w-80 h-[520px] cursor-pointer"
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            <div className="relative w-full h-full overflow-hidden rounded-3xl">
              <div className="absolute inset-0">
                <img
                  src={
                    movie.poster && movie.poster.trim().length > 0
                      ? movie.poster
                      : `/placeholder.svg?height=520&width=320&query=${encodeURIComponent(
                          `${movie.title} movie poster cinematic`
                        )}`
                  }
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />

                <motion.div
                  className="absolute inset-0"
                  style={
                    {
                      ...(isHovered ? {} : defaultBlurMaskStyle),
                      WebkitBackdropFilter: isHovered
                        ? "blur(12px)"
                        : "blur(6px)",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    } as CSSProperties
                  }
                  animate={{
                    background: isHovered
                      ? "linear-gradient(to bottom, rgba(12,12,20,0.55), rgba(8,8,16,0.75))"
                      : "linear-gradient(to bottom, rgba(8,8,14,0.08), rgba(8,8,16,0.45))",
                    backdropFilter: isHovered ? "blur(12px)" : "blur(6px)",
                    opacity: isHovered ? 0.95 : 0.85,
                  }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />

                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-purple-500/15 via-transparent to-blue-500/10"
                  animate={{ opacity: isHovered ? 0.55 : 0.35 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />

                <div className="absolute top-3 right-3 z-10">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 text-yellow-200 text-xs font-medium">
                    <Star className="w-3 h-3 text-yellow-200" />
                    <span>
                      {Number.isFinite(movie.rating)
                        ? movie.rating.toFixed(1)
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <motion.div
                className="absolute inset-0"
                style={isHovered ? undefined : defaultBlurMaskStyle}
                animate={{
                  backgroundColor: isHovered
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.03)",
                }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              />

              <div className="relative h-full flex flex-col justify-end p-8">
                <motion.div
                  initial={false}
                  animate={{ opacity: isHovered ? 0 : 1, y: isHovered ? 6 : 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-semibold text-white drop-shadow-xl">
                      {movie.title}
                    </h2>
                    <div className="flex justify-center">
                      <div className="px-4 py-1.5 rounded-full border border-white/15 text-white/85 text-sm backdrop-blur-sm">
                        {movie.genre}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute inset-x-8 bottom-8"
                  initial={false}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    y: isHovered ? 0 : 12,
                  }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="text-center space-y-4 text-white/90">
                    <h3 className="text-2xl font-semibold">{movie.title}</h3>
                    {movie.description && (
                      <p className="text-xs leading-relaxed text-white/80 line-clamp-3">
                        {movie.description}
                      </p>
                    )}
                    <div className="text-white/70 text-xs font-medium">
                      Directed by {movie.director}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-white/75">
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.08] backdrop-blur-sm">
                        <Clock className="w-3 h-3" />
                        <span>{movie.duration}</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.08] backdrop-blur-sm">
                        <Calendar className="w-3 h-3" />
                        <span>{movie.year}</span>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.08] text-white/80 text-xs font-medium">
                      {movie.genre}
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                className="absolute inset-0 rounded-3xl ring-1 ring-white/20"
                animate={{ opacity: isHovered ? 0.35 : 0.18 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </motion.div>
        </a>
      </HoverCard.Trigger>
    </HoverCard.Root>
  );
}
