import ApiService from './ApiService'
import type { ApiResponse, PaginatedResult } from '@/@types/api'
import type {
    InstructorResponse,
    InstructorDetailResponse,
    CreateInstructorDto,
    UpdateInstructorDto,
    GetPaginatedInstructorsQueryParams,
} from '@/@types/adminManagement'

/**
 * 1. Get Paginated Instructors
 * GET /api/instructors
 */
export async function apiGetPaginatedInstructors(
    params?: GetPaginatedInstructorsQueryParams,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<InstructorResponse>>
    >({
        url: '/instructors',
        method: 'get',
        params,
    })
}

/**
 * 2. Create Instructor
 * POST /api/instructors
 */
export async function apiCreateInstructor(data: CreateInstructorDto) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<InstructorResponse>,
        CreateInstructorDto
    >({
        url: '/instructors',
        method: 'post',
        data,
    })
}

/**
 * 3. Get Instructor By ID
 * GET /api/instructors/{id}
 */
export async function apiGetInstructorById(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<InstructorDetailResponse>
    >({
        url: `/instructors/${id}`,
        method: 'get',
    })
}

/**
 * 4. Update Instructor
 * PUT /api/instructors/{id}
 */
export async function apiUpdateInstructor(
    id: number,
    data: UpdateInstructorDto,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<InstructorResponse>,
        UpdateInstructorDto
    >({
        url: `/instructors/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 5. Delete Instructor
 * DELETE /api/instructors/{id}
 */
export async function apiDeleteInstructor(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: `/instructors/${id}`,
        method: 'delete',
    })
}

/**
 * 6. Upload Instructor Profile Image
 * POST /api/instructors/{id}/profile-image
 */
export async function apiUploadInstructorProfileImage(id: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return ApiService.fetchDataWithAxios<
        ApiResponse<InstructorDetailResponse>,
        FormData
    >({
        url: `/instructors/${id}/profile-image`,
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 7. Delete Instructor Profile Image
 * DELETE /api/instructors/{id}/profile-image
 */
export async function apiDeleteInstructorProfileImage(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<InstructorDetailResponse>
    >({
        url: `/instructors/${id}/profile-image`,
        method: 'delete',
    })
}

/**
 * 8. Toggle Instructor Status
 * PUT /api/instructors/{id}/toggle-status
 */
export async function apiToggleInstructorStatus(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<InstructorResponse>
    >({
        url: `/instructors/${id}/toggle-status`,
        method: 'put',
    })
}
