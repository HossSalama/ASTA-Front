import type { NotificationGroup, NotificationItem } from '@/@types/notification'

/**
 * Utility to merge date groups from multiple paginated pages.
 * Handles server-side date groups ({ date, notifications }) as well as
 * flat item streams, preventing duplicate sections and items while preserving
 * descending chronological order.
 */
export function mergeNotificationGroups(
    pages: unknown[] | undefined,
): NotificationGroup[] {
    if (!pages || !Array.isArray(pages)) return []

    const groupMap = new Map<string, NotificationGroup>()

    for (const page of pages) {
        if (!page) continue

        const pageObj = page as Record<string, unknown>
        const pageData = pageObj.data as Record<string, unknown> | undefined

        // Extract items array from various possible wrapper structures
        let rawItems: unknown[] = []
        if (Array.isArray(page)) {
            rawItems = page
        } else if (Array.isArray(pageObj.items)) {
            rawItems = pageObj.items
        } else if (pageData && Array.isArray(pageData.items)) {
            rawItems = pageData.items
        } else if (Array.isArray(pageObj.data)) {
            rawItems = pageObj.data
        }

        for (const item of rawItems) {
            if (!item || typeof item !== 'object') continue

            const rec = item as Record<string, unknown>

            // Case A: The item is a date group object: { date: "YYYY-MM-DD", notifications: [...] }
            if (
                rec.date &&
                (Array.isArray(rec.notifications) || !rec.createdAt)
            ) {
                const dateKey = String(rec.date).split('T')[0]
                const notificationsList: NotificationItem[] = Array.isArray(
                    rec.notifications,
                )
                    ? (rec.notifications as NotificationItem[])
                    : []

                const existing = groupMap.get(dateKey)
                if (existing) {
                    const existingIds = new Set(
                        existing.notifications.map((n) => n.id),
                    )
                    for (const notif of notificationsList) {
                        if (!existingIds.has(notif.id)) {
                            existing.notifications.push(notif)
                            existingIds.add(notif.id)
                        }
                    }
                } else {
                    groupMap.set(dateKey, {
                        date: dateKey,
                        notifications: [...notificationsList],
                    })
                }
            }
            // Case B: The item is a flat notification item: { id, title, body, createdAt }
            else if (rec.createdAt || rec.id) {
                const notifItem = item as NotificationItem
                const dateKey = notifItem.createdAt
                    ? String(notifItem.createdAt).split('T')[0]
                    : new Date().toISOString().split('T')[0]

                const existing = groupMap.get(dateKey)
                if (existing) {
                    if (
                        !existing.notifications.some(
                            (n) => n.id === notifItem.id,
                        )
                    ) {
                        existing.notifications.push(notifItem)
                    }
                } else {
                    groupMap.set(dateKey, {
                        date: dateKey,
                        notifications: [notifItem],
                    })
                }
            }
        }
    }

    // Sort notifications within each group descending by createdAt or id
    for (const group of groupMap.values()) {
        group.notifications.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
            }
            return (b.id ?? 0) - (a.id ?? 0)
        })
    }

    // Return groups ordered descending by date
    return Array.from(groupMap.values()).sort((a, b) =>
        b.date.localeCompare(a.date),
    )
}

/**
 * Returns the deep link navigation path for a notification item based on its type and entityId.
 */
export function getNotificationRoute(
    notification: NotificationItem,
): string | null {
    const { type, entityId } = notification

    switch (type) {
        case 'payment_request':
            return entityId
                ? `/user/payment-requests/${entityId}`
                : '/user/payment-requests'

        case 'course_certificate':
            return '/certificates'

        case 'course_content':
            return entityId ? `/learn/${entityId}` : '/courses'

        default:
            return '/notifications'
    }
}

/**
 * Formats a calendar date string (YYYY-MM-DD) into a user-friendly section header
 * ("Today", "Yesterday", or formatted date string in user's local timezone).
 */
export function formatNotificationDateGroup(
    dateStr: string,
    locale: string = 'en',
    translations?: { today?: string; yesterday?: string },
): string {
    if (!dateStr) return ''

    const cleanDate = dateStr.split('T')[0]

    const now = new Date()
    const localYear = now.getFullYear()
    const localMonth = String(now.getMonth() + 1).padStart(2, '0')
    const localDay = String(now.getDate()).padStart(2, '0')
    const localToday = `${localYear}-${localMonth}-${localDay}`

    const yest = new Date(now)
    yest.setDate(yest.getDate() - 1)
    const yestYear = yest.getFullYear()
    const yestMonth = String(yest.getMonth() + 1).padStart(2, '0')
    const yestDay = String(yest.getDate()).padStart(2, '0')
    const localYesterday = `${yestYear}-${yestMonth}-${yestDay}`

    const isAr = locale?.startsWith('ar')

    if (cleanDate === localToday) {
        return translations?.today ?? (isAr ? 'اليوم' : 'Today')
    }

    if (cleanDate === localYesterday) {
        return translations?.yesterday ?? (isAr ? 'أمس' : 'Yesterday')
    }

    try {
        const [year, month, day] = cleanDate.split('-').map(Number)
        const dateObj = new Date(year, (month || 1) - 1, day || 1)
        return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(dateObj)
    } catch {
        return cleanDate
    }
}

/**
 * Formats an ISO 8601 timestamp to localized time (e.g., 08:15 AM / 08:15 ص).
 */
export function formatNotificationTime(
    isoString: string,
    locale: string = 'en',
): string {
    if (!isoString) return ''
    try {
        const isAr = locale?.startsWith('ar')
        return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(isoString))
    } catch {
        return ''
    }
}
