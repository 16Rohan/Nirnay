import React from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null

  // Function to render inline formatting (bold, italic, inline code, status tags)
  const renderInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    let keyIdx = 0

    // Tokenize inline markdown: `code`, **bold**, *italic*, [TAG]
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+(?!\*)|(?<!_)_[^_]+(?!_)|\[(CRITICAL|HIGH|MEDIUM|LOW|SUCCESS|WARNING|BLUE|RED|VICTORY|DEFEAT|TERMINAL)\])/g

    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<React.Fragment key={`text-${keyIdx++}`}>{text.substring(lastIndex, match.index)}</React.Fragment>)
      }

      const token = match[0]
      if (token.startsWith('`') && token.endsWith('`')) {
        const codeText = token.slice(1, -1)
        parts.push(
          <code key={`code-${keyIdx++}`} className="bg-slate-800/90 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-[11px] border border-cyan-500/20">
            {codeText}
          </code>
        )
      } else if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
        const boldText = token.slice(2, -2)
        parts.push(
          <strong key={`bold-${keyIdx++}`} className="font-bold text-white">
            {boldText}
          </strong>
        )
      } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
        const italicText = token.slice(1, -1)
        parts.push(
          <em key={`italic-${keyIdx++}`} className="italic text-slate-300">
            {italicText}
          </em>
        )
      } else if (token.startsWith('[') && token.endsWith(']')) {
        const tag = token.slice(1, -1)
        let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700'
        if (['CRITICAL', 'HIGH', 'RED', 'DEFEAT'].includes(tag)) badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-500/40'
        else if (['MEDIUM', 'WARNING'].includes(tag)) badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-500/40'
        else if (['LOW', 'SUCCESS', 'BLUE', 'VICTORY'].includes(tag)) badgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
        else if (['TERMINAL'].includes(tag)) badgeColor = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'

        parts.push(
          <span key={`badge-${keyIdx++}`} className={`inline-block px-1.5 py-0.5 mx-1 rounded text-[10px] font-mono font-bold tracking-wider border ${badgeColor}`}>
            {tag}
          </span>
        )
      }

      lastIndex = tokenRegex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push(<React.Fragment key={`text-${keyIdx++}`}>{text.substring(lastIndex)}</React.Fragment>)
    }

    return parts
  }

  // Parse blocks
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let blockIdx = 0

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    // 1. Code Block ```
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      if (i < lines.length) i++ // skip ending ```
      blocks.push(
        <div key={`codeblock-${blockIdx++}`} className="my-3 bg-[#020B14] border border-slate-800 rounded-lg overflow-hidden shadow-inner">
          {language && (
            <div className="bg-slate-900 px-3 py-1 text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider border-b border-slate-800 flex justify-between">
              <span>{language}</span>
              <span className="text-slate-500">CODE SNIPPET</span>
            </div>
          )}
          <pre className="p-3 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
            {codeLines.join('\n')}
          </pre>
        </div>
      )
      continue
    }

    // 2. Headings (#, ##, ###, ####)
    if (trimmed.startsWith('#')) {
      let level = 0
      while (level < trimmed.length && trimmed[level] === '#') level++
      const headingText = trimmed.slice(level).trim()

      if (level === 1) {
        blocks.push(
          <div key={`h1-${blockIdx++}`} className="mt-6 mb-3 border-b border-emerald-500/30 pb-2">
            <h1 className="text-lg font-display font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {headingText}
            </h1>
          </div>
        )
      } else if (level === 2) {
        blocks.push(
          <div key={`h2-${blockIdx++}`} className="mt-5 mb-2.5 border-b border-slate-800 pb-1.5">
            <h2 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <span className="text-cyan-400 font-normal">//</span>
              {renderInline(headingText)}
            </h2>
          </div>
        )
      } else if (level === 3) {
        blocks.push(
          <h3 key={`h3-${blockIdx++}`} className="mt-4 mb-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-emerald-500">▸</span>
            {renderInline(headingText)}
          </h3>
        )
      } else {
        blocks.push(
          <h4 key={`h4-${blockIdx++}`} className="mt-3 mb-1.5 text-xs font-mono font-bold text-slate-200">
            {renderInline(headingText)}
          </h4>
        )
      }
      i++
      continue
    }

    // 3. Horizontal Rule (---, ***, ___)
    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      blocks.push(
        <hr key={`hr-${blockIdx++}`} className="my-4 border-slate-800 shadow-[0_1px_0_rgba(66,199,255,0.1)]" />
      )
      i++
      continue
    }

    // 4. Blockquote (>)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().slice(1).trim())
        i++
      }
      blocks.push(
        <blockquote key={`quote-${blockIdx++}`} className="my-3 border-l-2 border-cyan-500 bg-cyan-950/20 p-3 rounded-r text-xs font-mono text-cyan-100 space-y-1">
          {quoteLines.map((ql, qidx) => (
            <p key={qidx}>{renderInline(ql)}</p>
          ))}
        </blockquote>
      )
      continue
    }

    // 5. Table (| Header | Header |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableRows: string[][] = []
      let hasHeaderSeparator = false

      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        const curRow = lines[i].trim()
        if (/^\|[\s-:]+(\|[\s-:]+)+\|$/.test(curRow)) {
          hasHeaderSeparator = true
        } else {
          const cells = curRow.split('|').slice(1, -1).map((c) => c.trim())
          tableRows.push(cells)
        }
        i++
      }

      if (tableRows.length > 0) {
        const headerRow = hasHeaderSeparator ? tableRows[0] : null
        const bodyRows = hasHeaderSeparator ? tableRows.slice(1) : tableRows

        blocks.push(
          <div key={`table-${blockIdx++}`} className="my-4 overflow-x-auto border border-slate-800 rounded-lg bg-[#030D18]">
            <table className="w-full text-left font-mono text-xs border-collapse">
              {headerRow && (
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-700">
                    {headerRow.map((cell, cidx) => (
                      <th key={cidx} className="p-2.5 text-cyan-400 font-bold uppercase tracking-wider text-[11px] border-r border-slate-800 last:border-r-0">
                        {renderInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {bodyRows.map((row, ridx) => (
                  <tr key={ridx} className="border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors last:border-b-0">
                    {row.map((cell, cidx) => (
                      <td key={cidx} className="p-2.5 text-slate-200 border-r border-slate-800/80 last:border-r-0">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    // 6. Unordered & Ordered Lists (- , * , + , 1. , 2. )
    const isUnordered = /^[-*+]\s+/.test(trimmed)
    const isOrdered = /^\d+\.\s+/.test(trimmed)

    if (isUnordered || isOrdered) {
      const listItems: { text: string; isOrdered: boolean; num?: string }[] = []
      const listType = isOrdered ? 'ordered' : 'unordered'

      while (i < lines.length) {
        const curTrim = lines[i].trim()
        const matchUn = curTrim.match(/^[-*+]\s+(.*)/)
        const matchOrd = curTrim.match(/^(\d+)\.\s+(.*)/)

        if (listType === 'unordered' && matchUn) {
          listItems.push({ text: matchUn[1], isOrdered: false })
          i++
        } else if (listType === 'ordered' && matchOrd) {
          listItems.push({ text: matchOrd[2], isOrdered: true, num: matchOrd[1] })
          i++
        } else {
          break
        }
      }

      blocks.push(
        <div key={`list-${blockIdx++}`} className="my-2.5 space-y-1.5 font-mono text-xs text-slate-200 pl-1">
          {listItems.map((item, lidx) => (
            <div key={lidx} className="flex items-start gap-2.5 leading-relaxed">
              {item.isOrdered ? (
                <span className="text-cyan-400 font-bold text-[11px] min-w-[1.2rem] pt-0.5">{item.num}.</span>
              ) : (
                <span className="text-emerald-400 font-bold text-[10px] min-w-[0.75rem] pt-1">▪</span>
              )}
              <div className="flex-1">{renderInline(item.text)}</div>
            </div>
          ))}
        </div>
      )
      continue
    }

    // 7. Standard Paragraph
    blocks.push(
      <p key={`p-${blockIdx++}`} className="my-2 text-xs font-mono text-slate-300 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    )
    i++
  }

  return <div className={`space-y-1 ${className}`}>{blocks}</div>
}
