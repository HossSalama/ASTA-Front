import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type EnrollmentRecord = {
    courseId: number
    enrolledAt: string
    /** Content item ids the learner has marked complete. */
    completedItemIds: number[]
    /** Last content item opened, so "continue learning" resumes correctly. */
    lastItemId?: number
    /** Total lesson count of the course, captured from the curriculum. */
    totalItems?: number
    completedAt?: string
}

type EnrollmentState = {
    enrollments: Record<number, EnrollmentRecord>
}

type EnrollmentAction = {
    enroll: (courseId: number) => void
    unenroll: (courseId: number) => void
    setLastItem: (courseId: number, itemId: number) => void
    setTotalItems: (courseId: number, totalItems: number) => void
    toggleItemComplete: (
        courseId: number,
        itemId: number,
        totalItems: number,
    ) => void
    markItemComplete: (
        courseId: number,
        itemId: number,
        totalItems?: number,
    ) => void
    clearEnrollments: () => void
}

/**
 * The catalog API has no enrolment/progress resource yet. Rather than render
 * fabricated server statistics, learning state is tracked per device so the
 * Learn -> Progress -> Certificate journey is real for the person using it.
 * Swapping this store for API calls later touches only this file.
 */
export const useEnrollmentStore = create<EnrollmentState & EnrollmentAction>()(
    persist(
        (set) => ({
            enrollments: {},
            enroll: (courseId) =>
                set((state) =>
                    state.enrollments[courseId]
                        ? state
                        : {
                              enrollments: {
                                  ...state.enrollments,
                                  [courseId]: {
                                      courseId,
                                      enrolledAt: new Date().toISOString(),
                                      completedItemIds: [],
                                  },
                              },
                          },
                ),
            unenroll: (courseId) =>
                set((state) => {
                    const next = { ...state.enrollments }
                    delete next[courseId]
                    return { enrollments: next }
                }),
            setTotalItems: (courseId, totalItems) =>
                set((state) => {
                    const record = state.enrollments[courseId]
                    if (!record || !totalItems || record.totalItems === totalItems) {
                        return state
                    }
                    return {
                        enrollments: {
                            ...state.enrollments,
                            [courseId]: { ...record, totalItems },
                        },
                    }
                }),
            setLastItem: (courseId, itemId) =>
                set((state) => {
                    const record = state.enrollments[courseId]
                    if (!record) {
                        return state
                    }
                    return {
                        enrollments: {
                            ...state.enrollments,
                            [courseId]: { ...record, lastItemId: itemId },
                        },
                    }
                }),
            toggleItemComplete: (courseId, itemId, totalItems) =>
                set((state) => {
                    const record = state.enrollments[courseId]
                    if (!record) {
                        return state
                    }
                    const done = record.completedItemIds.includes(itemId)
                    const completedItemIds = done
                        ? record.completedItemIds.filter((id) => id !== itemId)
                        : [...record.completedItemIds, itemId]
                    const finished =
                        totalItems > 0 && completedItemIds.length >= totalItems

                    return {
                        enrollments: {
                            ...state.enrollments,
                            [courseId]: {
                                ...record,
                                totalItems: totalItems || record.totalItems,
                                completedItemIds,
                                completedAt: finished
                                    ? record.completedAt ||
                                      new Date().toISOString()
                                    : undefined,
                            },
                        },
                    }
                }),
            markItemComplete: (courseId, itemId, totalItems) =>
                set((state) => {
                    const record = state.enrollments[courseId]
                    if (!record) {
                        return state
                    }
                    if (record.completedItemIds.includes(itemId)) {
                        return state
                    }
                    const completedItemIds = [...record.completedItemIds, itemId]
                    const count = totalItems || record.totalItems || 0
                    const finished =
                        count > 0 && completedItemIds.length >= count

                    return {
                        enrollments: {
                            ...state.enrollments,
                            [courseId]: {
                                ...record,
                                totalItems: count || record.totalItems,
                                completedItemIds,
                                completedAt: finished
                                    ? record.completedAt ||
                                      new Date().toISOString()
                                    : undefined,
                            },
                        },
                    }
                }),
            clearEnrollments: () => set({ enrollments: {} }),
        }),
        {
            name: 'course-enrollments',
            storage: createJSONStorage(() => localStorage),
        },
    ),
)

export const useEnrollment = (courseId?: number) =>
    useEnrollmentStore((state) =>
        courseId ? state.enrollments[courseId] : undefined,
    )

export const progressPercent = (
    record: EnrollmentRecord | undefined,
    totalItems?: number,
) => {
    const total = totalItems || record?.totalItems || 0
    if (!record || !total) {
        return 0
    }
    const completedCount = Array.isArray(record.completedItemIds)
        ? record.completedItemIds.length
        : 0
    return Math.min(
        100,
        Math.round((completedCount / total) * 100),
    )
}
