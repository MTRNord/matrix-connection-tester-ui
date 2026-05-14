import './TimezoneSelect.css'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

const ALL_TIMEZONES = Intl.supportedValuesOf('timeZone')

export default function TimezoneSelect({
  value,
  onChange,
  ariaLabel,
}: {
  value: string
  onChange: (tz: string) => void
  ariaLabel?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = search
    ? ALL_TIMEZONES.filter((z) =>
        z.toLowerCase().includes(search.toLowerCase()),
      )
    : ALL_TIMEZONES

  const handleToggle = () => {
    if (!open && btnRef.current) {
      setAnchorRect(btnRef.current.getBoundingClientRect())
    }
    setOpen((v) => !v)
    setSearch('')
  }

  useEffect(() => {
    if (!open) return

    searchRef.current?.focus()

    // Scroll selected item to top of list
    const active = listRef.current?.querySelector('[aria-selected="true"]')
    if (active) {
      active.scrollIntoView({ block: 'start' })
    }

    const onDown = (e: PointerEvent) => {
      if (!(e.target instanceof Node)) return
      if (
        btnRef.current?.contains(e.target) ||
        popoverRef.current?.contains(e.target)
      )
        return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    // Close on page scroll so the fixed popover doesn't drift from its anchor
    const onScroll = (e: Event) => {
      if (popoverRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }

    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey)
    document.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const popoverStyle: React.CSSProperties = anchorRect
    ? {
        top: anchorRect.bottom + 4,
        left: Math.min(anchorRect.left, window.innerWidth - 328),
      }
    : {}

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="tzselect__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={handleToggle}
      >
        <span className="tzselect__value">{value}</span>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <span className="tzselect__caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open &&
        anchorRect &&
        createPortal(
          <div
            ref={popoverRef}
            className="tzselect__popover"
            style={popoverStyle}
          >
            <div className="tzselect__search-wrap">
              <input
                ref={searchRef}
                type="text"
                className="tzselect__search"
                placeholder="Search timezones…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div
              ref={listRef}
              className="tzselect__list"
              role="listbox"
              aria-label={ariaLabel}
            >
              {filtered.length === 0 ? (
                <div className="tzselect__empty">
                  {t('timezoneSelect.noResults')}
                </div>
              ) : (
                filtered.map((z) => (
                  <button
                    key={z}
                    type="button"
                    role="option"
                    aria-selected={z === value}
                    className={
                      'tzselect__item' + (z === value ? ' is-active' : '')
                    }
                    onClick={() => {
                      onChange(z)
                      setOpen(false)
                      setSearch('')
                    }}
                  >
                    {z}
                    {z === value && (
                      // eslint-disable-next-line i18next/no-literal-string
                      <span className="tzselect__check" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
