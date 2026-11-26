'use client'
import { useState, type ReactNode } from 'react'

export default function Tabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [i, setI] = useState(0)
  return (
    <div>
      <div className="no-print mb-4 flex gap-1 border-b border-line" role="tablist">
        {tabs.map((t, k) => (
          <button key={t.label} role="tab" aria-selected={i === k} onClick={() => setI(k)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm transition ${i === k ? 'border-violet text-ink' : 'border-transparent text-mute hover:text-ink'}`}>{t.label}</button>
        ))}
      </div>
      <div key={i}>{tabs[i].content}</div>
    </div>
  )
}
