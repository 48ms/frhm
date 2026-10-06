"use client"

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 flex flex-col items-center justify-center h-64">
      <p>Error loading widget</p>
      <button onClick={reset} className="mt-2 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm">
        Retry
      </button>
    </div>
  )
}
