'use client'

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', color: '#dc2626' }}>
      <h1>Oops!</h1>
      <p>Something went wrong.</p>
      <details>
        <summary>View error details</summary>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{error.message}</pre>
      </details>
    </div>
  )
}
