/** Поля формы: текстовое поле и выпадающий список с подписью и ошибкой. */
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'

type FieldShellProps = { label: string; hint?: ReactNode; error?: ReactNode; id: string; children: ReactNode }

function FieldShell({ label, hint, error, id, children }: FieldShellProps) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="field__error" id={`${id}-msg`} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p className="field__hint" id={`${id}-msg`}>
            {hint}
          </p>
        )
      )}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: ReactNode; trailing?: ReactNode }

export function Input({ label, hint, error, trailing, id, className, ...rest }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <FieldShell label={label} hint={hint} error={error} id={inputId}>
      <div className="input-wrap">
        <input
          id={inputId}
          className={`input ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? `${inputId}-msg` : undefined}
          {...rest}
        />
        {trailing && <span className="input-wrap__trailing">{trailing}</span>}
      </div>
    </FieldShell>
  )
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: ReactNode; error?: ReactNode }

export function Select({ label, hint, error, id, className, children, ...rest }: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <FieldShell label={label} hint={hint} error={error} id={selectId}>
      <select
        id={selectId}
        className={`input select ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${selectId}-msg` : undefined}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  )
}
