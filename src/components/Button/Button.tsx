import './Button.css'

export default function Button({
  kind = 'solid',
  size = 'md',
  block,
  as: Tag = 'button',
  className = '',
  children,
  ...rest
}: {
  kind?: 'solid' | 'ghost' | 'danger'
  size?: 'md' | 'small'
  block?: boolean
  as?: React.ElementType
  className?: string
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = [
    'btn',
    kind === 'ghost' ? 'ghost' : null,
    kind === 'danger' ? 'danger' : null,
    size === 'small' ? 'small' : null,
    block ? 'block' : null,
    className || null,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  )
}
