import {
    useState,
    useMemo,
    useEffect,
    useRef,
    useCallback,
    type ReactNode,
} from 'react'
import useTranslation from '@/utils/hooks/useTranslation'
import classNames from 'classnames'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'
import { HiChevronDown } from 'react-icons/hi2'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PickerMode = 'date' | 'month' | 'year'

export interface InlineDatePickerProps {
    /** The currently selected date */
    value: Date
    /** Callback when user selects a new date */
    onChange: (date: Date) => void
    /** Additional CSS classes for the wrapper element */
    className?: string
    /**
     * Custom trigger renderer.
     * Receives `{ value, label, open, toggle }` and should return a ReactNode
     * that the user can click to open/close the picker.
     *
     * When omitted, a default orange pill button is rendered.
     */
    renderTrigger?: (ctx: {
        value: Date
        label: string
        open: boolean
        toggle: () => void
    }) => ReactNode
    /** Label override for the "Today" quick‑action button */
    todayLabel?: string
    /** Label override for the "Close" button */
    closeLabel?: string
    /** Whether the picker dropdown is disabled */
    disabled?: boolean
}

// ---------------------------------------------------------------------------
// Internal: Calendar Panel (the dropdown body)
// ---------------------------------------------------------------------------

interface CalendarPanelProps {
    selectedDate: Date
    onSelectDate: (date: Date) => void
    onClose: () => void
    todayLabel?: string
    closeLabel?: string
}

