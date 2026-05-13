import Card from '../Card/Card'
import './Stat.css'

export default function Stat({
  label,
  value,
  hint,
  valueColor,
}: {
  label: string
  value: string
  hint?: React.ReactNode
  valueColor?: string
}) {
  return (
    <Card>
      <div className="stat__label">{label}</div>
      <div
        className="stat__value"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      {hint && <div className="stat__hint">{hint}</div>}
    </Card>
  )
}
