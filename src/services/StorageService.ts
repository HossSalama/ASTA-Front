import axios from 'axios'
import ApiService from './ApiService'
import type { ApiResponse } from '@/@types/api'

// Discrete functional storage categories defined by backend
export enum StorageCategory {
    UserProfileImage = 1,
    InstructorProfileImage = 2,
    CourseThumbnail = 3,
    AdvertisementImage = 4,
    NationalIdDocument = 5,
    VerificationCertificate = 6,
    CourseResource = 7,
    CourseVideo = 8,
}

// Request & Response DTOs
export interface RequestUploadUrlDto {
    category: StorageCategory | number | string
    targetType?: string
    targetId?: string | null
    fileName: string
    contentType: string
    fileSizeBytes: number
}

export interface UploadUrlResponseData {
    sessionId: string
    uploadUrl: string
    verificationToken: string
    expiresAtUtc: string
    temporaryObjectKey: string
}

export interface FinalizeUploadDto {
    sessionId: string
    verificationToken: string
}

export interface FinalizeUploadResponseData {
    objectKey: string
    accessUrl: string
}

export interface GetAccessUrlDto {
    objectKey: string
}

export interface AccessUrlResponseData {
    objectKey: string
    accessUrl: string
    expiresAtUtc: string
}

// Multipart DTOs
export interface InitiateMultipartDto {
    category: StorageCategory | number | string
    targetType?: string
    targetId?: string | null
    fileName: string
    contentType: string
    fileSizeBytes?: number
    totalSizeBytes?: number
    partCount?: number
}

export interface MultipartInitiateResponseData {
    sessionId: string
    multipartUploadId: string
    verificationToken: string
    temporaryObjectKey: string
}

export interface GetPartUrlDto {
    sessionId: string
    multipartUploadId: string
    partNumber: number
    verificationToken: string
}

export interface PartUrlResponseData {
    partNumber: number
    partUploadUrl: string
}

export interface MultipartPartInfo {
    partNumber: number
    eTag: string
}

export interface CompleteMultipartDto {
    sessionId: string
    multipartUploadId: string
    verificationToken: string
    parts: MultipartPartInfo[]
}

export interface MultipartCompleteResponseData {
    objectKey: string
    accessUrl: string
}

// Clean Axios instance without authentication interceptor for presigned PUT uploads to Cloudflare R2
const r2DirectAxios = axios.create({
    timeout: 300000, // 5 minutes for direct file uploads
})

/**
 * 1. Request presigned upload URL from backend
 * POST /api/v1/storage/upload-url
 */
export async function apiGetUploadUrl(dto: RequestUploadUrlDto) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<UploadUrlResponseData>,
        RequestUploadUrlDto
    >({
        url: '/v1/storage/upload-url',
        method: 'post',
        data: dto,
    })
}

/**
 * 2. Upload file directly to Cloudflare R2 via presigned PUT URL
 * MUST NOT include backend Authorization header.
 */
export async function apiUploadToPresignedUrl(
    uploadUrl: string,
    file: File | Blob,
    contentType: string,
    onProgress?: (progressPercent: number) => void,
) {
    return r2DirectAxios.put(uploadUrl, file, {
        headers: {
            'Content-Type': contentType,
        },
        onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total,
                )
                onProgress(percentCompleted)
            }
        },
    })
}

/**
 * 3. Finalize upload session with backend
 * POST /api/v1/storage/finalize
 */
export async function apiFinalizeUpload(dto: FinalizeUploadDto) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<FinalizeUploadResponseData>,
        FinalizeUploadDto
    >({
        url: '/v1/storage/finalize',
        method: 'post',
        data: dto,
    })
}

/**
 * 4. Request temporary GET access URL for private documents
 * POST /api/v1/storage/access-url
 */
export async function apiGetAccessUrl(objectKey: string) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<AccessUrlResponseData>,
        GetAccessUrlDto
    >({
        url: '/v1/storage/access-url',
        method: 'post',
        data: { objectKey },
    })
}

/**
 * 5. Multipart Upload: Initiate Session
 * POST /api/v1/storage/multipart/initiate
 */
