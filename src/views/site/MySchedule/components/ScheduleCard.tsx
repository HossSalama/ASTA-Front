import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TbMapPin } from 'react-icons/tb'
import useTranslation from '@/utils/hooks/useTranslation'
import classNames from 'classnames'
import dayjs from 'dayjs'
import type { MyScheduleItem } from '@/@types/schedule'

interface ScheduleCardProps {
    session: MyScheduleItem
    className?: string
}

export const ScheduleCard = ({ session, className }: ScheduleCardProps) => {
    const { t } = useTranslation()
    const [now, setNow] = useState<number>(Date.now())

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now())
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    const isOnline = session.deliveryMode === 'Online'
    const startTimeMs = session.scheduledStartTime
        ? dayjs(session.scheduledStartTime).valueOf()
        : null
    const durationMs = 60 * 60 * 1000
    const endTimeMs = startTimeMs ? startTimeMs + durationMs : null

    const isLive = useMemo(() => {
        if (!startTimeMs || !endTimeMs) return false
        return now >= startTimeMs && now <= endTimeMs
    }, [startTimeMs, endTimeMs, now])

    const titleParts = useMemo(() => {
        const colonIdx = session.title?.indexOf(':') ?? -1
        if (colonIdx !== -1) {
            return {
                prefix: session.title.slice(0, colonIdx).trim(),
                rest: session.title.slice(colonIdx + 1).trim(),
            }
        }
        return {
            prefix: t('mySchedule.lecture', 'Lecture'),
            rest: session.title,
        }
    }, [session.title, t])

    return (
        <div
            className={classNames(
                'group h-full w-full rounded-xl sm:rounded-2xl bg-[#EAF1F8] dark:bg-sky-950/40 border-s-[4px] border-s-[#215D8B] dark:border-s-[#3F8CC4] p-3 sm:p-4 flex flex-col justify-center transition-all hover:bg-[#DCE9F4] dark:hover:bg-sky-950/50 shadow-2xs',
                isLive && 'ring-2 ring-rose-500/30',
                className,
            )}
        >
            {/* Course Title + Live Badge */}
            <div className="flex items-center justify-between gap-2">
                <Link
                    className="text-sm sm:text-base font-bold text-[#12263F] dark:text-white hover:text-primary transition-colors line-clamp-1"
                    to={`/courses/${session.courseId}`}
                >
                    {session.courseName}
                </Link>

                {isLive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                        </span>
                        {t('mySchedule.liveNow', 'Live Now')}
                    </span>
                )}
            </div>

            {/* Lecture / Lesson Subtitle */}
            <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 mt-1 line-clamp-1">
                <Link
                    className="hover:text-primary transition-colors inline-flex items-center gap-1"
                    to={`/learn/${session.courseId}?item=${session.contentId}`}
                >
                    {titleParts.prefix && (
                        <span className="text-[#64748B] dark:text-slate-400 font-medium">
                            {titleParts.prefix}:
                        </span>
                    )}
                    <span className="font-semibold text-[#1E293B] dark:text-slate-100">
                        {titleParts.rest}
                    </span>
                </Link>
            </p>

            {/* Details: Zoom Link or Physical Location */}
            <div className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 mt-1.5 flex flex-wrap items-center gap-1">
                {isOnline ? (
                    <>
                        <span className="text-[#64748B] dark:text-slate-400 font-medium">
                            {session.meetingUrl?.includes('zoom')
                                ? t('mySchedule.zoomLink', 'Zoom Link:')
                                : t('mySchedule.meetingLink', 'Meeting Link:')}
                        </span>
                        {session.meetingUrl ? (
                            <a
                                className="text-[#215D8B] hover:text-[#214A79] underline font-semibold break-all"
                                href={session.meetingUrl}
                                rel="noopener noreferrer"
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {session.meetingUrl}
                            </a>
                        ) : (
                            <span className="text-xs text-[#94A3B8]">
                                {t(
                                    'mySchedule.noMeetingUrlYet',
                                    'Meeting link will be shared before session.',
                                )}
                            </span>
                        )}
                    </>
                ) : (
                    <>
                        <span className="text-[#64748B] dark:text-slate-400 font-medium">
                            {t('mySchedule.locationLabel', 'Location:')}
                        </span>
                        <span className="font-bold text-[#12263F] dark:text-white">
                            {session.location || 'Campus'}
                        </span>
                        {session.locationUrl && (
                            <a
                                className="text-[#215D8B] hover:text-[#214A79] underline font-semibold inline-flex items-center gap-0.5 ms-1"
                                href={session.locationUrl}
                                rel="noopener noreferrer"
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span>{t('mySchedule.viewMap', 'View Map')}</span>
                                <TbMapPin className="text-xs" />
                            </a>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default ScheduleCard
