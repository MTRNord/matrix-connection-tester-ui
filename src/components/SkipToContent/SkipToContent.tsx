import { useTranslation } from 'react-i18next'
import './SkipToContent.css'

export default function SkipToContent() {
  const { t } = useTranslation()
  return (
    <a href="#main" className="skip-to-content">
      {t('nav.skipToContent')}
    </a>
  )
}
