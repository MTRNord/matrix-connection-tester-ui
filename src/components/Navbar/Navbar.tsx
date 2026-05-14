import './Navbar.css'
import Wordmark from '../Wordmark/Wordmark'
import { Link, useNavigate } from '@tanstack/react-router'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import LanguageMenu from '../LanguageMenu/LanguageMenu'
import { LANGS } from '../../locales/languages'
import Pill from '../Pill/Pill'
import { useAuth } from '../../contexts/AuthContext'

const NAV_LINKS = (authed: boolean) =>
  [
    { key: 'nav.home', to: '/' },
    { key: 'nav.alerts', to: '/alerts' },
    { key: 'nav.docs', to: '/docs' },
    { key: 'nav.statistics', to: '/statistics' },
    ...(authed ? [{ key: 'nav.account', to: '/account' }] : []),
  ] as const

export default function Navbar({
  defaultLangOpen = false,
}: {
  defaultLangOpen?: boolean
} = {}) {
  const { t, i18n } = useTranslation()
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(defaultLangOpen)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const langCode = i18n.language.split('-')[0]
  const currentLang = LANGS.find((l) => l.code === langCode) ?? LANGS[0]

  const handleToggle = () => {
    if (!open && btnRef.current) {
      setAnchorRect(btnRef.current.getBoundingClientRect())
    }
    setOpen((v) => !v)
  }

  const handlePick = (code: string) => {
    i18n.changeLanguage(code)
  }

  useEffect(() => {
    if (!open) return
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
    const onResize = () => {
      if (btnRef.current) setAnchorRect(btnRef.current.getBoundingClientRect())
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  return (
    <>
      <header className="chrome">
        <div className="chrome__inner">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Wordmark size={20} />
          </Link>
          <nav className="chrome__nav" aria-label="Primary navigation">
            {NAV_LINKS(isAuthenticated).map((item) => (
              <Link
                key={item.key}
                to={item.to}
                activeProps={{ className: 'active' }}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <button
            ref={btnRef}
            type="button"
            className="chrome__lang"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={handleToggle}
          >
            <span>{currentLang.native}</span>
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <span className="caret" aria-hidden="true">
              ▾
            </span>
          </button>

          {isAuthenticated && (
            <button
              type="button"
              className="chrome__signout"
              onClick={async () => {
                await logout()
                navigate({ to: '/' })
              }}
            >
              {t('nav.signOut')}
            </button>
          )}
        </div>
      </header>

      {open &&
        anchorRect &&
        createPortal(
          (() => {
            const POPOVER_WIDTH = 280
            const EDGE_MARGIN = 8
            const rawRight = window.innerWidth - anchorRect.right
            const safeRight = Math.min(
              Math.max(rawRight, EDGE_MARGIN),
              window.innerWidth - POPOVER_WIDTH - EDGE_MARGIN,
            )
            // keep the arrow tip over the button's horizontal centre
            const popoverRightEdgeX = window.innerWidth - safeRight
            const btnCenterX = anchorRect.left + anchorRect.width / 2
            const arrowRight = Math.max(
              8,
              Math.min(popoverRightEdgeX - btnCenterX - 6, POPOVER_WIDTH - 24),
            )
            return (
              <div
                ref={popoverRef}
                className="chrome__lang-popover"
                style={{ top: anchorRect.bottom + 10, right: safeRight }}
              >
                <div
                  className="chrome__lang-arrow"
                  aria-hidden="true"
                  style={{ right: arrowRight }}
                />
                <LanguageMenu
                  currentLang={langCode}
                  onPick={handlePick}
                  onClose={() => setOpen(false)}
                />
              </div>
            )
          })(),
          document.body,
        )}

      <div className="container" style={{ padding: 0 }}>
        <div className="betabar">
          <Pill kind="beta">BETA</Pill>
          <Trans
            i18nKey="nav.betabar"
            parent="span"
            components={{
              forumLink: (
                <a href="https://forum.mtrnord.blog/c/matrix-connectivity-tester/support/6" />
              ),
            }}
          />
        </div>
      </div>
    </>
  )
}
