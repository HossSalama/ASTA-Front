import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
    TbCalendarEvent,
    TbMapPin,
    TbClock,
    TbArrowRight,
    TbArrowLeft,
    TbExternalLink,
} from 'react-icons/tb'
import Button from '@/components/ui/Button'
import { useMySchedule } from '@/utils/hooks/useSchedule'
import { useAuth } from '@/auth'
import useTranslation from '@/utils/hooks/useTranslation'
import classNames from 'classnames'
import dayjs from 'dayjs'
import type { MyScheduleItem } from '@/@types/schedule'

export const TodayScheduleWidget = () => {
    const { t, i18n } = useTranslation()
    const { authenticated } = useAuth()
    const isRtl = i18n.language === 'ar'
    const today = useMemo(() => new Date(), [])

    const { schedule, isLoading, error } = useMySchedule(today, authenticated)

    const ArrowIcon = isRtl ? TbArrowLeft : TbArrowRight

    if (!authenticated || error || isLoading) {
        return null
    }

    if (schedule.length === 0) {
        return null
    }

    return (
        <section
            aria-label={t('mySchedule.todayWidgetTitle', "Today's Live Classes")}
            className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary-subtle/50 via-surface to-surface p-5 sm:p-6 shadow-xs"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-neutral text-lg">
                        <TbCalendarEvent />
                    </span>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                            <span>
                                {t(
                                    'mySchedule.todayWidgetTitle',
                                    "Today's Live Classes",
                                )}
                            </span>
                            <span className="rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-xs font-bold border border-rose-500/20">
                                {schedule.length}
                            </span>
                        </h2>
                        <p className="text-xs text-text-secondary">
                            {t(
                                'mySchedule.todayWidgetSubtitle',
                                'Upcoming live sessions scheduled for today',
                            )}
                        </p>
                    </div>
                </div>

                <Link
                    to="/my-schedule"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                    <span>
                        {t('mySchedule.viewFullSchedule', 'View Full Schedule')}
                    </span>
                    <ArrowIcon className="text-base" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {schedule.map((session: MyScheduleItem) => {
                    const isOnline = session.deliveryMode === 'Online'
                    const startTime = session.scheduledStartTime
                        ? new Date(
                              session.scheduledStartTime,
                          ).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                          })
                        : ''

                    const isLive =
                        session.scheduledStartTime &&
                        dayjs().isAfter(dayjs(session.scheduledStartTime)) &&
                        dayjs().isBefore(
                            dayjs(session.scheduledStartTime).add(1, 'hour'),
                        )

                    return (
                        <div
                            key={session.liveSessionId}
                            className={classNames(
                                'rounded-xl border bg-surface p-4 flex flex-col justify-between gap-3 shadow-2xs',
                                isLive
                                    ? 'border-rose-500/40 ring-1 ring-rose-500/20'
                                    : 'border-border',
                            )}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-xs font-semibold text-primary truncate max-w-[180px]">
                                        {session.courseName}
                                    </span>
                                    <span
                                        className={classNames(
                                            'text-[11px] font-medium px-2 py-0.5 rounded-full border',
                                            isOnline
                                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
                                        )}
                                    >
                                        {isOnline
                                            ? t(
                                                  'mySchedule.online',
                                                  'Online',
                                              )
                                            : t(
                                                  'mySchedule.inPerson',
                                                  'In-Person',
                                              )}
                                    </span>
                                </div>

                                <h3 className="text-sm font-bold text-text-primary line-clamp-1">
                                    <Link
                                        to={`/learn/${session.courseId}?item=${session.contentId}`}
                                        className="hover:text-primary transition-colors"
                                    >
                                        {session.title}
                                    </Link>
                                </h3>

                                <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
                                    <span className="flex items-center gap-1">
                                        <TbClock className="text-primary text-sm" />
                                        <span>{startTime}</span>
                                    </span>
                                    {isLive && (
                                        <span className="font-bold text-rose-600 dark:text-rose-400">
                                            • {t('mySchedule.liveNow', 'Live Now')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                                {isOnline && session.meetingUrl && (
                                    <a
                                        href={session.meetingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1"
                                    >
                                        <Button
                                            size="xs"
                                            variant="solid"
                                            className={classNames(
                                                'w-full font-semibold',
                                                isLive
                                                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                                    : 'bg-primary hover:bg-primary-hover text-neutral',
                                            )}
                                            icon={
                                                <TbExternalLink className="text-xs" />
                                            }
                                        >
                                            {t(
                                                'mySchedule.joinMeeting',
                                                'Join Live Session',
                                            )}
                                        </Button>
                                    </a>
                                )}

                                {!isOnline && session.locationUrl && (
                                    <a
                                        href={session.locationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1"
                                    >
                                        <Button
                                            size="xs"
                                            variant="default"
                                            className="w-full font-medium"
                                            icon={<TbMapPin className="text-xs" />}
                                        >
                                            {t('mySchedule.viewMap', 'View Map')}
                                        </Button>
                                    </a>
                                )}

                                <Link
                                    to={`/learn/${session.courseId}?item=${session.contentId}`}
                                    className={
                                        session.meetingUrl || session.locationUrl
                                            ? 'shrink-0'
                                            : 'flex-1'
                                    }
                                >
                                    <Button
                                        size="xs"
                                        variant="plain"
                                        className="w-full text-xs font-semibold text-text-secondary hover:text-text-primary"
                                    >
                                        {t('mySchedule.viewLesson', 'Lesson Details')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

export default TodayScheduleWidget
