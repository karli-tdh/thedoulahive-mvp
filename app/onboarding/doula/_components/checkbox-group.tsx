'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'

interface CheckboxGroupProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  searchable?: boolean
}

function CheckboxItem({
  option,
  checked,
  onToggle,
}: {
  option: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-0.5">
      {/* Hidden native input keeps keyboard/form behaviour */}
      <div className="relative h-4 w-4 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        {/* Custom visual */}
        <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors duration-150 ${
          checked
            ? 'border-brand-orange bg-brand-orange'
            : 'border-border bg-cotton'
        }`}>
          {checked && (
            <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5" aria-hidden>
              <path d="M1 4l2.5 2.5L9 1" stroke="#07403B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm leading-snug">{option}</span>
    </label>
  )
}

export function CheckboxGroup({
  options,
  selected,
  onChange,
  searchable = false,
}: CheckboxGroupProps) {
  const [search, setSearch] = useState('')

  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    )
  }

  const filtered = searchable
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options

  if (searchable) {
    return (
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Search languages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="h-52 overflow-y-auto rounded-md border border-border px-3 py-2 space-y-0.5">
          {filtered.map((option) => (
            <CheckboxItem
              key={option}
              option={option}
              checked={selected.includes(option)}
              onToggle={() => toggle(option)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">
              No languages match &ldquo;{search}&rdquo;
            </p>
          )}
        </div>
        {selected.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selected.length} selected
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {options.map((option) => (
        <CheckboxItem
          key={option}
          option={option}
          checked={selected.includes(option)}
          onToggle={() => toggle(option)}
        />
      ))}
    </div>
  )
}
