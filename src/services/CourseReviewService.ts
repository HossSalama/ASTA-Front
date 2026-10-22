import ApiService from './ApiService'
import type { ApiResponse, PaginatedResult } from '@/@types/api'
import type {
    CourseReviewResponse,
    CreateOrUpdateReviewDto,
    GetCourseReviewsQueryParams,
    CourseReviewsListResponse,
    SingleCourseReviewResponse,
    EmptyApiResponse,
} from '@/@types/courseReview'

/**
 * 1. GET Paginated Course Reviews
 * Public endpoint: retrieves paginated reviews for a specific course.
 * GET /api/courses/{id}/reviews
 */
export async function apiGetCourseReviews(
    courseId: number,
    params?: GetCourseReviewsQueryParams,
): Promise<CourseReviewsListResponse> {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<CourseReviewResponse>>
    >({
        url: `/courses/${courseId}/reviews`,
        method: 'get',
        params,
    })
}

/**
 * 2. POST Create Course Review
 * Authenticated student endpoint: submits a rating and review comment.
 * POST /api/courses/{id}/reviews
 */
export async function apiCreateCourseReview(
    courseId: number,
    dto: CreateOrUpdateReviewDto,
): Promise<SingleCourseReviewResponse> {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseReviewResponse>,
        CreateOrUpdateReviewDto
    >({
        url: `/courses/${courseId}/reviews`,
        method: 'post',
        data: dto,
    })
}

/**
 * 3. PUT Update Course Review
 * Authenticated student endpoint: updates the user's existing review.
 * PUT /api/courses/{id}/reviews
 * (Backend resolves review via route courseId + JWT UserId claim)
 */
export async function apiUpdateCourseReview(
    courseId: number,
    dto: CreateOrUpdateReviewDto,
): Promise<SingleCourseReviewResponse> {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseReviewResponse>,
        CreateOrUpdateReviewDto
    >({
        url: `/courses/${courseId}/reviews`,
        method: 'put',
        data: dto,
    })
}

/**
 * 4. DELETE User Review (Own Review)
 * Authenticated student endpoint: deletes the user's own review.
 * DELETE /api/courses/{id}/reviews
 */
export async function apiDeleteMyCourseReview(
    courseId: number,
): Promise<EmptyApiResponse> {
    return ApiService.fetchDataWithAxios<ApiResponse<null>>({
        url: `/courses/${courseId}/reviews`,
        method: 'delete',
    })
}

/** Alias for backward compatibility */
export const apiDeleteCourseReview = apiDeleteMyCourseReview

/**
 * 5. DELETE Admin Review (Any Review)
 * Admin-only endpoint: deletes any review by primary key ID.
 * DELETE /api/admin/reviews/{reviewId}
 */
export async function apiAdminDeleteCourseReview(
    reviewId: number,
): Promise<EmptyApiResponse> {
    return ApiService.fetchDataWithAxios<ApiResponse<null>>({
        url: `/admin/reviews/${reviewId}`,
        method: 'delete',
    })
}

/** Alias for admin moderation */
export const apiDeleteCourseReviewByAdmin = apiAdminDeleteCourseReview
