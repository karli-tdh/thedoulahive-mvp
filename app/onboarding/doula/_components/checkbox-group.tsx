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
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 shrink-0 rounded border-border accent-brand-orange"
      />
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
