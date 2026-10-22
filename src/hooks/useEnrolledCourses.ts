import { useMyEnrollments } from '@/utils/hooks/useCatalog'
import type {
    EnrollmentFilter,
    EnrollmentFilterValue,
    EnrolledCourseSummary,
} from '@/types/enrollments'

export interface UseEnrolledCoursesResult {
    data: EnrolledCourseSummary[]
    isLoading: boolean
    error: unknown
    mutate: () => Promise<unknown>
    refetch: () => Promise<unknown>
}

/**
 * Custom hook to fetch and cache enrolled courses with optional status filter,
 * conforming to Section 7.2 of the frontend-enrolled-courses-api guide.
 *
 * @param filter - Optional filter (InProgress, PendingPayment, Completed, or undefined for All)
 */
export const useEnrolledCourses = (
    filter?: EnrollmentFilter | EnrollmentFilterValue,
): UseEnrolledCoursesResult => {
    const { enrollments, isLoading, error, mutate } = useMyEnrollments(filter)

    return {
        data: enrollments as EnrolledCourseSummary[],
        isLoading,
        error,
        mutate,
        refetch: mutate,
    }
}

export default useEnrolledCourses
