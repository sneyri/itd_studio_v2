/** Сегментированный переключатель (вкладки-«пилюли»). */
type TabOption<T extends string> = { value: T; label: string; shortLabel?: string }

type TabsProps<T extends string> = {
  options: ReadonlyArray<TabOption<T>>
  value: T
  onChange: (value: T) => void
  label: string
  size?: 'sm' | 'md'
}

export function Tabs<T extends string>({ options, value, onChange, label, size = 'md' }: TabsProps<T>) {
  return (
    <div className={`tabs tabs--${size}`} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          aria-label={option.label}
          className={`tabs__item ${option.value === value ? 'tabs__item--active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.shortLabel ? (
            <>
              <span className="tabs__label-full">{option.label}</span>
              <span className="tabs__label-short" aria-hidden="true">
                {option.shortLabel}
              </span>
            </>
          ) : (
            option.label
          )}
        </button>
      ))}
    </div>
  )
}
