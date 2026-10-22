/**
 * Course Review Admin Service
 * Re-exports unified CourseReviewService functions for admin moderation
 */
export {
    apiGetCourseReviews,
    apiAdminDeleteCourseReview as apiDeleteCourseReview,
    apiAdminDeleteCourseReview,
} from './CourseReviewService'
