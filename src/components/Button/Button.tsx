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
  kind?: 'solid' | 'ghost'
  size?: 'md' | 'small'
  block?: boolean
  as?: React.ElementType
  className?: string
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = [
    'btn',
    kind === 'ghost' && 'ghost',
    size === 'small' && 'small',
    block && 'block',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  )
}
