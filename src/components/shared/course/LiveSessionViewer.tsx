import { useState, useEffect } from 'react'
import {
    TbVideo,
    TbCalendar,
    TbClock,
    TbMapPin,
    TbExternalLink,
    TbInfoCircle,
    TbBroadcast,
    TbLock,
} from 'react-icons/tb'
import classNames from 'classnames'
import Button from '@/components/ui/Button'
import Loading from '@/components/shared/Loading'
import useTranslation from '@/utils/hooks/useTranslation'
import { apiGetLiveSessionByContentId } from '@/services/LiveSessionService'
import type { LiveSessionDto } from '@/@types/courseContent'
import { isOnlineDeliveryMode } from '@/@types/courseContent'
import dayjs from 'dayjs'

interface LiveSessionViewerProps {
    contentId: number
    title?: string
    courseId?: number
    initialLiveSession?: LiveSessionDto | null
    isEnrolled?: boolean
    hideTitle?: boolean
    className?: string
}

export const LiveSessionViewer = ({
    contentId,
    title,
    initialLiveSession,
    isEnrolled = true,
    hideTitle = false,
    className,
}: LiveSessionViewerProps) => {
    const { t, i18n } = useTranslation()
    const [liveSession, setLiveSession] = useState<LiveSessionDto | null>(
        initialLiveSession || null,
    )
    const [loading, setLoading] = useState<boolean>(!initialLiveSession)
    const [now, setNow] = useState<number>(Date.now())

    // Fetch satellite if not provided
    useEffect(() => {
        if (initialLiveSession) {
            setLiveSession(initialLiveSession)
            setLoading(false)
            return
        }

        let isMounted = true
        setLoading(true)

        apiGetLiveSessionByContentId(contentId)
            .then((res) => {
                if (isMounted && res.data) {
                    setLiveSession(res.data)
                }
            })
            .catch(() => {
                // If 404 or unauthenticated
            })
            .finally(() => {
                if (isMounted) setLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [contentId, initialLiveSession])

    // Update countdown every second
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(Date.now())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    if (loading) {
        return (
            <div
                className={classNames(
                    'flex min-h-[360px] w-full flex-col items-center justify-center bg-surface/50 p-8 text-text-primary',
                    className,
                )}
            >
                <Loading loading={true} />
                <p className="mt-3 text-xs text-text-secondary">
                    {t('liveSessions.loadingSession', 'جاري تحميل تفاصيل الجلسة المباشرة…')}
                </p>
            </div>
        )
    }

    const scheduledTime = liveSession?.scheduledStartTime
        ? dayjs(liveSession.scheduledStartTime).valueOf()
        : null

    // durationMinutes is not returned by the API — default to 60 minutes
    const durationMinutes = (liveSession as { durationMinutes?: number })?.durationMinutes ?? 60
    const durationMs = durationMinutes * 60 * 1000
    const endTime = scheduledTime ? scheduledTime + durationMs : null

    // Determine session status: upcoming, live now, or finished
    let sessionStatus: 'upcoming' | 'live' | 'finished' = 'upcoming'
    let diffSeconds = 0

    if (scheduledTime) {
        if (now < scheduledTime) {
            sessionStatus = 'upcoming'
            diffSeconds = Math.max(0, Math.floor((scheduledTime - now) / 1000))
        } else if (endTime && now <= endTime) {
            sessionStatus = 'live'
        } else {
            sessionStatus = 'finished'
        }
    }

    const days = Math.floor(diffSeconds / 86400)
    const hours = Math.floor((diffSeconds % 86400) / 3600)
    const minutes = Math.floor((diffSeconds % 3600) / 60)
    const seconds = Math.floor(diffSeconds % 60)

    const isOnline = isOnlineDeliveryMode(liveSession?.deliveryMode)

    return (
        <div
            className={classNames(
                'mx-auto w-full max-w-4xl rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm transition-all',
                className,
            )}
        >
            {/* Header: Mode & Live Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-6">
                <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        {sessionStatus === 'live' ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                                {t('liveSessions.liveNow', 'مباشر الآن')}
                            </span>
                        ) : sessionStatus === 'upcoming' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                <TbBroadcast className="text-sm" />
                                {t('liveSessions.scheduled', 'جلسة قادمة')}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 px-3 py-1 text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-500/20">
                                {t('liveSessions.ended', 'انتهت الجلسة')}
                            </span>
                        )}

                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-3 py-1 text-xs font-semibold text-text-secondary border border-border">
                            {isOnline ? (
                                <>
                                    <TbVideo className="text-sm text-primary" />
                                    {t('liveSessions.online', 'أونلاين عبر الإنترنت')}
                                </>
                            ) : (
                                <>
                                    <TbMapPin className="text-sm text-rose-500" />
                                    {t('liveSessions.offline', 'حضور شخصي')}
                                </>
                            )}
                        </span>
                    </div>

                    {!hideTitle && (
                        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                            {title || t('liveSessions.liveSession', 'جلسة تفاعلية مباشرة')}
                        </h2>
                    )}
                </div>

                {/* Session Date & Duration details */}
                <div className="flex flex-col sm:items-end gap-1 text-xs text-text-secondary">
                    {liveSession?.scheduledStartTime && (
                        <span className="flex items-center gap-1 font-medium">
                            <TbCalendar className="text-sm text-primary" />
                            {dayjs(liveSession.scheduledStartTime).format(
                                'dddd, DD MMMM YYYY - hh:mm A',
                            )}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <TbClock className="text-sm text-text-muted" />
                        {t('liveSessions.durationMinutes', {
                            defaultValue: '{{minutes}} دقيقة',
                            minutes: durationMinutes,
                        })}
                    </span>
                </div>
            </div>

            {/* Countdown / Status Hero Box */}
            <div className="my-8 rounded-xl bg-gradient-to-br from-surface-alt/70 to-surface-alt/30 border border-border p-6 text-center">
                {sessionStatus === 'upcoming' && (
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
                            {t('liveSessions.startsIn', 'تبدأ الجلسة بعد:')}
                        </p>
                        <div className="flex items-center justify-center gap-3 sm:gap-6 dir-ltr">
                            {days > 0 && (
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl sm:text-4xl font-extrabold text-primary font-mono">
                                        {days}
                                    </span>
                                    <span className="text-[11px] text-text-secondary mt-1 font-medium">
                                        {t('common.days', 'أيام')}
                                    </span>
                                </div>
                            )}
                            <div className="flex flex-col items-center">
                                <span className="text-3xl sm:text-4xl font-extrabold text-primary font-mono">
                                    {String(hours).padStart(2, '0')}
                                </span>
                                <span className="text-[11px] text-text-secondary mt-1 font-medium">
                                    {t('common.hours', 'ساعات')}
                                </span>
                            </div>
                            <span className="text-2xl font-bold text-text-muted -mt-4">:</span>
                            <div className="flex flex-col items-center">
                                <span className="text-3xl sm:text-4xl font-extrabold text-primary font-mono">
                                    {String(minutes).padStart(2, '0')}
                                </span>
                                <span className="text-[11px] text-text-secondary mt-1 font-medium">
                                    {t('common.minutes', 'دقائق')}
                                </span>
                            </div>
                            <span className="text-2xl font-bold text-text-muted -mt-4">:</span>
                            <div className="flex flex-col items-center">
                                <span className="text-3xl sm:text-4xl font-extrabold text-primary font-mono">
                                    {String(seconds).padStart(2, '0')}
                                </span>
                                <span className="text-[11px] text-text-secondary mt-1 font-medium">
                                    {t('common.seconds', 'ثوانٍ')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {sessionStatus === 'live' && (
                    <div className="space-y-3 py-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-sm">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </span>
                            {t('liveSessions.inProgress', 'البث المباشر قيد التشغيل حالياً')}
                        </div>
                        <p className="text-sm text-text-secondary max-w-md mx-auto">
                            {t(
                                'liveSessions.joinPrompt',
                                'انضم الآن للجلسة للتفاعل المباشر مع المدرب وطرح استفساراتك.',
                            )}
                        </p>
                    </div>
                )}

                {sessionStatus === 'finished' && (
                    <div className="py-2 text-text-secondary">
                        <p className="text-sm font-semibold text-text-primary">
                            {t('liveSessions.sessionEnded', 'انتهت هذه الجلسة المباشرة')}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                            {t(
                                'liveSessions.endedDesc',
                                'إذا كان هناك تسجيل للجلسة فسيتم إتاحته من قِبل إدارة الأكاديمية.',
                            )}
                        </p>
                    </div>
                )}
            </div>

            {/* Action Section: Join Meeting or Location Map */}
            <div className="space-y-4">
                {isOnline ? (
                    <div className="rounded-xl border border-border p-5 bg-surface-alt/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-text-primary">
                                {t('liveSessions.meetingAccess', 'رابط الدخول للجلسة المباشرة')}
                            </h4>
                            <p className="text-xs text-text-secondary">
                                {liveSession?.meetingUrl
                                    ? t(
                                          'liveSessions.meetingUrlHint',
                                          'يتم فتح رابط الاجتماع في نافذة خارجية (Zoom, Google Meet, إلخ).',
                                      )
                                    : !isEnrolled
                                      ? t(
                                            'liveSessions.lockedMeetingHint',
                                            'رابط الاجتماع متاح فقط للمشتركين المسجلين في الدورة.',
                                        )
                                      : t(
                                            'liveSessions.noMeetingUrlYet',
                                            'سيتم تزويدك برابط الاجتماع قبل بدء الجلسة مباشرة.',
                                        )}
                            </p>
                        </div>

                        <div>
                            {liveSession?.meetingUrl ? (
                                <a
                                    href={liveSession.meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        variant="solid"
                                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold w-full sm:w-auto"
                                        icon={<TbExternalLink className="text-base" />}
                                    >
                                        {t('liveSessions.joinMeetingBtn', 'الانضمام للاجتماع الآن')}
                                    </Button>
                                </a>
                            ) : !isEnrolled ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted bg-surface-alt border border-border">
                                    <TbLock className="text-sm" />
                                    {t('liveSessions.enrolledOnly', 'للمشتركين فقط')}
                                </span>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border p-5 bg-surface-alt/40 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-text-primary">
                                    {t('liveSessions.venueDetails', 'مكان وموقع الحضور')}
                                </h4>
                                <p className="text-xs text-text-secondary">
                                    {liveSession?.location ||
                                        (!isEnrolled
                                            ? t(
                                                  'liveSessions.lockedLocationHint',
                                                  'تفاصيل الموقع متاحة فقط للمشتركين المسجلين في الدورة.',
                                              )
                                            : t(
                                                  'liveSessions.locationTBD',
                                                  'سيتم تحديد عنوان الحضور قريباً.',
                                              ))}
                                </p>
                            </div>

                            {liveSession?.locationUrl && (
                                <a
                                    href={liveSession.locationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        variant="solid"
                                        className="bg-primary hover:bg-primary-hover text-white font-bold w-full sm:w-auto"
                                        icon={<TbMapPin className="text-base" />}
                                    >
                                        {t('liveSessions.viewMapBtn', 'عرض على خرائط Google')}
                                    </Button>
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Progress Immunity Notice */}
                <div className="flex items-start gap-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 text-xs text-indigo-900 dark:text-indigo-200">
                    <TbInfoCircle className="text-base shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
                    <p className="leading-relaxed">
                        {t(
                            'liveSessions.progressNotice',
                            'تنبيه: الجلسات المباشرة والتفاعلية مخصصة للنقاش الحي ولا تتطلب إكمالاً أو مشاهدة مسجلة ولا تؤثر على نسبة إتمامك للدورة.',
                        )}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LiveSessionViewer
