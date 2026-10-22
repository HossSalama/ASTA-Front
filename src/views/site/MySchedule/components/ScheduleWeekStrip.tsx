import { useMemo } from 'react'
import useTranslation from '@/utils/hooks/useTranslation'
import classNames from 'classnames'
import dayjs from 'dayjs'

interface ScheduleWeekStripProps {
    selectedDate: Date
    onSelectDate: (date: Date) => void
    className?: string
}

function getWeekDays(referenceDate: Date): Date[] {
    const ref = dayjs(referenceDate)
    const dayOfWeek = ref.day() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const sunday = ref.subtract(dayOfWeek, 'day')
    return Array.from({ length: 7 }, (_, i) => sunday.add(i, 'day').toDate())
}

export const ScheduleWeekStrip = ({
    selectedDate,
    onSelectDate,
    className,
}: ScheduleWeekStripProps) => {
    const { i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'

    const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])

    const selectedDateKey = useMemo(() => {
        return dayjs(selectedDate).format('YYYY-MM-DD')
    }, [selectedDate])

    return (
        <div
            className={classNames(
                'flex gap-2 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-7 sm:gap-3 py-1',
                className,
            )}
        >
            {weekDays.map((day) => {
                const dayKey = dayjs(day).format('YYYY-MM-DD')
                const isSelected = dayKey === selectedDateKey
                const dayNumber = String(day.getDate()).padStart(2, '0')
                const dayName = day.toLocaleDateString(
                    isRtl ? 'ar-EG' : 'en-US',
                    { weekday: 'short' },
                )

                return (
                    <button
                        key={dayKey}
                        className={classNames(
                            'flex flex-col items-center justify-center rounded-xl sm:rounded-2xl py-2.5 px-2 sm:py-3.5 sm:px-2 min-w-[52px] sm:min-w-0 flex-1 transition-all cursor-pointer select-none text-center',
                            isSelected
                                ? 'bg-[#215D8B] text-white shadow-sm font-bold'
                                : 'bg-[#EAF1F8] dark:bg-slate-800/70 text-[#12263F] dark:text-slate-200 hover:bg-[#DCE9F4] dark:hover:bg-slate-800/90 border border-transparent',
                        )}
                        type="button"
                        onClick={() => onSelectDate(day)}
                    >
                        <span
                            className={classNames(
                                'text-sm sm:text-base font-bold tracking-tight',
                                isSelected
                                    ? 'text-white'
                                    : 'text-[#12263F] dark:text-slate-100',
                            )}
                        >
                            {dayNumber}
                        </span>
                        <span
                            className={classNames(
                                'text-[10px] sm:text-xs font-medium mt-0.5',
                                isSelected
                                    ? 'text-white/95 font-semibold'
                                    : 'text-[#64748B] dark:text-slate-400',
                            )}
                        >
                            {dayName}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

export default ScheduleWeekStrip
