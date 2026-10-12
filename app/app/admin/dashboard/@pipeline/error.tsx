"use client"

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive flex flex-col items-center justify-center h-64">
      <p>Error loading widget</p>
      <button onClick={reset} className="mt-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm hover:bg-destructive/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2">
        Retry
      </button>
    </div>
  )
}