export async function apiInitiateMultipart(dto: InitiateMultipartDto) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<MultipartInitiateResponseData>,
        InitiateMultipartDto
    >({
        url: '/v1/storage/multipart/initiate',
        method: 'post',
        data: dto,
    })
}

/**
 * 6. Multipart Upload: Get Part Upload URL
 * POST /api/v1/storage/multipart/part-url
 */
export async function apiGetMultipartPartUrl(dto: GetPartUrlDto) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PartUrlResponseData>,
        GetPartUrlDto
    >({
        url: '/v1/storage/multipart/part-url',
        method: 'post',
        data: dto,
    })
}

/**
 * 7. Multipart Upload: Complete Session
 * POST /api/v1/storage/multipart/complete
 */
export async function apiCompleteMultipart(dto: CompleteMultipartDto) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<MultipartCompleteResponseData>,
        CompleteMultipartDto
    >({
        url: '/v1/storage/multipart/complete',
        method: 'post',
        data: dto,
    })
}

/**
 * Resolve Content-Type consistently based on file metadata and storage category
 */
export function resolveContentType(
    file: File,
    category?: StorageCategory | number | string,
): string {
    if (file.type && file.type.trim() !== '') {
        return file.type
    }
    if (
        category === StorageCategory.CourseVideo ||
        category === 8 ||
        category === 'CourseVideo' ||
        category === '8'
    ) {
        return 'video/mp4'
    }
    if (
        category === StorageCategory.CourseResource ||
        category === 7 ||
        category === 'CourseResource' ||
        category === '7'
    ) {
        const nameLower = file.name.toLowerCase()
        if (nameLower.endsWith('.pdf')) return 'application/pdf'
        if (nameLower.endsWith('.zip')) return 'application/zip'
        if (nameLower.endsWith('.rar')) return 'application/x-rar-compressed'
        if (nameLower.endsWith('.doc')) return 'application/msword'
        if (nameLower.endsWith('.docx'))
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        if (nameLower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint'
        if (nameLower.endsWith('.pptx'))
            return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        if (nameLower.endsWith('.xls')) return 'application/vnd.ms-excel'
        if (nameLower.endsWith('.xlsx'))
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        if (nameLower.endsWith('.txt')) return 'text/plain'
        return 'application/octet-stream'
    }
    if (
        category === StorageCategory.CourseThumbnail ||
        category === StorageCategory.UserProfileImage ||
        category === StorageCategory.InstructorProfileImage ||
        category === StorageCategory.AdvertisementImage
    ) {
        const nameLower = file.name.toLowerCase()
        if (nameLower.endsWith('.png')) return 'image/png'
        if (nameLower.endsWith('.webp')) return 'image/webp'
        if (nameLower.endsWith('.svg')) return 'image/svg+xml'
        return 'image/jpeg'
    }
    return 'application/octet-stream'
}

/**
 * High-Level Direct Upload Helper
 * Handles standard 3-step direct R2 upload flow:
 * 1. Obtains presigned upload URL & verification token
 * 2. Directly uploads file binary to Cloudflare R2
 * 3. Finalizes upload session with backend
 */
export interface DirectUploadParams {
    file: File
    category: StorageCategory | number | string
    targetType?: string
    targetId?: string | null
    onProgress?: (progressPercent: number) => void
}

export interface DirectUploadResult {
    objectKey: string
    accessUrl: string
    sessionId: string
}

export async function directUploadFile({
    file,
    category,
    targetType = 'CourseContent',
    targetId = null,
    onProgress,
}: DirectUploadParams): Promise<DirectUploadResult> {
    const contentType = resolveContentType(file, category)

    // Step 1: Request presigned upload URL
    const prepareRes = await apiGetUploadUrl({
        category,
        targetType,
        targetId: targetId ?? null,
        fileName: file.name,
        contentType,
        fileSizeBytes: file.size,
    })

    if (!prepareRes.status || !prepareRes.data) {
        throw new Error(prepareRes.message || 'Failed to prepare upload session')
    }

    const { sessionId, uploadUrl, verificationToken } = prepareRes.data

    // Step 2: Upload directly to R2 presigned PUT URL (No backend auth headers)
    await apiUploadToPresignedUrl(uploadUrl, file, contentType, onProgress)

    // Step 3: Finalize upload session with backend
    const finalizeRes = await apiFinalizeUpload({
        sessionId,
        verificationToken,
    })

    if (!finalizeRes.status || !finalizeRes.data) {
        throw new Error(finalizeRes.message || 'Failed to finalize upload session')
    }

    return {
        objectKey: finalizeRes.data.objectKey,
        accessUrl: finalizeRes.data.accessUrl,
        sessionId,
    }
}

export interface MultipartUploadParams {
    file: File
    category?: StorageCategory | number | string
    targetType?: string
    targetId?: string | null
    chunkSizeMB?: number
    onProgress?: (progressPercent: number) => void
}

/**
 * Strategy B: Multipart Direct Upload (>= 100MB up to 5GB)
 */
export async function uploadLargeVideoMultipart({
    file,
    category = StorageCategory.CourseVideo,
    targetType = 'CourseContent',
    targetId = null,
    chunkSizeMB = 20,
    onProgress,
}: MultipartUploadParams): Promise<DirectUploadResult> {
    const contentType = resolveContentType(file, category)
    const chunkSize = chunkSizeMB * 1024 * 1024
    const partCount = Math.ceil(file.size / chunkSize)

    // 1. Initiate Multipart Session
    const initRes = await apiInitiateMultipart({
        category,
        targetType,
        targetId: targetId ?? null,
        fileName: file.name,
        contentType,
        totalSizeBytes: file.size,
        partCount,
    })

    if (!initRes.status || !initRes.data) {
        throw new Error(initRes.message || 'Failed to initiate multipart upload')
    }

    const { sessionId, multipartUploadId, verificationToken } = initRes.data
    const completedParts: MultipartPartInfo[] = []

    // 2. Upload parts sequentially
    for (let partNumber = 1; partNumber <= partCount; partNumber++) {
        const start = (partNumber - 1) * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        const chunkBlob = file.slice(start, end)

        // Get Presigned URL for part
        const partRes = await apiGetMultipartPartUrl({
            sessionId,
            multipartUploadId,
            partNumber,
            verificationToken,
        })

        if (!partRes.status || !partRes.data) {
            throw new Error(partRes.message || `Failed to get part URL for part ${partNumber}`)
        }

        const partUploadUrl = partRes.data.partUploadUrl

        // Upload chunk to R2
        const r2Response = await apiUploadToPresignedUrl(
            partUploadUrl,
            chunkBlob,
            contentType,
        )

        const eTag =
            r2Response.headers['etag'] ||
            r2Response.headers['ETag'] ||
            (typeof (r2Response.headers as any).get === 'function'
                ? (r2Response.headers as any).get('etag') || (r2Response.headers as any).get('ETag')
                : '')

        if (!eTag) {
            throw new Error(`Missing ETag for part ${partNumber}`)
        }

        completedParts.push({ partNumber, eTag: String(eTag) })

        if (onProgress) {
            onProgress(Math.round((partNumber / partCount) * 100))
        }
    }

    // 3. Complete Multipart Upload
    const completeRes = await apiCompleteMultipart({
        sessionId,
        multipartUploadId,
        verificationToken,
        parts: completedParts,
    })

    if (!completeRes.status || !completeRes.data) {
        throw new Error(completeRes.message || 'Failed to complete multipart upload')
    }

    return {
        objectKey: completeRes.data.objectKey,
        accessUrl: completeRes.data.accessUrl,
        sessionId,
    }
}

/**
 * Universal Course Media Upload Helper
 * Automatically uses Single Direct Upload (< 100MB) or Multipart Direct Upload (>= 100MB)
 */
export async function uploadCourseMediaFile({
    file,
    category,
    targetType = 'CourseContent',
    targetId = null,
    onProgress,
}: DirectUploadParams): Promise<DirectUploadResult> {
    const MULTIPART_THRESHOLD_BYTES = 100 * 1024 * 1024 // 100 MB

    if (file.size >= MULTIPART_THRESHOLD_BYTES) {
        return uploadLargeVideoMultipart({
            file,
            category,
            targetType,
            targetId,
            chunkSizeMB: 20,
            onProgress,
        })
    }

    return directUploadFile({
        file,
        category,
        targetType,
        targetId,
        onProgress,
    })
}
