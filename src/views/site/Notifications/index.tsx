import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import { TbCheck, TbRefresh } from 'react-icons/tb'
import Container from '@/components/shared/Container'
import StateView from '@/components/shared/catalog/StateView'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import NotificationAvatar from '@/components/template/Notification/NotificationAvatar'
import { useUserNotifications } from '@/utils/hooks/useUserNotifications'
import useInfiniteScroll from '@/utils/hooks/useInfiniteScroll'
import {
    formatNotificationDateGroup,
    formatNotificationTime,
    getNotificationRoute,
} from '@/utils/notificationHelpers'
import type { NotificationItem } from '@/@types/notification'

const NotificationSkeleton = () => (
    <div className="space-y-6 max-w-2xl animate-pulse">
        <div className="h-6 w-24 rounded bg-orange-100 dark:bg-orange-950/40" />
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4 py-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#EAF1F8] dark:bg-[#14232F] shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                        <div className="h-4 w-2/5 rounded bg-gray-100 dark:bg-gray-800" />
                        <div className="h-3 w-4/5 rounded bg-gray-100 dark:bg-gray-800" />
                        <div className="h-3 w-3/5 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                </div>
            ))}
        </div>
    </div>
)

const Notifications = () => {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const currentLang = i18n.language || 'en'
    const isRtl = currentLang.startsWith('ar')

    const {
        groupedItems,
        totalCount,
        hasNextPage,
        isLoading,
        isFetchingNextPage,
        error,
        fetchNextPage,
        refetch,
        unreadCount,
        hasUnread,
        markAsRead,
        markAllAsRead,
        isRead,
    } = useUserNotifications(15)

    const handleLoadMore = useCallback(async () => {
        if (hasNextPage && !isFetchingNextPage) {
            await fetchNextPage()
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const { containerRef } = useInfiniteScroll({
        shouldStop: !hasNextPage || isFetchingNextPage,
        onLoadMore: handleLoadMore,
        offset: '150px',
    })

    const handleNotificationClick = (item: NotificationItem) => {
        markAsRead(item.id)
        const targetRoute = getNotificationRoute(item)
        if (targetRoute) {
            navigate(targetRoute)
        }
    }

    return (
        <main className="py-8 md:py-12 min-h-[70vh]">
            <Container>
                {/* Header Bar */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800 pb-5 max-w-2xl">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                {t('site.notifications.title', 'Notifications')}
                            </h1>
                            {totalCount > 0 && (
                                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    {totalCount}
                                </span>
                            )}
                            {hasUnread && (
                                <span className="inline-flex items-center rounded-full bg-[#EAF1F8] dark:bg-[#14232F] px-2.5 py-0.5 text-xs font-bold text-[#215D8B]">
                                    {unreadCount}{' '}
                                    {t(
                                        'site.notifications.unread',
                                        isRtl ? 'غير مقروء' : 'unread',
                                    )}
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {t(
                                'site.notifications.subtitle',
                                'Updates about your courses, certificates, and payment requests.',
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {hasUnread && (
                            <Button
                                className="text-xs font-semibold text-[#215D8B] hover:text-[#214A79]"
                                icon={<TbCheck className="text-base" />}
                                size="sm"
                                variant="plain"
                                onClick={markAllAsRead}
                            >
                                {t('common.markAllAsRead', 'Mark all as read')}
                            </Button>
                        )}
                        <Button
                            className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            icon={<TbRefresh className="text-base" />}
                            size="sm"
                            title={t('common.refresh', 'Refresh')}
                            variant="plain"
                            onClick={() => refetch()}
                        />
                    </div>
                </div>

                {/* Content */}
                {error ? (
                    <StateView
                        action={
                            <Button
                                size="sm"
                                variant="solid"
                                onClick={() => refetch()}
                            >
                                {t('common.retry', 'Retry')}
                            </Button>
                        }
                        description={t(
                            'site.notifications.errorDesc',
                            'Something went wrong while retrieving your notifications. Please check your connection and try again.',
                        )}
                        title={t(
                            'site.notifications.errorTitle',
                            'Failed to load notifications',
                        )}
                        tone="error"
                    />
                ) : isLoading && groupedItems.length === 0 ? (
                    <NotificationSkeleton />
                ) : totalCount === 0 ? (
                    <StateView
                        action={{
                            label: t('site.nav.courses', 'Explore Courses'),
                            to: '/courses',
                        }}
                        description={t(
                            'site.notifications.emptyDesc',
                            'When you enroll in courses, receive certificates, or submit payment requests, updates will appear here.',
                        )}
                        title={t(
                            'site.notifications.emptyTitle',
                            'No notifications yet',
                        )}
                        tone="empty"
                    />
                ) : (
                    <div ref={containerRef} className="max-w-2xl space-y-8">
                        {groupedItems
                            .filter(
                                (group) =>
                                    group.notifications &&
                                    group.notifications.length > 0,
                            )
                            .map((group) => {
                            const dateTitle = formatNotificationDateGroup(
                                group.date,
                                currentLang,
                                {
                                    today: t('common.today', 'Today'),
                                    yesterday: t(
                                        'common.yesterday',
                                        'Yesterday',
                                    ),
                                },
                            )

                            return (
                                <section
                                    key={group.date}
                                    aria-label={dateTitle}
                                    className="space-y-1"
                                >
                                    {/* Orange Group Header Matching Screenshot */}
                                    <h2 className="text-[#215D8B] dark:text-[#6FAEDC] text-lg md:text-xl font-bold tracking-tight mb-2 px-1">
                                        {dateTitle}
                                    </h2>

                                    {/* Items with thin divider lines matching screenshot */}
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
                                        {group.notifications.map((item) => {
                                            const itemRead = isRead(item.id)
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={classNames(
                                                        'group flex items-start gap-4 py-4 px-2 -mx-2 rounded-2xl transition-colors cursor-pointer',
                                                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                                                        itemRead
                                                            ? 'hover:bg-gray-50/80 dark:hover:bg-gray-800/40'
                                                            : 'bg-orange-50/20 dark:bg-orange-950/20 hover:bg-orange-50/50 dark:hover:bg-orange-950/40',
                                                    )}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() =>
                                                        handleNotificationClick(
                                                            item,
                                                        )
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (
                                                            e.key === 'Enter' ||
                                                            e.key === ' '
                                                        ) {
                                                            e.preventDefault()
                                                            handleNotificationClick(
                                                                item,
                                                            )
                                                        }
                                                    }}
                                                >
                                                    <NotificationAvatar
                                                        type={item.type}
                                                    />

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline justify-between gap-3">
                                                            <h3
                                                                className={classNames(
                                                                    'text-[15px] font-bold text-gray-900 dark:text-gray-100 leading-snug',
                                                                    !itemRead &&
                                                                        'text-gray-950 dark:text-white',
                                                                )}
                                                            >
                                                                {item.title}
                                                            </h3>
                                                            <time
                                                                className="text-xs text-gray-400 dark:text-gray-500 shrink-0"
                                                                dateTime={
                                                                    item.createdAt
                                                                }
                                                            >
                                                                {formatNotificationTime(
                                                                    item.createdAt,
                                                                    currentLang,
                                                                )}
                                                            </time>
                                                        </div>

                                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                                                            {item.body}
                                                        </p>
                                                    </div>

                                                    {!itemRead && (
                                                        <span className="w-2 h-2 rounded-full bg-[#3ABB90] shrink-0 self-center" />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            )
                        })}

                        {/* Loading more spinner */}
                        {isFetchingNextPage && (
                            <div className="flex justify-center py-6">
                                <Spinner size={28} />
                            </div>
                        )}

                        {/* Manual load more button */}
                        {hasNextPage && !isFetchingNextPage && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    className="border border-gray-200 dark:border-gray-700 text-xs font-semibold px-6 py-2 text-gray-600 dark:text-gray-300"
                                    size="sm"
                                    variant="plain"
                                    onClick={handleLoadMore}
                                >
                                    {t(
                                        'common.loadMore',
                                        'Load older notifications',
                                    )}
                                </Button>
                            </div>
                        )}

                        {!hasNextPage && totalCount > 0 && (
                            <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800">
                                {t(
                                    'site.notifications.allCaughtUp',
                                    'You have reached the end of your notifications.',
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Container>
        </main>
    )
}

export default Notifications
