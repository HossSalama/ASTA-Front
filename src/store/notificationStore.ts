import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface NotificationStoreState {
    lastReadNotificationId: number | null
    readNotificationIds: number[]
}

interface NotificationStoreActions {
    markAsRead: (id: number) => void
    markAllAsRead: (latestId?: number) => void
    isRead: (id: number) => boolean
    clear: () => void
}

export const useNotificationStore = create<
    NotificationStoreState & NotificationStoreActions
>()(
    persist(
        (set, get) => ({
            lastReadNotificationId: null,
            readNotificationIds: [],

            markAsRead: (id: number) =>
                set((state) => {
                    if (state.readNotificationIds.includes(id)) {
                        return state
                    }
                    return {
                        readNotificationIds: [...state.readNotificationIds, id],
                    }
                }),

            markAllAsRead: (latestId?: number) =>
                set((state) => {
                    const newWatermark =
                        latestId !== undefined
                            ? Math.max(state.lastReadNotificationId ?? 0, latestId)
                            : state.lastReadNotificationId

                    return {
                        lastReadNotificationId: newWatermark,
                        readNotificationIds: [],
                    }
                }),

            isRead: (id: number) => {
                const { lastReadNotificationId, readNotificationIds } = get()
                if (
                    lastReadNotificationId !== null &&
                    id <= lastReadNotificationId
                ) {
                    return true
                }
                return readNotificationIds.includes(id)
            },

            clear: () =>
                set({
                    lastReadNotificationId: null,
                    readNotificationIds: [],
                }),
        }),
        {
            name: 'iatc_notifications_read_state',
            storage: createJSONStorage(() => localStorage),
        },
    ),
)
