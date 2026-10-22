import ApiService from './ApiService'
import type { ApiResponse, PaginatedResult } from '@/@types/api'
import type {
    CourseCategoryPublicResponse,
    CourseCategoryResponse,
    CourseCategoryDetailResponse,
    CreateCourseCategoryRequest,
    UpdateCourseCategoryRequest,
    GetPaginatedCourseCategoriesQueryParams,
} from '@/@types/courseCategory'

/**
 * 1. Get Paginated Categories for Admin Dashboard
 * GET /api/course-categories
 */
export async function apiGetAdminCourseCategories(
    params?: GetPaginatedCourseCategoriesQueryParams,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<CourseCategoryResponse>>
    >({
        url: '/course-categories',
        method: 'get',
        params,
    })
}

/**
 * 2. Get All Active Categories (Public)
 * GET /api/course-categories/public
 */
export async function apiGetPublicCourseCategories() {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseCategoryPublicResponse[]>
    >({
        url: '/course-categories/public',
        method: 'get',
    })
}

/**
 * 3. Get Category by ID (Detailed Audit View)
 * GET /api/course-categories/{id}
 */
export async function apiGetCourseCategoryById(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseCategoryDetailResponse>
    >({
        url: `/course-categories/${id}`,
        method: 'get',
    })
}

/**
 * 4. Create Course Category
 * POST /api/course-categories
 */
export async function apiCreateCourseCategory(
    data: CreateCourseCategoryRequest,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseCategoryResponse>,
        CreateCourseCategoryRequest
    >({
        url: '/course-categories',
        method: 'post',
        data,
    })
}

/**
 * 5. Update Category
 * PUT /api/course-categories/{id}
 */
export async function apiUpdateCourseCategory(
    id: number,
    data: UpdateCourseCategoryRequest,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseCategoryResponse>,
        UpdateCourseCategoryRequest
    >({
        url: `/course-categories/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 6. Toggle Category Status
 * PUT /api/course-categories/{id}/toggle-status
 */
export async function apiToggleCourseCategoryStatus(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseCategoryResponse>
    >({
        url: `/course-categories/${id}/toggle-status`,
        method: 'put',
    })
}
