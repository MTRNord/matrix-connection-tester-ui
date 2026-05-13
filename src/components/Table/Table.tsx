import './Table.css'

export default function Table({
  className = '',
  children,
  ...rest
}: {
  className?: string
  children: React.ReactNode
} & React.HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={['table', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </table>
  )
}
