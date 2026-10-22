import ApiService from './ApiService'
import type { ApiResponse } from '@/@types/api'
import type {
    CreateSectionDto,
    UpdateSectionDto,
    CreateContentItemDto,
    UpdateContentItemDto,
    ContentAccessResponse,
} from '@/@types/courseContent'

/**
 * ----------------------------------------------------
 * Sections API (/api/sections)
 * ----------------------------------------------------
 */

/**
 * 1. Create Section
 * POST /api/sections
 */
export async function apiCreateSection(data: CreateSectionDto) {
    return ApiService.fetchDataWithAxios<ApiResponse<number>, CreateSectionDto>({
        url: '/sections',
        method: 'post',
        data,
    })
}

/**
 * 2. Update Section
 * PUT /api/sections/{id}
 */
export async function apiUpdateSection(id: number, data: UpdateSectionDto) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>, UpdateSectionDto>({
        url: `/sections/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 3. Delete Section
 * DELETE /api/sections/{id}
 * Cascades deletion to child content items and deducts published video durations from the parent course.
 */
export async function apiDeleteSection(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>>({
        url: `/sections/${id}`,
        method: 'delete',
    })
}

/**
 * ----------------------------------------------------
 * Course Content API (/api/course-content)
 * ----------------------------------------------------
 */

/**
 * 1. Access Course Content (Play Video / Download File)
 * GET /api/course-content/{contentId}/access
 */
export async function apiGetCourseContentAccess(contentId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<ContentAccessResponse>>({
        url: `/course-content/${contentId}/access`,
        method: 'get',
    })
}

/**
 * 2. Create Content Item
 * POST /api/course-content
 */
export async function apiCreateCourseContent(data: CreateContentItemDto) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<number>,
        CreateContentItemDto
    >({
        url: '/course-content',
        method: 'post',
        data,
    })
}

/**
 * 3. Update Content Item
 * PUT /api/course-content/{id}
 */
export async function apiUpdateCourseContent(
    id: number,
    data: UpdateContentItemDto,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<null>,
        UpdateContentItemDto
    >({
        url: `/course-content/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 4. Toggle Preview Status
 * PUT /api/course-content/{id}/toggle-preview
 */
export async function apiToggleContentPreview(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<boolean>>({
        url: `/course-content/${id}/toggle-preview`,
        method: 'put',
    })
}

/**
 * 5. Delete Content Item
 * DELETE /api/course-content/{id}
 */
export async function apiDeleteCourseContent(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>>({
        url: `/course-content/${id}`,
        method: 'delete',
    })
}
