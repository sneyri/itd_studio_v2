/**
 * Выпадающие списки без сторонних библиотек: Select (один вариант), MultiSelect (несколько)
 * и режим с поиском (searchable → combobox). Общее ядро — DropdownCore.
 *
 * - панель рендерится порталом в <body> с position: fixed, поэтому не обрезается карточками;
 * - открывается вверх, если снизу мало места; не вылезает за правый край экрана;
 * - клавиатура: ↑/↓, Home/End, Enter/Space, Esc, Tab, поиск по первым буквам;
 * - ARIA: role=listbox/option, aria-expanded, aria-activedescendant, aria-selected.
 * Компонент не знает про данные: опции и (для асинхронного поиска) onSearchChange передаёт фича.
 */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { IconCheck, IconChevronDown, IconClose, IconSearch } from './icons'
import { Spinner } from './Spinner'

export type SelectOption<T extends string = string> = {
  value: T
  label: string
  /** вторая строка под названием */
  hint?: ReactNode
  /** иконка/аватар слева */
  icon?: ReactNode
  /** значение справа (например, счётчик) */
  meta?: ReactNode
  /** доп. слова для поиска */
  keywords?: string
  disabled?: boolean
}

type CommonProps<T extends string> = {
  options: ReadonlyArray<SelectOption<T>>
  /** видимая подпись над полем */
  label?: string
  /** подпись для скринридеров, если видимой нет */
  ariaLabel?: string
  placeholder?: string
  hint?: ReactNode
  error?: ReactNode
  disabled?: boolean
  size?: 'sm' | 'md'
  /** поле поиска в панели */
  searchable?: boolean
  searchPlaceholder?: string
  /** асинхронный поиск: фича сама фильтрует options; локальная фильтрация отключается */
  onSearchChange?: (query: string) => void
  loading?: boolean
  emptyText?: string
  className?: string
  id?: string
  /** иконка слева в триггере */
  leadingIcon?: ReactNode
}

export type SelectProps<T extends string> = CommonProps<T> & {
  value: T | null
  onChange: (value: T) => void
  /** показать крестик очистки */
  onClear?: () => void
  /** как показать выбранное значение в триггере (по умолчанию label опции) */
  renderValue?: (option: SelectOption<T>) => ReactNode
}

export type MultiSelectProps<T extends string> = CommonProps<T> & {
  value: ReadonlyArray<T>
  onChange: (value: T[]) => void
  /** текст в триггере, когда выбрано несколько: по умолчанию «N выбрано» */
  summary?: (selected: SelectOption<T>[]) => ReactNode
}

const PANEL_MAX_HEIGHT = 320
const GAP = 6
const MARGIN = 8

type Position = { left: number; width: number; maxWidth: number; top?: number; bottom?: number; maxHeight: number; up: boolean }

function normalize(text: string): string {
  return text.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е')
}

function computePosition(trigger: HTMLElement): Position {
  const rect = trigger.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const below = vh - rect.bottom - GAP - MARGIN
  const above = rect.top - GAP - MARGIN
  const up = below < Math.min(PANEL_MAX_HEIGHT, 220) && above > below
  const narrow = vw <= 640
  const width = rect.width
  const maxWidth = narrow ? width : Math.max(width, Math.min(380, vw - MARGIN * 2))
  const left = Math.max(MARGIN, Math.min(rect.left, vw - MARGIN - maxWidth))
  return {
    left: narrow ? rect.left : left,
    width,
    maxWidth,
    top: up ? undefined : rect.bottom + GAP,
    bottom: up ? vh - rect.top + GAP : undefined,
    maxHeight: Math.max(160, Math.min(PANEL_MAX_HEIGHT, up ? above : below)),
    up,
  }
}

type CoreProps<T extends string> = CommonProps<T> & {
  multiple: boolean
  selected: ReadonlyArray<T>
  onToggle: (value: T) => void
  triggerContent: ReactNode
  hasValue: boolean
  onClear?: () => void
}

