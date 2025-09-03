"use client"

import { useState } from "react"
import { Clock, Calendar, Star } from "lucide-react"

interface Movie {
  id: number
  title: string
  genre: string
  rating: number
  duration: string
  year: number
  poster: string
  backdrop: string
  description: string
  director: string
}

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  return (
    <div
      className="group relative w-80 h-[520px] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {/* Main Card */}
      <div
        className={`
        relative w-full h-full rounded-3xl overflow-hidden
        transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
        ${isHovered ? "scale-105" : "scale-100"}
        ${isPressed ? "scale-95" : ""}
      `}
      >
        <div className="absolute inset-0">
          <img
            src={
              movie.poster && movie.poster.trim().length > 0
                ? movie.poster
                : `/placeholder.svg?height=520&width=320&query=${encodeURIComponent(`${movie.title} movie poster cinematic`)}`
            }
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div
            className={`
            absolute inset-0 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
            ${
              isHovered
                ? "bg-gradient-to-b from-black/60 via-black/40 to-black/80 backdrop-blur-md"
                : "bg-gradient-to-b from-black/20 via-black/30 to-black/70 backdrop-blur-[1px]"
            }
            `}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 via-transparent to-blue-500/5" />

          {/* Rating badge */}
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-yellow-300 text-xs font-semibold">
              <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />
              <span>{Number.isFinite(movie.rating) ? movie.rating.toFixed(1) : "-"}</span>
            </div>
          </div>
        </div>

        <div
          className={`
          absolute inset-0 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          ${isHovered ? "bg-white/15 backdrop-blur-xl" : "bg-white/5 backdrop-blur-sm"}
        `}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-8">
          <div
            className={`
            transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
            ${isHovered ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}
          `}
          >
            {/* Default State - Movie Title and Genre */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white drop-shadow-2xl">{movie.title}</h2>
              <div className="flex justify-center">
                <div className="px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium">
                  {movie.genre}
                </div>
              </div>
              {/* Small description (always visible, trimmed) */}
              {movie.description && (
                <p className="text-white/80 text-xs leading-relaxed px-2 line-clamp-2">
                  {movie.description}
                </p>
              )}
            </div>
          </div>

          <div
            className={`
            absolute inset-x-8 bottom-8 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
            ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
          >
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-white drop-shadow-2xl">{movie.title}</h2>

              {/* Description */}
              <p className="text-white/90 text-sm leading-relaxed px-2 line-clamp-3">{movie.description}</p>

              {/* Director */}
              <div className="text-white/80 text-xs font-medium">Directed by {movie.director}</div>

              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-100 text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  <span>{movie.duration}</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-100 text-xs font-medium">
                  <Calendar className="w-3 h-3" />
                  <span>{movie.year}</span>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-xl border border-white/20 text-white/90 text-xs font-medium">
                {movie.genre}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`
          absolute inset-0 rounded-3xl
          ring-1 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${isHovered ? "ring-white/30" : "ring-white/10"}
        `}
        />
      </div>
    </div>
  )
}
