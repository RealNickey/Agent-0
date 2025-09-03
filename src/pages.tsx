import { MovieCard } from "@/components/movie-card"

export default function Home() {
  const sampleMovie = {
    id: 1,
    title: "Dune: Part Two",
    genre: "Sci-Fi • Adventure",
    rating: 8.9,
    duration: "2h 46m",
    year: 2024,
    poster: "https://via.placeholder.com/600x400?text=Dune+Part+Two",
    backdrop: "https://via.placeholder.com/1200x800?text=Dune+Part+Two",
    description:
      "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he must prevent a terrible future only he can foresee.",
    director: "Denis Villeneuve",
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="flex items-center justify-center">
        <MovieCard movie={sampleMovie} />
      </div>
    </main>
  )
}
