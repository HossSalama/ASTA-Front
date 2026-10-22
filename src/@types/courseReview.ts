import type { ApiResponse, PaginatedResult } from './api'

/**
 * Detailed Course Review model returned by the backend.
 * Conforms to CourseReviewResponse in docs/frontend-course-reviews-api.md
 */
export interface CourseReviewResponse {
    id: number
    courseId: number
    userId: string
    userName: string
    userImage: string | null
    rating: number // 1 to 5
    comment: string | null
    createdAt: string // ISO-8601 UTC string
    updatedAt: string | null // ISO-8601 UTC string or null
}

/**
 * Request payload for creating or updating a review.
 * Conforms to CreateOrUpdateReviewDto in docs/frontend-course-reviews-api.md
 */
export interface CreateOrUpdateReviewDto {
    /** Star rating from 1 to 5 (required) */
    rating: number
    /** Optional review comment, max 1000 characters */
    comment?: string | null
}

/**
 * Alias for backward compatibility
 */
export type CreateOrUpdateReviewPayload = CreateOrUpdateReviewDto

/**
 * Query parameters supported by the paginated reviews GET endpoint.
 * Route: GET /api/courses/{id}/reviews
 */
export interface GetCourseReviewsQueryParams {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
    sortBy?: 'date' | 'createdat' | 'rating'
    sortOrder?: 'asc' | 'desc'
}

/**
 * Structured validation errors returned when validation fails.
 */
export interface ValidationErrorData {
    errors: Record<string, string[]>
}

/**
 * Course Rating Breakdown Models (from Course Details)
 */
export interface RatingStarBreakdown {
    star: number
    count: number
    percentage: number
}

export interface RatingBreakdown {
    fiveStars: RatingStarBreakdown
    fourStars: RatingStarBreakdown
    threeStars: RatingStarBreakdown
    twoStars: RatingStarBreakdown
    oneStar: RatingStarBreakdown
}

/**
 * Type aliases for endpoint responses
 */
export type CourseReviewsListResponse = ApiResponse<PaginatedResult<CourseReviewResponse>>
export type SingleCourseReviewResponse = ApiResponse<CourseReviewResponse>
export type EmptyApiResponse = ApiResponse<null>
