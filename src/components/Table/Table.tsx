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
    <div className="table-wrap">
      <table
        className={['table', className].filter(Boolean).join(' ')}
        {...rest}
      >
        {children}
      </table>
    </div>
  )
}
