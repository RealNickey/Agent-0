import ArcCountdown from "@/components/arc-countdown"

export default function Page() {
  return (
    <main className="relative min-h-screen w-screen text-black flex items-center justify-center overflow-hidden">
      {/* Background image overlay at 20% opacity */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-center bg-cover opacity-20"
        style={{ backgroundImage: "url(/images/bg-cover.png)" }}
      />

      {/* Hidden reference image (not rendered visually) */}
      <img
        src="/images/reference.png"
        alt=""
        aria-hidden="true"
        className="hidden"
      />

      {/* Content */}
      <div className="relative z-10">
        <ArcCountdown initialSeconds={2 * 60 + 20} />
      </div>
    </main>
  )
}
