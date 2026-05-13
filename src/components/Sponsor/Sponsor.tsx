import { HeartIcon } from 'lucide-react'
import './Sponsor.css'
import { useTranslation } from 'react-i18next'

export default function Sponsor({
  enabled = true,
  text,
  links = [
    {
      label: 'Liberapay',
      href: 'https://liberapay.com/MTRNord',
      primary: true,
    },
    { label: 'GitHub Sponsors', href: 'https://github.com/sponsors/MTRNord' },
  ],
}: {
  enabled?: boolean
  text?: string
  links?: { label: string; href: string; primary?: boolean }[]
}) {
  const { t } = useTranslation()
  if (!enabled) return null
  return (
    <div
      className="sponsor"
      role="complementary"
      aria-label={t('sponsor.ariaLabel')}
    >
      <HeartIcon className="sponsor__heart" />
      <span>{text ?? t('sponsor.text')}</span>
      <span className="sponsor__links">
        {links.map((l) => (
          <a
            key={l.label}
            className={
              'sponsor__link' + (l.primary ? ' sponsor__link--primary' : '')
            }
            href={l.href}
            rel="noopener"
          >
            {l.label}
          </a>
        ))}
      </span>
    </div>
  )
}
