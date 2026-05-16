import './LanguageMenu.css'
import { useTranslation } from 'react-i18next'
import { LANGS } from '../../locales/languages'

export default function LanguageMenu({
  currentLang,
  onPick,
  onClose,
}: {
  currentLang: string
  onPick: (code: string) => void
  onClose?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="langmenu" role="menu" aria-label={t('lang.choose')}>
      <div className="langmenu__title">{t('lang.choose')}</div>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          role="menuitemradio"
          aria-checked={l.code === currentLang}
          className={
            'langmenu__item' + (l.code === currentLang ? ' is-active' : '')
          }
          onClick={() => {
            onPick(l.code)
            onClose?.()
          }}
        >
          <span>{l.native}</span>
          {l.code === currentLang && (
            // eslint-disable-next-line i18next/no-literal-string
            <span className="langmenu__check" aria-hidden="true">
              ✓
            </span>
          )}
        </button>
      ))}
      <div className="langmenu__divider" />
      <a
        className="langmenu__cta"
        href="https://weblate.mtrnord.blog/projects/matrix-connectivity-tester/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>{t('lang.helpTranslate')}</span>
        <span aria-hidden="true">→</span>
      </a>
    </div>
  )
}
