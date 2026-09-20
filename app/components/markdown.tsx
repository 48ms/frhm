'use client'

import type { ReactNode } from 'react'

/**
 * A deliberately forgiving markdown renderer for the skill artifacts
 * (brand-profile.md, voice.md, …). Covers what those documents actually
 * use: headings, bold/italic/code, lists, tables, quotes, hr. Dependency
 * free on purpose: the artifacts come from a known template, so pulling
 * in a full markdown engine would be overkill.
 */

function inline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // **bold**, `code`, *italic*: shortest match wins, scanned left to right
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    const k = `${keyBase}-${i++}`
    if (tok.startsWith('**')) nodes.push(<strong key={k}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('`')) nodes.push(<code key={k} className="bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]">{tok.slice(1, -1)}</code>)
    else nodes.push(<em key={k}>{tok.slice(1, -1)}</em>)
    last = m.index + tok.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const out: ReactNode[] = []
  let i = 0
  let key = 0

  const isTableRow = (s: string) => /^\s*\|.*\|\s*$/.test(s)
  const isTableSep = (s: string) => /^\s*\|[\s:|-]+\|\s*$/.test(s)
  const cells = (s: string) =>
    s.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())

  while (i < lines.length) {
    const line = lines[i]
    const k = `m${key++}`

    // blank
    if (!line.trim()) { i++; continue }

    // horizontal rule
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      out.push(<hr key={k} className="border-border my-4" />)
      i++; continue
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const content = inline(h[2], k)
      const cls = {
        1: 'mt-2 mb-3 text-xl font-semibold',
        2: 'mt-5 mb-2 text-base font-semibold',
        3: 'mt-4 mb-1.5 text-sm font-semibold',
        4: 'mt-3 mb-1 text-sm font-medium',
        5: 'mt-3 mb-1 text-xs font-medium uppercase tracking-wide',
        6: 'mt-3 mb-1 text-xs font-medium text-muted-foreground',
      }[level]
      const Tag = (`h${level}`) as 'h1'
      out.push(<Tag key={k} className={cls}>{content}</Tag>)
      i++; continue
    }

    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = cells(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && isTableRow(lines[i])) { rows.push(cells(lines[i])); i++ }
      out.push(
        <div key={k} className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-border border-b">
                {head.map((c, ci) => (
                  <th key={ci} className="px-2 py-1.5 text-left font-medium">{inline(c, `${k}-h${ci}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-border/50 border-b last:border-0">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-2 py-1.5 align-top">{inline(c, `${k}-${ri}-${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++ }
      out.push(
        <blockquote key={k} className="border-border text-muted-foreground my-3 border-l-2 pl-3 text-sm">
          {inline(buf.join(' '), k)}
        </blockquote>
      )
      continue
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, '')); i++
      }
      out.push(
        <ul key={k} className="my-2 ml-4 list-disc space-y-1 text-sm">
          {items.map((it, ii) => <li key={ii}>{inline(it, `${k}-${ii}`)}</li>)}
        </ul>
      )
      continue
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, '')); i++
      }
      out.push(
        <ol key={k} className="my-2 ml-4 list-decimal space-y-1 text-sm">
          {items.map((it, ii) => <li key={ii}>{inline(it, `${k}-${ii}`)}</li>)}
        </ol>
      )
      continue
    }

    const para: string[] = []
    while (
      i < lines.length && lines[i].trim() &&
      !/^(#{1,6})\s+/.test(lines[i]) && !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) && !/^\s*>\s?/.test(lines[i]) &&
      !isTableRow(lines[i]) && !/^\s*(---|\*\*\*|___)\s*$/.test(lines[i])
    ) { para.push(lines[i]); i++ }
    out.push(<p key={k} className="my-2 text-sm leading-relaxed">{inline(para.join(' '), k)}</p>)
  }

  return <div className="text-foreground">{out}</div>
}
