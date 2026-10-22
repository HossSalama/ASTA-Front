import { useMemo } from 'react'
import ScheduleCard from './ScheduleCard'
import useTranslation from '@/utils/hooks/useTranslation'
import classNames from 'classnames'
import type { MyScheduleItem } from '@/@types/schedule'

interface ScheduleTimelineProps {
    schedule: MyScheduleItem[]
    isLoading?: boolean
    onJumpToday?: () => void
    isViewingToday?: boolean
    className?: string
}

const SLOT_HEIGHT = 44

interface PositionedSession {
    session: MyScheduleItem
    top: number
    height: number
}

export const ScheduleTimeline = ({
    schedule,
    isLoading = false,
    onJumpToday,
    isViewingToday = false,
    className,
}: ScheduleTimelineProps) => {
    const { t, i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'

    // Compute hour range: default 9 to 24 (9:00 AM to 12:00 AM midnight), expanding if needed
    const hours = useMemo(() => {
        let minH = 9
        let maxH = 24

        schedule.forEach((s) => {
            if (s.scheduledStartTime) {
                const h = new Date(s.scheduledStartTime).getHours()
                if (h < minH) minH = h
                if (h >= maxH) maxH = h + 1
            }
        })

        const result: number[] = []
        for (let h = minH; h <= maxH; h++) {
            result.push(h)
        }
        return result
    }, [schedule])

    const formatHourLabel = (h: number): string => {
        const period =
            h < 12 || h === 24 ? (isRtl ? 'ص' : 'AM') : isRtl ? 'م' : 'PM'
        let displayH = h % 12
        if (displayH === 0) displayH = 12
        const str = String(displayH).padStart(2, '0')
        return `${str}:00 ${period}`
    }

    // Sort sessions chronologically
    const sortedSessions = useMemo(() => {
        return [...schedule].sort((a, b) => {
            const tA = a.scheduledStartTime
                ? new Date(a.scheduledStartTime).getTime()
                : 0
            const tB = b.scheduledStartTime
                ? new Date(b.scheduledStartTime).getTime()
                : 0
            return tA - tB
        })
    }, [schedule])

    // Calculate vertical coordinates and prevent card collisions
    const { positionedSessions, containerHeight } = useMemo(() => {
        const minH = hours[0] ?? 9
        const trackTotalHeight = (hours.length - 1) * SLOT_HEIGHT + SLOT_HEIGHT
        if (sortedSessions.length === 0) {
            return {
                positionedSessions: [] as PositionedSession[],
                containerHeight: trackTotalHeight,
            }
        }

        const positions: PositionedSession[] = []
        let previousBottom = -Infinity
        const cardHeight = 112 // standard comfortable height for title, subtitle, and meeting link

        sortedSessions.forEach((item) => {
            const d = item.scheduledStartTime
                ? new Date(item.scheduledStartTime)
                : null
            let startHourDecimal = minH
            if (d && !isNaN(d.getTime())) {
                startHourDecimal = d.getHours() + d.getMinutes() / 60
            }

            const naturalTop = (startHourDecimal - minH) * SLOT_HEIGHT
            const top = Math.max(naturalTop, previousBottom + 10)
            const height = cardHeight
            previousBottom = top + height

            positions.push({
                session: item,
                top,
                height,
            })
        })

        return {
            positionedSessions: positions,
            containerHeight: Math.max(trackTotalHeight, previousBottom + 20),
        }
    }, [sortedSessions, hours])

    if (isLoading) {
        return (
            <div className="space-y-4 py-8 animate-pulse">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4 sm:gap-6 items-start">
                            <div className="w-18 sm:w-22 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-28 flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className={classNames('space-y-4', className)}>
            {/* Column Headers matching the screenshot: | Time and | Course */}
            <div className="flex items-center pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-18 sm:w-22 shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#12263F] dark:text-slate-200 uppercase tracking-wider">
                    <span className="w-1 h-3.5 bg-[#3ABB90] rounded-full inline-block shrink-0" />
                    <span>{t('mySchedule.time', 'Time')}</span>
                </div>
                <div className="w-4 shrink-0" />
                <div className="flex-1 flex items-center gap-1.5 text-xs font-bold text-[#12263F] dark:text-slate-200 uppercase tracking-wider ms-2 sm:ms-4">
                    <span className="w-1 h-3.5 bg-[#3ABB90] rounded-full inline-block shrink-0" />
                    <span>{t('mySchedule.course', 'Course')}</span>
                </div>
            </div>

            {/* Continuous Hourly Timetable Layout */}
            <div
                className="flex items-start select-none"
                style={{ minHeight: `${containerHeight}px` }}
            >
                {/* Left Column: Fixed-Interval Hour Labels */}
                <div
                    className="relative w-18 sm:w-22 shrink-0"
                    style={{ height: `${containerHeight}px` }}
                >
                    {hours.map((hour, idx) => (
                        <div
                            key={hour}
                            className="absolute inset-x-0 flex items-center justify-end pe-2 sm:pe-3 text-end"
                            style={{
                                top: `${idx * SLOT_HEIGHT}px`,
                                height: `${SLOT_HEIGHT}px`,
                            }}
                        >
                            <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-slate-400 font-mono tracking-tight">
                                {formatHourLabel(hour)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Middle Column: Continuous Line + Node Dots */}
                <div
                    className="relative w-4 shrink-0"
                    style={{ height: `${containerHeight}px` }}
                >
                    {/* Vertical Continuous Line connecting hour marks */}
                    <div
                        className="absolute w-[1.5px] bg-[#E2E8F0] dark:bg-slate-700 left-1/2 -translate-x-1/2"
                        style={{
                            top: `${SLOT_HEIGHT / 2}px`,
                            bottom: `${
                                containerHeight -
                                ((hours.length - 1) * SLOT_HEIGHT +
                                    SLOT_HEIGHT / 2)
                            }px`,
                        }}
                    />

                    {/* Uniform Circular Nodes for each hour mark */}
                    {hours.map((hour, idx) => (
                        <div
                            key={hour}
                            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
                            style={{
                                top: `${idx * SLOT_HEIGHT + SLOT_HEIGHT / 2}px`,
                            }}
                        >
                            <div className="w-2 h-2 rounded-full bg-[#CBD5E1] dark:bg-slate-600 border border-white dark:border-slate-900 transition-transform" />
                        </div>
                    ))}
                </div>

                {/* Right Column: Course Cards Container */}
                <div
                    className="relative flex-1 ms-2 sm:ms-4"
                    style={{ height: `${containerHeight}px` }}
                >
                    {schedule.length === 0 ? (
                        <div className="pt-8 sm:pt-12 flex justify-center w-full">
                            <div className="w-full max-w-md mx-auto">
                                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-6 sm:p-8 text-center">
                                    <p className="text-sm sm:text-base font-bold text-[#12263F] dark:text-slate-200">
                                        {t(
                                            'mySchedule.noSessionsTitle',
                                            'No live sessions scheduled',
                                        )}
                                    </p>
                                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                                        {t(
                                            'mySchedule.noSessionsDesc',
                                            'You have no classes scheduled on this date.',
                                        )}
                                    </p>
                                    {!isViewingToday && onJumpToday && (
                                        <button
                                            className="mt-3 inline-flex items-center rounded-full bg-[#215D8B] hover:bg-[#214A79] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                                            type="button"
                                            onClick={onJumpToday}
                                        >
                                            {t(
                                                'mySchedule.jumpToday',
                                                'Go to Today',
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        positionedSessions.map(({ session, top, height }) => (
                            <div
                                key={session.liveSessionId}
                                className="absolute inset-x-0"
                                style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                }}
                            >
                                <ScheduleCard
                                    className="h-full"
                                    session={session}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default ScheduleTimeline
