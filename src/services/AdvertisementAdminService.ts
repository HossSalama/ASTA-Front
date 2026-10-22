import ApiService from './ApiService'
import { directUploadFile, StorageCategory } from './StorageService'
import type { ApiResponse, PaginatedResult } from '@/@types/api'
import type {
    AdvertisementResponse,
    CreateAdvertisementDto,
    UpdateAdvertisementDto,
    GetPaginatedAdvertisementsQueryParams,
} from '@/@types/adminManagement'

/**
 * 1. Get Paginated Advertisements
 * GET /api/advertisements
 */
export async function apiGetPaginatedAdvertisements(
    params?: GetPaginatedAdvertisementsQueryParams,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<AdvertisementResponse>>
    >({
        url: '/advertisements',
        method: 'get',
        params,
    })
}

/**
 * 2. Create Advertisement
 * Uploads file directly to R2 if provided, then posts advertisement data.
 * POST /api/advertisements
 */
export async function apiCreateAdvertisement(dto: CreateAdvertisementDto) {
    let imageUrl = dto.imageUrl
    let objectKey = dto.objectKey

    if (dto.file) {
        const uploadResult = await directUploadFile({
            file: dto.file,
            category: StorageCategory.AdvertisementImage,
            targetType: 'Advertisement',
        })
        imageUrl = uploadResult.accessUrl
        objectKey = uploadResult.objectKey
    }

    const payload = {
        targetType: dto.targetType,
        courseId: dto.courseId,
        externalUrl: dto.externalUrl,
        isActive: dto.isActive,
        startAt: dto.startAt,
        endAt: dto.endAt,
        imageUrl,
        objectKey,
    }

    return ApiService.fetchDataWithAxios<
        ApiResponse<AdvertisementResponse>,
        typeof payload
    >({
        url: '/advertisements',
        method: 'post',
        data: payload,
    })
}

/**
 * 3. Get Advertisement By ID
 * GET /api/advertisements/{id}
 */
export async function apiGetAdvertisementById(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<AdvertisementResponse>
    >({
        url: `/advertisements/${id}`,
        method: 'get',
    })
}

/**
 * 4. Update Advertisement Metadata
 * PUT /api/advertisements/{id}
 */
export async function apiUpdateAdvertisement(
    id: number,
    data: UpdateAdvertisementDto,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<AdvertisementResponse>,
        UpdateAdvertisementDto
    >({
        url: `/advertisements/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 5. Delete Advertisement
 * DELETE /api/advertisements/{id}
 */
export async function apiDeleteAdvertisement(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: `/advertisements/${id}`,
        method: 'delete',
    })
}

/**
 * 6. Toggle Advertisement Status
 * PUT /api/advertisements/{id}/toggle-status
 */
export async function apiToggleAdvertisementStatus(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<AdvertisementResponse>
    >({
        url: `/advertisements/${id}/toggle-status`,
        method: 'put',
    })
}

/**
 * 7. Upload / Replace Advertisement Image (Direct Presigned R2 Upload)
 */
export async function apiUploadAdvertisementImage(
    id: number,
    file: File,
    onProgress?: (percent: number) => void,
) {
    const uploadResult = await directUploadFile({
        file,
        category: StorageCategory.AdvertisementImage,
        targetType: 'Advertisement',
        targetId: id.toString(),
        onProgress,
    })

    return {
        status: true,
        message: 'Success',
        data: {
            id,
            imageUrl: uploadResult.accessUrl,
            objectKey: uploadResult.objectKey,
        } as unknown as AdvertisementResponse,
    }
}
