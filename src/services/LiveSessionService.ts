import ApiService from './ApiService'
import type { ApiResponse } from '@/@types/api'
import type {
    CreateLiveSessionDto,
    UpdateLiveSessionDto,
    LiveSessionResponseDto,
} from '@/@types/courseContent'

/**
 * ====================================================
 * Live Sessions API (/api/live-sessions)
 * ====================================================
 */

/**
 * 1. Create Live Session satellite record
 * POST /api/live-sessions
 */
export async function apiCreateLiveSession(data: CreateLiveSessionDto) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<number>,
        CreateLiveSessionDto
    >({
        url: '/live-sessions',
        method: 'post',
        data,
    })
}

/**
 * 2. Get Live Session by Content ID
 * GET /api/live-sessions/content/{contentId}
 */
export async function apiGetLiveSessionByContentId(contentId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<LiveSessionResponseDto>>({
        url: `/live-sessions/content/${contentId}`,
        method: 'get',
    })
}

/**
 * 3. Update or Reschedule Live Session
 * PUT /api/live-sessions/content/{contentId}
 */
export async function apiUpdateLiveSession(
    contentId: number,
    data: UpdateLiveSessionDto,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<null>,
        UpdateLiveSessionDto
    >({
        url: `/live-sessions/content/${contentId}`,
        method: 'put',
        data,
    })
}

/**
 * 4. Delete Live Session satellite record
 * DELETE /api/live-sessions/content/{contentId}
 */
export async function apiDeleteLiveSession(contentId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>>({
        url: `/live-sessions/content/${contentId}`,
        method: 'delete',
    })
}
