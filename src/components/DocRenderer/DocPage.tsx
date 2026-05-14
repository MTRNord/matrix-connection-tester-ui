import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DocRenderer from './DocRenderer'

// All markdown doc files registered at build time for lazy loading.
// Vite resolves these statically; the runtime picks the right one.
const docModules = import.meta.glob('/src/docs/**/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

export default function DocPage({ docPath }: { docPath: string }) {
  const { i18n } = useTranslation()
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    const lang = i18n.language.split('-')[0]
    const localePath = `/src/docs/${lang}/${docPath}.md`
    const fallbackPath = `/src/docs/en/${docPath}.md`

    const loader = docModules[localePath] ?? docModules[fallbackPath]
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (loader) {
      loader().then(setContent)
    } else {
      setContent('')
    }
  }, [docPath, i18n.language])

  if (content === null) return null
  return <DocRenderer content={content} />
}
