import './Wordmark.css'

export default function Wordmark({
  size = 32,
  light = false,
}: {
  size?: number
  light?: boolean
}) {
  return (
    <span
      className="wordmark"
      style={{ fontSize: size, color: light ? 'var(--surface)' : undefined }}
    >
      <span className="mark">
        <span style={{ background: light ? 'var(--surface)' : undefined }} />
        <span style={{ background: light ? 'var(--surface)' : undefined }} />
        <span style={{ background: light ? 'var(--surface)' : undefined }} />
      </span>
      {/* eslint-disable-next-line i18next/no-literal-string -- product name */}
      <span className="name">Connectivity <em>Tester</em></span>
    </span>
  )
}
