import ApiService from './ApiService'
import { directUploadFile, StorageCategory } from './StorageService'
import type { ApiResponse, PaginatedResult } from '@/@types/api'
import type {
    AdminCourseSummaryResponse,
    CourseDetailResponse,
    CreateCourseDto,
    UpdateCourseDto,
    UpdateCourseStatusDto,
    AddTargetJobDto,
    TargetJobDto,
    AddRequirementDto,
    RequirementDto,
    GetPaginatedCoursesQueryParams,
} from '@/@types/adminManagement'

/**
 * 1. Get Paginated Courses (Admin)
 * GET /api/courses
 */
export async function apiGetPaginatedCourses(
    params?: GetPaginatedCoursesQueryParams,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<AdminCourseSummaryResponse>>
    >({
        url: '/courses',
        method: 'get',
        params,
    })
}

/**
 * 2. Create Course (Draft Status)
 * POST /api/courses
 */
export async function apiCreateCourse(data: CreateCourseDto) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseDetailResponse>,
        CreateCourseDto
    >({
        url: '/courses',
        method: 'post',
        data,
    })
}

/**
 * 3. Get Course By ID (Full Admin Details)
 * GET /api/courses/{id}
 */
export async function apiGetCourseById(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseDetailResponse>
    >({
        url: `/courses/${id}`,
        method: 'get',
    })
}

/**
 * 4. Update Course Details
 * PUT /api/courses/{id}
 */
export async function apiUpdateCourse(id: number, data: UpdateCourseDto) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseDetailResponse>,
        UpdateCourseDto
    >({
        url: `/courses/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 5. Delete Course
 * DELETE /api/courses/{id}
 */
export async function apiDeleteCourse(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: `/courses/${id}`,
        method: 'delete',
    })
}

/**
 * 6. Update Course Status (1 = Draft, 2 = Published, 3 = Archived)
 * PUT /api/courses/{id}/status
 */
export async function apiUpdateCourseStatus(
    id: number,
    data: UpdateCourseStatusDto,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseDetailResponse>,
        UpdateCourseStatusDto
    >({
        url: `/courses/${id}/status`,
        method: 'put',
        data,
    })
}

/**
 * 7. Upload Course Thumbnail (Direct Presigned R2 Upload)
 */
export async function apiUploadCourseThumbnail(
    id: number,
    file: File,
    onProgress?: (percent: number) => void,
) {
    const uploadResult = await directUploadFile({
        file,
        category: StorageCategory.CourseThumbnail,
        targetType: 'Course',
        targetId: id.toString(),
        onProgress,
    })

    return {
        status: true,
        message: 'Success',
        data: {
            thumbnailUrl: uploadResult.accessUrl,
            objectKey: uploadResult.objectKey,
        },
    }
}

/**
 * 8. Delete Course Thumbnail
 * DELETE /api/courses/{id}/thumbnail
 */
export async function apiDeleteCourseThumbnail(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<CourseDetailResponse>
    >({
        url: `/courses/${id}/thumbnail`,
        method: 'delete',
    })
}

/**
 * 9. Add Target Job to Course
 * POST /api/courses/{id}/target-jobs
 */
export async function apiAddTargetJob(id: number, data: AddTargetJobDto) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<TargetJobDto>,
        AddTargetJobDto
    >({
        url: `/courses/${id}/target-jobs`,
        method: 'post',
        data,
    })
}

/**
 * 10. Remove Target Job from Course
 * DELETE /api/courses/{id}/target-jobs/{jobId}
 */
export async function apiRemoveTargetJob(id: number, jobId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: `/courses/${id}/target-jobs/${jobId}`,
        method: 'delete',
    })
}

/**
 * 11. Add Requirement to Course
 * POST /api/courses/{id}/requirements
 */
export async function apiAddRequirement(id: number, data: AddRequirementDto) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<RequirementDto>,
        AddRequirementDto
    >({
        url: `/courses/${id}/requirements`,
        method: 'post',
        data,
    })
}

/**
 * 12. Remove Requirement from Course
 * DELETE /api/courses/{id}/requirements/{reqId}
 */
export async function apiRemoveRequirement(id: number, reqId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: `/courses/${id}/requirements/${reqId}`,
        method: 'delete',
    })
}
