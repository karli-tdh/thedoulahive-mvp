'use client'

import { useState, useMemo } from 'react'
import { DoulaCard } from './doula-card'
import type { DoulaListItem } from './doula-card'

// ── Constants (mirror onboarding options) ────────────────────────────────────

const SUPPORT_TYPE_OPTIONS  = ['Birth', 'Postpartum', 'Both']
const BIRTH_SETTING_OPTIONS = ['Home', 'Midwife-led unit (MLU)', 'Hospital']
const SPECIALISM_OPTIONS    = [
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
  supportType:  string[]
  birthSetting: string[]
  location:     string
  specialisms:  string[]
}

const EMPTY_FILTERS: Filters = {
  supportType: [], birthSetting: [], location: '', specialisms: [],
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

// ── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({
  label, active, onClick,
}: {
  label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-abel font-medium transition-colors border-2 ${
        active
          ? 'border-dark-green bg-dark-green text-cotton'
          : 'border-dark-green/40 bg-transparent text-dark-green hover:border-dark-green hover:bg-dark-green/5'
      }`}
    >
      {label}
    </button>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export function DolaGrid({ doulas, welcome = false }: { doulas: DoulaListItem[]; welcome?: boolean }) {
  const [filters, setFilters]         = useState<Filters>(EMPTY_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [specialismOpen, setSpecialismOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(welcome)

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return doulas.filter((d) => {
      if (filters.supportType.length > 0) {
        const hasBoth = d.support_types?.includes('Both')
        const matches = hasBoth || filters.supportType.some((t) => d.support_types?.includes(t))
        if (!matches) return false
      }
      if (filters.birthSetting.length > 0) {
        const matches = filters.birthSetting.some((s) => d.birth_settings?.includes(s))
        if (!matches) return false
      }
      if (filters.location.trim()) {
        const loc = (d.profiles?.location ?? '').toLowerCase()
        if (!loc.includes(filters.location.trim().toLowerCase())) return false
      }
      if (filters.specialisms.length > 0) {
        const matches = filters.specialisms.some((s) => d.specialisms?.includes(s))
        if (!matches) return false
      }
      return true
    })
  }, [doulas, filters])

  const active = hasFilters(filters)

  // ── Empty state ───────────────────────────────────────────────────────────

  if (doulas.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <svg
            className="h-7 w-7 text-muted-foreground"
            fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75Zm4.875 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Z" />
          </svg>
        </div>
        <h2 className="font-arinoe text-2xl text-dark-green">
          We&apos;re hand-picking the first doulas on The Doula Hive.
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground font-abel">
          You&apos;ll be the first to know when they&apos;re ready.
        </p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* Welcome banner */}
      {showWelcome && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border-2 border-dark-green bg-soft-yellow/60 px-5 py-4">
          <p className="text-sm text-dark-green font-abel">
            <span className="font-medium">You&apos;re all set.</span> Start browsing doulas below.
          </p>
          <button
            type="button"
            onClick={() => setShowWelcome(false)}
            aria-label="Dismiss"
            className="shrink-0 text-dark-green/60 hover:text-dark-green"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Page heading */}
      <div className="mb-8">
        <h1 className="font-arinoe text-4xl text-dark-green sm:text-5xl">Find a doula</h1>
        <p className="mt-2 text-sm text-muted-foreground font-abel">
          {doulas.length} doula{doulas.length !== 1 ? 's' : ''} on The Doula Hive
        </p>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="mb-8 rounded-xl border-2 border-dark-green bg-card p-4 sm:p-5">

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex w-full items-center justify-between sm:hidden"
          onClick={() => setFiltersOpen((o) => !o)}
        >
          <span className="text-sm font-abel font-medium text-dark-green">
            Filters{active ? ' (active)' : ''}
          </span>
          <svg
            className={`h-4 w-4 text-dark-green/60 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Filter controls */}
        <div className={`${filtersOpen ? 'mt-4' : 'hidden'} sm:block`}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {/* Location */}
            <div>
              <label className="mb-1.5 block text-xs font-abel font-medium text-dark-green">Location</label>
              <input
                type="text"
                placeholder="e.g. London"
                value={filters.location}
                onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-lg border-2 border-dark-green/40 bg-white px-3 py-2 text-sm font-abel text-dark-green placeholder:text-dark-green/40 focus:outline-none focus:border-dark-green"
              />
            </div>

            {/* Support type */}
            <div>
              <p className="mb-1.5 text-xs font-abel font-medium text-dark-green">Support type</p>
              <div className="flex flex-wrap gap-2">
                {SUPPORT_TYPE_OPTIONS.map((t) => (
                  <FilterChip
                    key={t}
                    label={t}
                    active={filters.supportType.includes(t)}
                    onClick={() => setFilters((f) => ({ ...f, supportType: toggle(f.supportType, t) }))}
                  />
                ))}
              </div>
            </div>

            {/* Birth setting */}
            <div>
              <p className="mb-1.5 text-xs font-abel font-medium text-dark-green">Birth setting</p>
              <div className="flex flex-wrap gap-2">
                {BIRTH_SETTING_OPTIONS.map((s) => (
                  <FilterChip
                    key={s}
                    label={settingLabel(s)}
                    active={filters.birthSetting.includes(s)}
                    onClick={() => setFilters((f) => ({ ...f, birthSetting: toggle(f.birthSetting, s) }))}
                  />
                ))}
              </div>
            </div>

            {/* Specialisms — collapsible */}
            <div>
              <button
                type="button"
                className="mb-1.5 flex w-full items-center justify-between text-xs font-abel font-medium text-dark-green"
                onClick={() => setSpecialismOpen((o) => !o)}
              >
                <span>
                  Specialism
                  {filters.specialisms.length > 0 && (
                    <span className="ml-1 text-dark-green/60">({filters.specialisms.length})</span>
                  )}
                </span>
                <svg
                  className={`h-3.5 w-3.5 text-dark-green/60 transition-transform ${specialismOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {specialismOpen && (
                <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border-2 border-dark-green/30 bg-white p-2">
                  {SPECIALISM_OPTIONS.map((s) => (
                    <label
                      key={s}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs font-abel text-dark-green hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={filters.specialisms.includes(s)}
                        onChange={() => setFilters((f) => ({ ...f, specialisms: toggle(f.specialisms, s) }))}
                        className="h-3.5 w-3.5 accent-dark-green"
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
                className="text-xs font-abel text-dark-green/60 underline underline-offset-4 hover:text-dark-green"
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
          <p className="text-sm font-abel font-medium text-dark-green">No doulas match those filters.</p>
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="mt-2 text-sm font-abel text-dark-green/60 underline underline-offset-4 hover:text-dark-green"
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
