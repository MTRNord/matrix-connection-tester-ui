import { cloneElement } from 'react'
import type { HTMLAttributes, ReactElement } from 'react'
import './Field.css'

export default function Field({
  id,
  label,
  hint,
  children,
}: {
  id?: string
  label?: string
  hint?: ReactElement
  children: ReactElement<HTMLAttributes<HTMLElement>>
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <div className="field__hint" id={id + '-hint'}>
          {hint}
        </div>
      )}
      {cloneElement(children, {
        id,
        'aria-describedby': hint ? id + '-hint' : undefined,
      })}
    </div>
  )
}