function DropdownCore<T extends string>({
  options,
  label,
  ariaLabel,
  placeholder = 'Выберите',
  hint,
  error,
  disabled,
  size = 'md',
  searchable = false,
  searchPlaceholder = 'Поиск…',
  onSearchChange,
  loading = false,
  emptyText = 'Ничего не найдено',
  className,
  id,
  leadingIcon,
  multiple,
  selected,
  onToggle,
  triggerContent,
  hasValue,
  onClear,
}: CoreProps<T>) {
  const autoId = useId()
  const baseId = id ?? autoId
  const listId = `${baseId}-list`
  const labelId = `${baseId}-label`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const typeahead = useRef({ text: '', timer: 0 })

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(-1)
  const [position, setPosition] = useState<Position | null>(null)

  const filtered = useMemo(() => {
    if (!searchable || onSearchChange || !query.trim()) return options
    const q = normalize(query.trim())
    return options.filter((o) => normalize(`${o.label} ${o.value} ${o.keywords ?? ''}`).includes(q))
  }, [options, query, searchable, onSearchChange])

  const selectedSet = useMemo(() => new Set<string>(selected), [selected])

  const updatePosition = useCallback(() => {
    if (triggerRef.current) setPosition(computePosition(triggerRef.current))
  }, [])

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    setQuery('')
    onSearchChange?.('')
    if (restoreFocus) triggerRef.current?.focus()
  }, [onSearchChange])

  const openPanel = useCallback(
    (focusLast = false) => {
      if (disabled) return
      updatePosition()
      setOpen(true)
      const firstSelected = options.findIndex((o) => selectedSet.has(o.value))
      setActive(focusLast ? options.length - 1 : firstSelected >= 0 ? firstSelected : 0)
    },
    [disabled, options, selectedSet, updatePosition],
  )

  // позиция при прокрутке/ресайзе и закрытие по клику вне
  useLayoutEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      close(false)
    }
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open, updatePosition, close])

  // фокус внутрь панели при открытии
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      if (searchable) searchRef.current?.focus()
      else listRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open, searchable])

  // активная опция всегда видна
  useEffect(() => {
    if (!open || active < 0) return
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const clampedActive = Math.min(active, filtered.length - 1)

  const move = (delta: number) => {
    if (filtered.length === 0) return
    let next = clampedActive
    for (let i = 0; i < filtered.length; i += 1) {
      next = (next + delta + filtered.length) % filtered.length
      if (!filtered[next].disabled) break
    }
    setActive(next)
  }

  const choose = (index: number) => {
    const option = filtered[index]
    if (!option || option.disabled) return
    onToggle(option.value)
    if (!multiple) close()
  }

  const runTypeahead = (char: string) => {
    const state = typeahead.current
    window.clearTimeout(state.timer)
    state.text += normalize(char)
    state.timer = window.setTimeout(() => {
      state.text = ''
    }, 600)
    const start = clampedActive + 1
    const ordered = [...filtered.slice(start), ...filtered.slice(0, start)]
    const match = ordered.find((o) => !o.disabled && normalize(o.label).startsWith(state.text))
    if (match) {
      const index = filtered.indexOf(match)
      if (open) setActive(index)
      else if (!multiple) onToggle(match.value)
    }
  }

  const onPanelKeyDown = (event: ReactKeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        move(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        move(-1)
        break
      case 'Home':
        if (!searchable) {
          event.preventDefault()
          setActive(0)
        }
        break
      case 'End':
        if (!searchable) {
          event.preventDefault()
          setActive(filtered.length - 1)
        }
        break
      case 'Enter':
        event.preventDefault()
        choose(clampedActive)
        break
      case ' ':
        if (!searchable) {
          event.preventDefault()
          choose(clampedActive)
        }
        break
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        close()
        break
      case 'Tab':
        close(false)
        break
      default:
        if (!searchable && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          runTypeahead(event.key)
        }
    }
  }

  const onTriggerKeyDown = (event: ReactKeyboardEvent) => {
    if (open) return
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openPanel()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openPanel(true)
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !searchable) {
      runTypeahead(event.key)
    }
  }

  const activeId = clampedActive >= 0 && filtered[clampedActive] ? `${baseId}-opt-${clampedActive}` : undefined
  const describedBy = hint || error ? `${baseId}-msg` : undefined

  const panel =
    open && position
      ? createPortal(
          <div
            ref={panelRef}
            className={`dropdown-panel ${position.up ? 'dropdown-panel--up' : ''}`}
            style={{
              left: position.left,
              top: position.top,
              bottom: position.bottom,
              minWidth: position.width,
              maxWidth: position.maxWidth,
              width: position.maxWidth === position.width ? position.width : undefined,
            }}
            onKeyDown={onPanelKeyDown}
          >
            {searchable && (
              <div className="dropdown-panel__search">
                <IconSearch size={16} />
                <input
                  ref={searchRef}
                  type="text"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-activedescendant={activeId}
                  aria-autocomplete="list"
                  aria-label={searchPlaceholder}
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setActive(0)
                    onSearchChange?.(event.target.value)
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
                {loading && <Spinner size={14} />}
              </div>
            )}
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={searchable ? undefined : -1}
              aria-multiselectable={multiple || undefined}
              aria-labelledby={label ? labelId : undefined}
              aria-label={label ? undefined : ariaLabel}
              aria-activedescendant={searchable ? undefined : activeId}
              className="dropdown-panel__list"
              style={{ maxHeight: position.maxHeight - (searchable ? 52 : 0) }}
            >
              {filtered.length === 0 ? (
                <li className="dropdown-panel__empty" role="presentation">
                  {loading ? 'Загрузка…' : emptyText}
                </li>
              ) : (
                filtered.map((option, index) => {
                  const isSelected = selectedSet.has(option.value)
                  return (
                    <li
                      key={option.value}
                      id={`${baseId}-opt-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      className={[
                        'dropdown-option',
                        index === clampedActive ? 'dropdown-option--active' : '',
                        isSelected ? 'dropdown-option--selected' : '',
                        option.disabled ? 'dropdown-option--disabled' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onPointerMove={() => setActive(index)}
                      onClick={() => choose(index)}
                    >
                      {multiple && (
                        <span className={`dropdown-option__box ${isSelected ? 'dropdown-option__box--on' : ''}`} aria-hidden="true">
                          {isSelected && <IconCheck size={12} />}
                        </span>
                      )}
                      {option.icon && <span className="dropdown-option__icon">{option.icon}</span>}
                      <span className="dropdown-option__text">
                        <span className="dropdown-option__label">{option.label}</span>
                        {option.hint && <span className="dropdown-option__hint">{option.hint}</span>}
                      </span>
                      {option.meta !== undefined && <span className="dropdown-option__meta">{option.meta}</span>}
                      {!multiple && isSelected && <IconCheck size={16} className="dropdown-option__check" />}
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body,
        )
      : null

  return (
    <div className={`field dropdown dropdown--${size} ${error ? 'field--error' : ''} ${className ?? ''}`}>
      {label && (
        <span className="field__label" id={labelId}>
          {label}
        </span>
      )}
      <div className="dropdown__control">
        <button
          ref={triggerRef}
          id={baseId}
          type="button"
          className={`dropdown__trigger ${open ? 'dropdown__trigger--open' : ''} ${onClear && hasValue ? 'dropdown__trigger--clearable' : ''}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-labelledby={label ? `${labelId} ${baseId}` : undefined}
          aria-label={label ? undefined : ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          onClick={() => (open ? close() : openPanel())}
          onKeyDown={onTriggerKeyDown}
        >
          {leadingIcon && <span className="dropdown__leading">{leadingIcon}</span>}
          <span className={`dropdown__value ${hasValue ? '' : 'dropdown__value--placeholder'}`}>
            {hasValue ? triggerContent : placeholder}
          </span>
          <IconChevronDown size={16} className="dropdown__chevron" />
        </button>
        {onClear && hasValue && !disabled && (
          <button type="button" className="dropdown__clear" aria-label="Очистить" onClick={onClear}>
            <IconClose size={14} />
          </button>
        )}
      </div>
      {error ? (
        <p className="field__error" id={`${baseId}-msg`} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p className="field__hint" id={`${baseId}-msg`}>
            {hint}
          </p>
        )
      )}
      {panel}
    </div>
  )
}

export function Select<T extends string>({ value, onChange, onClear, renderValue, ...rest }: SelectProps<T>) {
  const current = rest.options.find((o) => o.value === value)
  const selected = useMemo(() => (value === null ? [] : [value]), [value])
  return (
    <DropdownCore
      {...rest}
      multiple={false}
      selected={selected}
      onToggle={onChange}
      onClear={onClear}
      hasValue={current !== undefined || (value !== null && value !== undefined && value !== '')}
      triggerContent={
        current ? (
          renderValue ? (
            renderValue(current)
          ) : (
            <>
              {current.icon && <span className="dropdown__value-icon">{current.icon}</span>}
              <span className="dropdown__value-text">{current.label}</span>
            </>
          )
        ) : (
          <span className="dropdown__value-text">{value}</span>
        )
      }
    />
  )
}

export function MultiSelect<T extends string>({ value, onChange, summary, ...rest }: MultiSelectProps<T>) {
  const chosen = rest.options.filter((o) => value.includes(o.value))
  const toggle = (item: T) => onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item])
  const content =
    summary?.(chosen) ??
    (chosen.length === 1 ? chosen[0].label : chosen.length > 1 ? `Выбрано: ${chosen.length}` : null)
  return (
    <DropdownCore
      {...rest}
      multiple
      selected={value}
      onToggle={toggle}
      onClear={value.length > 0 ? () => onChange([]) : undefined}
      hasValue={value.length > 0}
      triggerContent={<span className="dropdown__value-text">{content}</span>}
    />
  )
}
