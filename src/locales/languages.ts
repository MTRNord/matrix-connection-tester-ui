export const LANGS = [
  { code: 'en', native: 'English' },
  { code: 'de', native: 'Deutsch' },
] as const

export type LangCode = (typeof LANGS)[number]['code']
