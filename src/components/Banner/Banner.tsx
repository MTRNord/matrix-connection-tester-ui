import './Banner.css'

export default function Banner({
  kind = 'info',
  icon,
  title,
  children,
  action,
}: {
  kind?: 'ok' | 'warn' | 'bad' | 'info'
  icon?: React.ReactNode
  title?: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
}) {
  const defaultIcon = { ok: '✓', warn: '!', bad: '×', info: 'i' }[kind] || 'i'
  return (
    <div
      className={'banner ' + kind}
      role={kind === 'bad' ? 'alert' : 'status'}
    >
      <div className="banner__icon" aria-hidden="true">
        {icon || defaultIcon}
      </div>
      <div style={{ flex: 1 }}>
        <div className="banner__title">{title}</div>
        <div className="banner__body">{children}</div>
      </div>
      {action}
    </div>
  )
}
