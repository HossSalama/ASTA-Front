import ApiService from './ApiService'
import type { ApiResponse } from '@/@types/api'
import type {
    CourseProgressResponse,
    UpdateContentProgressDto,
    ContentProgressResponse,
} from '@/@types/courseProgress'

/**
 * ====================================================
 * Course Progress & Playback Resumption API
 * ====================================================
 */

/**
 * 1. Get Full Course Curriculum & Progress Outline
 * GET /api/courses/{courseId}/progress
 * Populates the classroom curriculum tree, per-lesson completion states,
 * and the overall course progress percentage.
 */
export async function apiGetCourseProgress(courseId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<CourseProgressResponse>>({
        url: `/courses/${courseId}/progress`,
        method: 'get',
    })
}

/**
 * 2. Update Video Playback Heartbeat / Position
 * PUT /api/courses/{courseId}/contents/{contentId}/progress
 * Sent periodically while video plays, on pause/ended, and on leave.
 * Evaluates 90% completion and returns newly calculated overall progress if completed.
 */
export async function apiUpdateCourseContentProgress(
    courseId: number,
    contentId: number,
    data: UpdateContentProgressDto,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<ContentProgressResponse>,
        UpdateContentProgressDto
    >({
        url: `/courses/${courseId}/contents/${contentId}/progress`,
        method: 'put',
        data,
    })
}

/**
 * 3. Get Saved Position & Completion Directly for a Content Item
 * GET /api/courses/{courseId}/contents/{contentId}/progress
 */
export async function apiGetCourseContentProgress(
    courseId: number,
    contentId: number,
) {
    return ApiService.fetchDataWithAxios<ApiResponse<ContentProgressResponse>>({
        url: `/courses/${courseId}/contents/${contentId}/progress`,
        method: 'get',
    })
}
