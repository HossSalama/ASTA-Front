import ApiService from './ApiService'
import type { ApiResponse } from '@/@types/api'
import type {
    EnrolledCourseSummary,
    EnrollmentFilter,
    EnrollmentFilterValue,
} from '@/types/enrollments'

/**
 * Fetch enrolled courses with optional filter.
 * GET /api/enrollments?status={InProgress|PendingPayment|Completed}
 *
 * @param status - Optional filter: InProgress, PendingPayment, Completed, or undefined for all
 * @returns List of enrolled course summaries unwrapped from the ApiResponse envelope
 */
export const getMyEnrolledCourses = async (
    status?: EnrollmentFilter | EnrollmentFilterValue,
): Promise<EnrolledCourseSummary[]> => {
    const response = await ApiService.fetchDataWithAxios<
        ApiResponse<EnrolledCourseSummary[]>
    >({
        url: '/enrollments',
        method: 'get',
        params: status !== undefined && status !== null ? { status } : undefined,
    })

    if (response && response.status === false) {
        throw new Error(response.message || 'Failed to fetch enrolled courses.')
    }

    return response?.data ?? []
}

/**
 * Direct API response envelope call.
 * GET /api/enrollments?status={filter}
 */
export async function apiGetMyEnrolledCourses(
    status?: EnrollmentFilter | EnrollmentFilterValue,
) {
    return ApiService.fetchDataWithAxios<ApiResponse<EnrolledCourseSummary[]>>({
        url: '/enrollments',
        method: 'get',
        params: status !== undefined && status !== null ? { status } : undefined,
    })
}

/**
 * Enroll in a free or direct-access course
 * POST /api/enrollments/{courseId}
 */
export async function apiEnrollInCourse(courseId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>>({
        url: `/enrollments/${courseId}`,
        method: 'post',
    })
}

export default {
    getMyEnrolledCourses,
    apiGetMyEnrolledCourses,
    apiEnrollInCourse,
}
