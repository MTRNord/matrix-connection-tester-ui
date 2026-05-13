import './Disclosure.css'

function Chevron() {
  return (
    <svg
      className="disclosure__chevron"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7.5 5 L12.5 10 L7.5 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Disclosure({
  title,
  hint,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string
  hint?: string
  defaultOpen?: boolean
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <details className="disclosure" open={defaultOpen}>
      <summary>
        <Chevron />
        <div style={{ flex: 1 }}>
          <div className="disclosure__title">{title}</div>
          {hint && <div className="disclosure__hint">{hint}</div>}
        </div>
        {badge}
      </summary>
      {children && <div className="disclosure__body">{children}</div>}
    </details>
  )
}
