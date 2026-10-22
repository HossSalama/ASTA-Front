import useSWR from 'swr'
import { useLocaleStore } from '@/store/localeStore'
import { useSessionUser } from '@/store/authStore'
import { apiGetCourseProgress } from '@/services/CourseProgressService'

const swrOptions = {
    // Auto-sync progress when student returns to the browser tab per doc Section 7.2 & 8.4
    revalidateOnFocus: true,
    revalidateIfStale: false,
    shouldRetryOnError: false,
    // Keep the last successfully fetched course progress visible while a
    // background mutate / revalidation is in-flight or fails. This prevents
    // the learning player from flashing the "Course not found" error screen
    // when mutateProgress() is called after a lesson completes.
    keepPreviousData: true,
}

/**
 * Custom hook to fetch and reactively track full course progress outline,
 * including per-item completion statuses, playback positions, and overall course progress percentage.
 * Calls GET /api/courses/{courseId}/progress.
 */
export const useCourseProgress = (courseId?: number, enabled: boolean = true) => {
    const locale = useLocaleStore((state) => state.currentLang)
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const userId = useSessionUser((state) => state.user.id)
    const authKey = signedIn ? userId || 'auth' : null

    const { data, error, isLoading, mutate } = useSWR(
        courseId && enabled
            ? ['course/progress', courseId, locale, authKey]
            : null,
        ([, id]) => apiGetCourseProgress(id as number),
        swrOptions,
    )

    return {
        courseProgress: data?.data ?? null,
        isLoading,
        error,
        mutate,
    }
}

export default useCourseProgress