function CalendarPanel({
    selectedDate,
    onSelectDate,
    onClose,
    todayLabel,
    closeLabel,
}: CalendarPanelProps) {
    const { t, i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'

    const [mode, setMode] = useState<PickerMode>('date')
    const [viewYear, setViewYear] = useState(() => selectedDate.getFullYear())
    const [viewMonth, setViewMonth] = useState(() => selectedDate.getMonth())
    const [yearRangeStart, setYearRangeStart] = useState(
        () => Math.floor(selectedDate.getFullYear() / 12) * 12,
    )

    // Reset view state when selected date changes externally
    useEffect(() => {
        setViewYear(selectedDate.getFullYear())
        setViewMonth(selectedDate.getMonth())
        setYearRangeStart(Math.floor(selectedDate.getFullYear() / 12) * 12)
        setMode('date')
    }, [selectedDate])

    const PrevIcon = isRtl ? TbChevronRight : TbChevronLeft
    const NextIcon = isRtl ? TbChevronLeft : TbChevronRight

    const months = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            index: i,
            name: new Date(2026, i, 1).toLocaleDateString(
                isRtl ? 'ar-EG' : 'en-US',
                { month: isRtl ? 'long' : 'short' },
            ),
        }))
    }, [isRtl])

    const weekdays = useMemo(() => {
        return isRtl
            ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    }, [isRtl])

    // Days grid calculation
    const calendarDays = useMemo(() => {
        const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
        const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

        const prevDays: { day: number; isCurrentMonth: boolean; date: Date }[] =
            []
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const d = daysInPrevMonth - i
            prevDays.push({
                day: d,
                isCurrentMonth: false,
                date: new Date(viewYear, viewMonth - 1, d),
            })
        }

        const currentDays: {
            day: number
            isCurrentMonth: boolean
            date: Date
        }[] = []
        for (let i = 1; i <= daysInMonth; i++) {
            currentDays.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(viewYear, viewMonth, i),
            })
        }

        const total = prevDays.length + currentDays.length
        const remainder = total % 7 === 0 ? 0 : 7 - (total % 7)
        const nextDays: { day: number; isCurrentMonth: boolean; date: Date }[] =
            []
        for (let i = 1; i <= remainder; i++) {
            nextDays.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(viewYear, viewMonth + 1, i),
            })
        }

        return [...prevDays, ...currentDays, ...nextDays]
    }, [viewYear, viewMonth])

    const handlePrev = () => {
        if (mode === 'date') {
            if (viewMonth === 0) {
                setViewMonth(11)
                setViewYear((prev) => prev - 1)
            } else {
                setViewMonth((prev) => prev - 1)
            }
        } else if (mode === 'month') {
            setViewYear((prev) => prev - 1)
        } else {
            setYearRangeStart((prev) => prev - 12)
        }
    }

    const handleNext = () => {
        if (mode === 'date') {
            if (viewMonth === 11) {
                setViewMonth(0)
                setViewYear((prev) => prev + 1)
            } else {
                setViewMonth((prev) => prev + 1)
            }
        } else if (mode === 'month') {
            setViewYear((prev) => prev + 1)
        } else {
            setYearRangeStart((prev) => prev + 12)
        }
    }

    const currentMonthLabel = new Date(
        viewYear,
        viewMonth,
        1,
    ).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        month: 'long',
    })

    const resolvedTodayLabel =
        todayLabel ?? t('mySchedule.today', isRtl ? 'اليوم' : 'Today')
    const resolvedCloseLabel = closeLabel ?? (isRtl ? 'إغلاق' : 'Close')

    return (
        <div className="w-[300px] sm:w-[330px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none">
            {/* Header: Month/Year navigation and Mode switch */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <button
                    aria-label="Previous"
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    type="button"
                    onClick={handlePrev}
                >
                    <PrevIcon className="text-base" />
                </button>

                <div className="flex items-center gap-1 font-bold text-sm sm:text-base text-[#12263F] dark:text-white">
                    {mode === 'date' && (
                        <button
                            className="inline-flex items-center gap-1 hover:text-[#215D8B] transition-colors cursor-pointer px-1.5 py-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            type="button"
                            onClick={() => setMode('month')}
                        >
                            <span>
                                {currentMonthLabel} {viewYear}
                            </span>
                            <HiChevronDown className="text-xs text-[#215D8B]" />
                        </button>
                    )}

                    {mode === 'month' && (
                        <button
                            className="inline-flex items-center gap-1 hover:text-[#215D8B] transition-colors cursor-pointer px-1.5 py-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                            type="button"
                            onClick={() => setMode('year')}
                        >
                            <span>{viewYear}</span>
                            <HiChevronDown className="text-xs text-[#215D8B]" />
                        </button>
                    )}

                    {mode === 'year' && (
                        <span className="px-1.5 py-0.5">
                            {yearRangeStart} - {yearRangeStart + 11}
                        </span>
                    )}
                </div>

                <button
                    aria-label="Next"
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    type="button"
                    onClick={handleNext}
                >
                    <NextIcon className="text-base" />
                </button>
            </div>

            {/* Mode 1: Date View (Days Grid) */}
            {mode === 'date' && (
                <div className="my-2.5">
                    {/* Weekday Labels Row */}
                    <div className="grid grid-cols-7 mb-1 text-center">
                        {weekdays.map((w) => (
                            <span
                                key={w}
                                className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-slate-400 py-1"
                            >
                                {w}
                            </span>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {calendarDays.map((item, idx) => {
                            const isSelected =
                                item.date.getFullYear() ===
                                    selectedDate.getFullYear() &&
                                item.date.getMonth() ===
                                    selectedDate.getMonth() &&
                                item.date.getDate() === selectedDate.getDate()

                            const isToday =
                                item.date.getFullYear() ===
                                    new Date().getFullYear() &&
                                item.date.getMonth() ===
                                    new Date().getMonth() &&
                                item.date.getDate() === new Date().getDate()

                            return (
                                <button
                                    key={idx}
                                    className={classNames(
                                        'w-8 h-8 sm:w-9 sm:h-9 mx-auto rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all cursor-pointer',
                                        isSelected
                                            ? 'bg-[#215D8B] text-white shadow-sm font-bold scale-105'
                                            : isToday
                                              ? 'border-2 border-[#215D8B] text-[#215D8B] font-bold'
                                              : item.isCurrentMonth
                                                ? 'text-[#12263F] dark:text-slate-200 hover:bg-[#EAF1F8] dark:hover:bg-slate-800'
                                                : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40',
                                    )}
                                    type="button"
                                    onClick={() => onSelectDate(item.date)}
                                >
                                    {item.day}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Mode 2: Month View (12 Months Grid) */}
            {mode === 'month' && (
                <div className="grid grid-cols-3 gap-2 my-3">
                    {months.map((m) => {
                        const isSelected =
                            selectedDate.getFullYear() === viewYear &&
                            selectedDate.getMonth() === m.index

                        return (
                            <button
                                key={m.index}
                                className={classNames(
                                    'py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer select-none text-center',
                                    isSelected
                                        ? 'bg-[#215D8B] text-white shadow-sm font-bold'
                                        : 'text-slate-700 dark:text-slate-200 hover:bg-[#EAF1F8] dark:hover:bg-slate-800/80',
                                )}
                                type="button"
                                onClick={() => {
                                    setViewMonth(m.index)
                                    setMode('date')
                                }}
                            >
                                {m.name}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Mode 3: Year View (12 Years Grid) */}
            {mode === 'year' && (
                <div className="grid grid-cols-3 gap-2 my-3">
                    {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(
                        (y) => {
                            const isSelected = selectedDate.getFullYear() === y
                            return (
                                <button
                                    key={y}
                                    className={classNames(
                                        'py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer select-none text-center font-sans',
                                        isSelected
                                            ? 'bg-[#215D8B] text-white shadow-sm font-bold'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-[#EAF1F8] dark:hover:bg-slate-800/80',
                                    )}
                                    type="button"
                                    onClick={() => {
                                        setViewYear(y)
                                        setMode('month')
                                    }}
                                >
                                    {y}
                                </button>
                            )
                        },
                    )}
                </div>
            )}

            {/* Footer: Quick Actions (Today / Close) */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                    className="font-semibold text-[#215D8B] hover:underline cursor-pointer"
                    type="button"
                    onClick={() => onSelectDate(new Date())}
                >
                    {resolvedTodayLabel}
                </button>
                <button
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    type="button"
                    onClick={onClose}
                >
                    {resolvedCloseLabel}
                </button>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Public: InlineDatePicker
// ---------------------------------------------------------------------------

/**
 * A fully self‑contained inline date picker with a trigger button and a
 * dropdown calendar panel featuring 3 modes: days → months → years.
 *
 * Works with RTL (Arabic) and LTR locales out of the box.
 *
 * @example
 * ```tsx
 * // Default pill trigger
 * <InlineDatePicker value={date} onChange={setDate} />
 *
 * // Custom trigger
 * <InlineDatePicker
 *   value={date}
 *   renderTrigger={({ label, toggle, open }) => (
 *     <button onClick={toggle}>{label} {open ? '▲' : '▼'}</button>
 *   )}
 *   onChange={setDate}
 * />
 * ```
 */
export const InlineDatePicker = ({
    value,
    className,
    closeLabel,
    disabled,
    renderTrigger,
    todayLabel,
    onChange,
}: InlineDatePickerProps) => {
    const { i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'

    const [open, setOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    const toggle = useCallback(() => {
        if (!disabled) setOpen((prev) => !prev)
    }, [disabled])

    // Close on click outside or Escape
    useEffect(() => {
        if (!open) return

        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setOpen(false)
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [open])

    const handleSelect = useCallback(
        (date: Date) => {
            onChange(date)
            setOpen(false)
        },
        [onChange],
    )

    // Formatted label used by the default trigger and passed to custom triggers
    const monthYear = value.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        month: 'long',
        year: 'numeric',
    })
    const monthOnly = value.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        month: 'long',
    })

    return (
        <div
            ref={wrapperRef}
            className={classNames('relative inline-flex items-center', className)}
        >
            {/* Trigger */}
            {renderTrigger ? (
                renderTrigger({ value, label: monthYear, open, toggle })
            ) : (
                <button
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    className={classNames(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full border bg-white dark:bg-slate-800 text-[#215D8B] text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer select-none',
                        open
                            ? 'border-[#215D8B] ring-2 ring-[#215D8B]/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-[#215D8B]',
                        disabled && 'opacity-50 pointer-events-none',
                    )}
                    disabled={disabled}
                    type="button"
                    onClick={toggle}
                >
                    <span>
                        <span className="sm:hidden">{monthOnly}</span>
                        <span className="hidden sm:inline">{monthYear}</span>
                    </span>
                    <HiChevronDown
                        className={classNames(
                            'text-xs sm:text-sm text-[#215D8B] transition-transform duration-200',
                            open && 'rotate-180',
                        )}
                    />
                </button>
            )}

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute top-full mt-2 end-0 z-50">
                    <CalendarPanel
                        closeLabel={closeLabel}
                        selectedDate={value}
                        todayLabel={todayLabel}
                        onClose={() => setOpen(false)}
                        onSelectDate={handleSelect}
                    />
                </div>
            )}
        </div>
    )
}

export default InlineDatePicker
