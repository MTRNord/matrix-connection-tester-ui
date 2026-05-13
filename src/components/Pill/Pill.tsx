import './Pill.css'

export default function Pill({
  kind = 'ink',
  dot = false,
  children,
}: {
  kind?: string
  dot?: boolean
  children: React.ReactNode
}) {
  return (
    <span className={'pill ' + kind}>
      {dot && <span className="dot" aria-hidden="true" />}
      {children}
    </span>
  )
}
