'use client'

import { useState, useMemo } from 'react'
import { DoulaCard } from './doula-card'
import type { DoulaListItem } from './doula-card'

// ── Constants (mirror onboarding options) ────────────────────────────────────

const SUPPORT_TYPE_OPTIONS = ['Birth', 'Postpartum', 'Both']
const BIRTH_SETTING_OPTIONS = ['Home', 'Midwife-led unit (MLU)', 'Hospital']
const SPECIALISM_OPTIONS = [
  'LGBTQ+ support',
  'Twins & multiples experience',
  'Neurodiversity-affirming support',
  'Miscarriage & infant loss support',
  'Pregnancy after loss support',
  'Support for abortion',
  'Surrogates & intended parents',
  'Fertility support',
  'Postnatal overnight support',
  'VBAC',
]

// ── Types ────────────────────────────────────────────────────────────────────

interface Filters {
  supportType: string[]
  birthSetting: string[]
  location: string
  specialisms: string[]
}

const EMPTY_FILTERS: Filters = {
  supportType: [],
  birthSetting: [],
  location: '',
  specialisms: [],
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

function settingLabel(s: string) {
  if (s.toLowerCase().includes('mlu') || s.toLowerCase().includes('midwife')) return 'MLU'
  return s
}

function hasFilters(f: Filters) {
  return (
    f.supportType.length > 0 ||
    f.birthSetting.length > 0 ||
    f.location.trim().length > 0 ||
    f.specialisms.length > 0
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export function DolaGrid({ doulas }: { doulas: DoulaListItem[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [specialismOpen, setSpecialismOpen] = useState(false)

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return doulas.filter((d) => {
      // Support type — 'Both' doulas match any support type filter
      if (filters.supportType.length > 0) {
        const hasBoth = d.support_types?.includes('Both')
        const matches = hasBoth || filters.supportType.some((t) => d.support_types?.includes(t))
        if (!matches) return false
      }

      // Birth setting
      if (filters.birthSetting.length > 0) {
        const matches = filters.birthSetting.some((s) => d.birth_settings?.includes(s))
        if (!matches) return false
      }

      // Location — case-insensitive substring match
      if (filters.location.trim()) {
        const loc = (d.profiles?.location ?? '').toLowerCase()
        if (!loc.includes(filters.location.trim().toLowerCase())) return false
      }

      // Specialisms — match any selected
      if (filters.specialisms.length > 0) {
        const matches = filters.specialisms.some((s) => d.specialisms?.includes(s))
        if (!matches) return false
      }

      return true
    })
  }, [doulas, filters])

  const active = hasFilters(filters)

  // ── Empty state (no doulas published at all) ──────────────────────────────

  if (doulas.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <svg
            className="h-7 w-7 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75Zm4.875 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          We&apos;re hand-picking the first doulas on The Doula Hive.
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          You&apos;ll be the first to know when they&apos;re ready.
        </p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Find a doula</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {doulas.length} doula{doulas.length !== 1 ? 's' : ''} on The Doula Hive
        </p>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5">

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex w-full items-center justify-between sm:hidden"
          onClick={() => setFiltersOpen((o) => !o)}
        >
          <span className="text-sm font-medium text-foreground">
            Filters{active ? ' (active)' : ''}
          </span>
          <svg
            className={`h-4 w-4 text-muted-foreground transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Filter controls */}
        <div className={`${filtersOpen ? 'mt-4' : 'hidden'} sm:block`}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {/* Location */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Location</label>
              <input
                type="text"
                placeholder="e.g. London"
                value={filters.location}
                onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Support type */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-foreground">Support type</p>
              <div className="flex flex-wrap gap-2">
                {SUPPORT_TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({ ...f, supportType: toggle(f.supportType, t) }))
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                      filters.supportType.includes(t)
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-transparent text-foreground hover:bg-muted'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Birth setting */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-foreground">Birth setting</p>
              <div className="flex flex-wrap gap-2">
                {BIRTH_SETTING_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setFilters((f) => ({ ...f, birthSetting: toggle(f.birthSetting, s) }))
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                      filters.birthSetting.includes(s)
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-transparent text-foreground hover:bg-muted'
                    }`}
                  >
                    {settingLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            {/* Specialisms — collapsible multi-select */}
            <div>
              <button
                type="button"
                className="mb-1.5 flex w-full items-center justify-between text-xs font-medium text-foreground"
                onClick={() => setSpecialismOpen((o) => !o)}
              >
                <span>
                  Specialism
                  {filters.specialisms.length > 0 && (
                    <span className="ml-1 text-muted-foreground">
                      ({filters.specialisms.length})
                    </span>
                  )}
                </span>
                <svg
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${specialismOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {specialismOpen && (
                <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-background p-2">
                  {SPECIALISM_OPTIONS.map((s) => (
                    <label
                      key={s}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={filters.specialisms.includes(s)}
                        onChange={() =>
                          setFilters((f) => ({
                            ...f,
                            specialisms: toggle(f.specialisms, s),
                          }))
                        }
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      {s}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clear filters */}
          {active && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm font-medium text-foreground">No doulas match those filters.</p>
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="mt-2 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doula) => (
            <DoulaCard key={doula.id} doula={doula} />
          ))}
        </div>
      )}
    </div>
  )
}
