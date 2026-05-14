import type { PropsWithChildren } from 'react'
import './Card.css'

export default function Card({
  variant,
  flush,
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}: PropsWithChildren<{
  variant?: string
  flush?: boolean
  as?: React.ElementType
  className?: string
}> &
  React.HTMLAttributes<HTMLElement> &
  React.FormHTMLAttributes<HTMLFormElement>) {
  const cls = ['card', variant, flush && 'flush', className]
    .filter(Boolean)
    .join(' ')
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  )
}
