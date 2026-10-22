import ApiService from './ApiService'
import type { ApiResponse, PaginatedResult } from '@/@types/api'
import type { CourseCategoryPublicResponse } from '@/@types/courseCategory'
import type {
    PublicCourseSummary,
    PublicCourseDetails,
    HomePageData,
    PublicInstructorSummary,
    GetPublicCoursesQueryParams,
    GetPublicInstructorsQueryParams,
} from '@/@types/publicCatalog'
import type {
    EnrolledCourseSummary,
    EnrollmentFilter,
} from '@/@types/courseProgress'

export type CatalogCourse = PublicCourseSummary
export type CatalogCourseDetails = PublicCourseDetails

export interface CatalogCourseQuery extends GetPublicCoursesQueryParams {
    /** Client-side refinements applied on top of the server result set. */
    level?: string
    language?: string
    priceBucket?: 'free' | 'paid'
    minRating?: number
    sort?: CatalogSort
}

export type CatalogSort = 'newest' | 'rating' | 'priceAsc' | 'priceDesc'

// ==================== 1. Home Page ====================
/**
 * 1. Fetch Home Page Data
 * GET /api/home
 * Retrieves combined data: popular courses (paginated) and active advertisements.
 */
export async function apiGetHomePageData(pageNumber = 1, pageSize = 10) {
    return ApiService.fetchDataWithAxios<ApiResponse<HomePageData>>({
        url: '/home',
        method: 'get',
        params: { pageNumber, pageSize },
    })
}

// ==================== 2. Public Courses Catalog ====================
/**
 * 2. Fetch Public Course Catalog
 * GET /api/courses/public
 * Paginated public course catalog with search and category filtering.
 */
export async function apiGetPublicCourses(params?: GetPublicCoursesQueryParams) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<PublicCourseSummary>>
    >({
        url: '/courses/public',
        method: 'get',
        params,
    })
}

/** Alias for backward compatibility */
export const apiGetCatalogCourses = apiGetPublicCourses

// ==================== 3. Public Course Details ====================
/**
 * 3. Fetch Public Course Details
 * GET /api/courses/public/{id}
 * Full course details (instructor, requirements, jobs, curriculum, reviews, isEnrolled).
 */
export async function apiGetPublicCourseDetails(courseId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<PublicCourseDetails>>({
        url: `/courses/public/${courseId}`,
        method: 'get',
    })
}

/** Alias for backward compatibility */
export const apiGetCatalogCourse = apiGetPublicCourseDetails

// ==================== 4. Student Enrollments ====================
export {
    apiGetMyEnrolledCourses,
    getMyEnrolledCourses,
    apiEnrollInCourse,
} from './enrollmentsService'

// ==================== 5. Course Reviews ====================
export {
    apiGetCourseReviews,
    apiCreateCourseReview,
    apiUpdateCourseReview,
    apiDeleteCourseReview,
    apiDeleteMyCourseReview,
} from './CourseReviewService'

// ==================== 6. Public Instructors ====================
/**
 * 9. Fetch Public Instructors Directory
 * GET /api/instructors/public
 * Retrieves paginated active instructor profiles with optional keyword search.
 */
export async function apiGetPublicInstructors(
    params?: GetPublicInstructorsQueryParams,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<PublicInstructorSummary>>
    >({
        url: '/instructors/public',
        method: 'get',
        params,
    })
}

/** Alias for backward compatibility */
export const apiGetCatalogInstructors = apiGetPublicInstructors

// ==================== 7. Public Categories ====================
/**
 * 10. Fetch Public Course Categories
 * GET /api/course-categories/public
 */
export async function apiGetCatalogCategories() {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseCategoryPublicResponse[]>
    >({
        url: '/course-categories/public',
        method: 'get',
    })
}
