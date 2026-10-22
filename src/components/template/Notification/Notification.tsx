import { useRef } from 'react'
import classNames from 'classnames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Dropdown from '@/components/ui/Dropdown'
import ScrollBar from '@/components/ui/ScrollBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Tooltip from '@/components/ui/Tooltip'
import NotificationAvatar from './NotificationAvatar'
import NotificationToggle from './NotificationToggle'
import { HiOutlineCheck, HiOutlineBell } from 'react-icons/hi2'
import useResponsive from '@/utils/hooks/useResponsive'
import useTranslation from '@/utils/hooks/useTranslation'
import { useNavigate } from 'react-router-dom'
import { useUserNotifications } from '@/utils/hooks/useUserNotifications'
import {
    getNotificationRoute,
    formatNotificationTime,
    formatNotificationDateGroup,
} from '@/utils/notificationHelpers'

import type { DropdownRef } from '@/components/ui/Dropdown'
import type { NotificationItem } from '@/@types/notification'

const notificationHeight = 'h-[320px]'

const _Notification = ({ className }: { className?: string }) => {
    const { t, i18n } = useTranslation()
    const currentLang = i18n?.language || 'en'
    const { larger } = useResponsive()
    const navigate = useNavigate()
    const notificationDropdownRef = useRef<DropdownRef>(null)

    const {
        groupedItems,
        allNotifications,
        isLoading,
        hasUnread,
        markAllAsRead,
        markAsRead,
        isRead,
        refetch,
    } = useUserNotifications(10)

    const handleDropdownOpen = () => {
        refetch()
    }

    const handleNotificationClick = (item: NotificationItem) => {
        markAsRead(item.id)
        if (notificationDropdownRef.current) {
            notificationDropdownRef.current.handleDropdownClose()
        }
        const route = getNotificationRoute(item)
        if (route) {
            navigate(route)
        }
    }

    const handleViewAll = () => {
        if (notificationDropdownRef.current) {
            notificationDropdownRef.current.handleDropdownClose()
        }
        navigate('/notifications')
    }

    return (
        <Dropdown
            ref={notificationDropdownRef}
            renderTitle={
                <NotificationToggle
                    dot={hasUnread}
                    className={className}
                />
            }
            menuClass="min-w-[300px] sm:min-w-[360px] p-0"
            placement={larger.md ? 'bottom-end' : 'bottom'}
            onOpen={handleDropdownOpen}
        >
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h6 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                        {t('common.notifications', 'Notifications')}
                    </h6>
                    {hasUnread && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {allNotifications.filter((n) => !isRead(n.id)).length}
                        </span>
                    )}
                </div>
                <Tooltip title={t('common.markAllAsRead', 'Mark all as read')}>
                    <Button
                        variant="plain"
                        shape="circle"
                        size="xs"
                        icon={<HiOutlineCheck className="text-lg" />}
                        onClick={markAllAsRead}
                    />
                </Tooltip>
            </div>

            <ScrollBar
                className={classNames('overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800', notificationHeight)}
            >
                {isLoading && allNotifications.length === 0 ? (
                    <div
                        className={classNames(
                            'flex items-center justify-center',
                            notificationHeight,
                        )}
                    >
                        <Spinner size={32} />
                    </div>
                ) : allNotifications.length === 0 ? (
                    <div
                        className={classNames(
                            'flex flex-col items-center justify-center p-6 text-center text-gray-500 dark:text-gray-400',
                            notificationHeight,
                        )}
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-3 text-2xl">
                            <HiOutlineBell />
                        </div>
                        <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                            {t('common.noNotifications', 'No notifications')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                            {t(
                                'site.notifications.emptyDesc',
                                'Updates about courses, certificates and payments will appear here.',
                            )}
                        </p>
                    </div>
                ) : (
                    groupedItems
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
                                yesterday: t('common.yesterday', 'Yesterday'),
                            },
                        )

                        return (
                            <div key={group.date}>
                                <div className="px-4 py-1.5 text-[#215D8B] dark:text-[#6FAEDC] font-bold text-xs uppercase tracking-wider bg-gray-50/70 dark:bg-gray-800/40 border-y border-gray-100 dark:border-gray-800">
                                    {dateTitle}
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                    {group.notifications.map((item) => {
                                        const itemRead = isRead(item.id)
                                        return (
                                            <div
                                                key={item.id}
                                                className={classNames(
                                                    'relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60',
                                                    !itemRead &&
                                                        'bg-orange-50/20 dark:bg-orange-950/20',
                                                )}
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        item,
                                                    )
                                                }
                                            >
                                                <div className="shrink-0 pt-0.5">
                                                    <NotificationAvatar
                                                        size="sm"
                                                        type={item.type}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline justify-between gap-2">
                                                        <p
                                                            className={classNames(
                                                                'text-xs truncate font-medium',
                                                                itemRead
                                                                    ? 'text-gray-700 dark:text-gray-300'
                                                                    : 'text-gray-900 dark:text-gray-100 font-bold',
                                                            )}
                                                        >
                                                            {item.title}
                                                        </p>
                                                        <span className="text-[10px] text-gray-400 shrink-0">
                                                            {formatNotificationTime(
                                                                item.createdAt,
                                                                currentLang,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                                                        {item.body}
                                                    </p>
                                                </div>
                                                {!itemRead && (
                                                    <div className="shrink-0 self-center">
                                                        <span className="block w-2 h-2 rounded-full bg-[#3ABB90]" />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })
                )}
            </ScrollBar>

            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                <Button
                    block
                    size="sm"
                    variant="plain"
                    className="text-primary hover:text-primary-hover font-semibold text-xs py-2"
                    onClick={handleViewAll}
                >
                    {t('common.viewAllActivity', 'View all notifications')}
                </Button>
            </div>
        </Dropdown>
    )
}

const Notification = withHeaderItem(_Notification)

export default Notification
