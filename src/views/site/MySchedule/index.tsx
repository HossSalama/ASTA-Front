import { useState, useMemo } from 'react'
import Container from '@/components/shared/Container'
import StateView from '@/components/shared/catalog/StateView'
import ScheduleWeekStrip from './components/ScheduleWeekStrip'
import ScheduleTimeline from './components/ScheduleTimeline'
import InlineDatePicker from '@/components/ui/InlineDatePicker'
import Button from '@/components/ui/Button'
import { useMySchedule } from '@/utils/hooks/useSchedule'
import { useAuth } from '@/auth'
import useTranslation from '@/utils/hooks/useTranslation'
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb'
import dayjs from 'dayjs'

const MySchedule = () => {
    const { t, i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'
    const { authenticated } = useAuth()
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())

    const { schedule, isLoading, error, mutate } = useMySchedule(
        selectedDate,
        authenticated,
    )

    const isViewingToday = useMemo(() => {
        return (
            dayjs(selectedDate).format('YYYY-MM-DD') ===
            dayjs().format('YYYY-MM-DD')
        )
    }, [selectedDate])

    const handlePrevWeek = () => {
        setSelectedDate((prev) => dayjs(prev).subtract(7, 'day').toDate())
    }

    const handleNextWeek = () => {
        setSelectedDate((prev) => dayjs(prev).add(7, 'day').toDate())
    }

    const PrevIcon = isRtl ? TbChevronRight : TbChevronLeft
    const NextIcon = isRtl ? TbChevronLeft : TbChevronRight

    const dayNumber = String(selectedDate.getDate()).padStart(2, '0')
    const dayName = selectedDate.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        weekday: 'short',
    })
    const monthYear = selectedDate.toLocaleDateString(
        isRtl ? 'ar-EG' : 'en-US',
        {
            month: 'long',
            year: 'numeric',
        },
    )

    return (
        <main className="py-4 sm:py-8 lg:py-10 bg-[#F8FAFC] dark:bg-slate-950 min-h-[calc(100vh-64px)]">
            <Container width="default">
                {/* Main Card Frame matching the mockup */}
                <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-8 lg:p-10 shadow-xs">
                    {/* Header: Title shown on tablet/desktop, subtle on mobile */}
                    <header className="mb-4 sm:mb-6 hidden sm:block">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12263F] dark:text-white tracking-tight">
                            {t('mySchedule.title', 'My Schedule')}
                        </h1>
                    </header>

                    {!authenticated ? (
                        <StateView
                            action={{
                                label: t('mySchedule.signIn', 'Sign In'),
                                to: '/sign-in?redirectUrl=/my-schedule',
                            }}
                            description={t(
                                'mySchedule.signInPromptDesc',
                                'Please sign in with your student account to access your live classes timetable.',
                            )}
                            title={t(
                                'mySchedule.signInPromptTitle',
                                'Sign in to view your schedule',
                            )}
                            tone="unauthorized"
                        />
                    ) : (
                        <div>
                            {/* Big Date and Month Navigation Controls */}
                            <div className="flex items-center justify-between gap-3 pb-1">
                                {/* Big Date on Left: 25 Sat April 2026 */}
                                <div className="flex items-center gap-2.5 sm:gap-3.5 select-none">
                                    <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#12263F] dark:text-white leading-none tracking-tight font-sans">
                                        {dayNumber}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-sm sm:text-base font-bold text-[#12263F] dark:text-slate-200 leading-tight">
                                            {dayName}
                                        </span>
                                        <span className="text-xs sm:text-sm font-medium text-[#64748B] dark:text-slate-400 leading-tight mt-0.5">
                                            {monthYear}
                                        </span>
                                    </div>
                                </div>

                                {/* Controls on Right: Month Selector Pill + Optional Nav Arrows on Desktop */}
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Button
                                        aria-label={t(
                                            'mySchedule.prevWeek',
                                            'Previous Week',
                                        )}
                                        className="hidden sm:inline-flex text-[#64748B] hover:text-[#12263F]"
                                        icon={<PrevIcon className="text-sm" />}
                                        shape="circle"
                                        size="xs"
                                        variant="default"
                                        onClick={handlePrevWeek}
                                    />

                                    {/* Unified InlineDatePicker replaces manual pill + ScheduleDatePickerDropdown */}
                                    <InlineDatePicker
                                        value={selectedDate}
                                        onChange={setSelectedDate}
                                    />

                                    <Button
                                        aria-label={t(
                                            'mySchedule.nextWeek',
                                            'Next Week',
                                        )}
                                        className="hidden sm:inline-flex text-[#64748B] hover:text-[#12263F]"
                                        icon={<NextIcon className="text-sm" />}
                                        shape="circle"
                                        size="xs"
                                        variant="default"
                                        onClick={handleNextWeek}
                                    />
                                </div>
                            </div>

                            {/* 7-Day Week Strip */}
                            <div className="my-5 sm:my-8">
                                <ScheduleWeekStrip
                                    selectedDate={selectedDate}
                                    onSelectDate={(newDate) =>
                                        setSelectedDate(newDate)
                                    }
                                />
                            </div>

                            {/* Error state */}
                            {error ? (
                                <StateView
                                    action={
                                        <button
                                            className="inline-flex min-h-11 items-center rounded-md border border-border px-5 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary cursor-pointer"
                                            type="button"
                                            onClick={() => mutate()}
                                        >
                                            {t('mySchedule.retry', 'Try again')}
                                        </button>
                                    }
                                    description={
                                        (error as Error)?.message ||
                                        t(
                                            'mySchedule.errorDesc',
                                            'Please check your network connection and try again.',
                                        )
                                    }
                                    title={t(
                                        'mySchedule.errorTitle',
                                        'Unable to fetch schedule',
                                    )}
                                    tone="error"
                                />
                            ) : (
                                /* Continuous Hourly Timetable Layout */
                                <ScheduleTimeline
                                    isLoading={isLoading}
                                    isViewingToday={isViewingToday}
                                    schedule={schedule}
                                    onJumpToday={() =>
                                        setSelectedDate(new Date())
                                    }
                                />
                            )}
                        </div>
                    )}
                </div>
            </Container>
        </main>
    )
}

export default MySchedule
