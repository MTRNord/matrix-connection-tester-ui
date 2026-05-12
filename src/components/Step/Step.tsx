import './Step.css'

export default function Step({
  icon = 'ok',
  iconText,
  title,
  detail,
  ...rest
}: {
  icon?: 'ok' | 'bad' | 'warn' | 'num' | 'pending'
  iconText?: string
  title?: string
  detail?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="step" {...rest}>
      <div className={'step__icon ' + icon} aria-hidden="true">
        {iconText || ''}
      </div>
      <div style={{ flex: 1 }}>
        <h4 className="step__title">{title}</h4>
        <div className="step__detail">{detail}</div>
      </div>
    </div>
  )
}
