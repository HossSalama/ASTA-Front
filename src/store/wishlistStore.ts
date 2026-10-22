import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type WishlistState = {
    courseIds: number[]
}

type WishlistAction = {
    toggle: (courseId: number) => void
    remove: (courseId: number) => void
    clear: () => void
}

/**
 * Saved courses are a genuine client-side capability: the catalog API has no
 * wishlist resource yet, so the list is persisted per device rather than
 * faked against the server.
 */
export const useWishlistStore = create<WishlistState & WishlistAction>()(
    persist(
        (set) => ({
            courseIds: [],
            toggle: (courseId) =>
                set((state) => ({
                    courseIds: state.courseIds.includes(courseId)
                        ? state.courseIds.filter((id) => id !== courseId)
                        : [courseId, ...state.courseIds],
                })),
            remove: (courseId) =>
                set((state) => ({
                    courseIds: state.courseIds.filter((id) => id !== courseId),
                })),
            clear: () => set({ courseIds: [] }),
        }),
        {
            name: 'saved-courses',
            storage: createJSONStorage(() => localStorage),
        },
    ),
)

export const useIsSaved = (courseId: number) =>
    useWishlistStore((state) => state.courseIds.includes(courseId))
