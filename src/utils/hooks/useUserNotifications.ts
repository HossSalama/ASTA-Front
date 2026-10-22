import { useMemo, useCallback } from 'react'
import useSWRInfinite from 'swr/infinite'
import type { SWRInfiniteKeyLoader } from 'swr/infinite'
import { apiGetNotifications } from '@/services/NotificationService'
import { mergeNotificationGroups } from '@/utils/notificationHelpers'
import { useNotificationStore } from '@/store/notificationStore'
import { useSessionUser } from '@/store/authStore'
import { useLocaleStore } from '@/store/localeStore'
import type { NotificationGroup, NotificationItem } from '@/@types/notification'
import type { PaginatedResult, ApiResponse } from '@/@types/api'

export function useUserNotifications(
    pageSize: number = 10,
    enabled: boolean = true,
) {
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const userId = useSessionUser((state) => state.user.id)
    const locale = useLocaleStore((state) => state.currentLang)

    const authKey = signedIn ? userId || 'auth' : null

    const getKey: SWRInfiniteKeyLoader = (pageIndex, previousPageData) => {
        if (!enabled || !authKey) return null

        if (
            previousPageData &&
            (!previousPageData.data?.hasNextPage || !previousPageData.status)
        ) {
            return null
        }

        return [
            'user-notifications',
            pageIndex + 1,
            pageSize,
            locale,
            authKey,
        ]
    }

    const { data, error, isValidating, size, setSize, mutate } =
        useSWRInfinite<ApiResponse<PaginatedResult<NotificationGroup>>>(
            getKey,
            ([, pageNum, pSize]) =>
                apiGetNotifications({
                    pageNumber: pageNum as number,
                    pageSize: pSize as number,
                }),
            {
                revalidateOnFocus: true,
                revalidateIfStale: true,
                shouldRetryOnError: false,
            },
        )

    const pages = useMemo(() => {
        if (!data) return []
        return data
            .map((res) => res?.data)
            .filter(Boolean) as PaginatedResult<NotificationGroup>[]
    }, [data])

    const groupedItems: NotificationGroup[] = useMemo(() => {
        return mergeNotificationGroups(pages)
    }, [pages])

    const allNotifications: NotificationItem[] = useMemo(() => {
        return groupedItems.flatMap((g) => g.notifications ?? [])
    }, [groupedItems])

    const lastPage = pages.length > 0 ? pages[pages.length - 1] : undefined
    const totalCount = pages[0]?.totalCount ?? 0
    const totalPages = pages[0]?.totalPages ?? 0
    const hasNextPage = lastPage ? lastPage.hasNextPage : false

    const isLoading = !data && !error && Boolean(enabled && authKey)
    const isFetchingNextPage =
        isValidating && Boolean(data && data.length < size)

    const {
        markAsRead,
        markAllAsRead: storeMarkAllAsRead,
        isRead,
    } = useNotificationStore()

    const unreadCount = useMemo(() => {
        return allNotifications.filter((item) => !isRead(item.id)).length
    }, [allNotifications, isRead])

    const hasUnread = unreadCount > 0

    const markAllAsRead = useCallback(() => {
        if (allNotifications.length > 0) {
            const maxId = Math.max(...allNotifications.map((item) => item.id))
            storeMarkAllAsRead(maxId)
        } else {
            storeMarkAllAsRead()
        }
    }, [allNotifications, storeMarkAllAsRead])

    const fetchNextPage = useCallback(async () => {
        if (hasNextPage && !isValidating) {
            await setSize((prev) => prev + 1)
        }
    }, [hasNextPage, isValidating, setSize])

    const refetch = useCallback(async () => {
        await mutate()
    }, [mutate])

    return {
        groupedItems,
        allNotifications,
        totalCount,
        totalPages,
        pageNumber: size,
        hasNextPage,
        isLoading,
        isValidating,
        isFetchingNextPage,
        error,
        fetchNextPage,
        refetch,
        mutate,
        unreadCount,
        hasUnread,
        markAsRead,
        markAllAsRead,
        isRead,
    }
}

export default useUserNotifications
