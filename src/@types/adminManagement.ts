import type {
    AdminCourseSectionDto,
    AdminCourseContentItemDto,
    CourseDeliveryType,
} from './courseContent'

export type {
    AdminCourseSectionDto,
    AdminCourseContentItemDto,
    CourseDeliveryType,
}

// Enums
export enum CourseStatus {
    Draft = 1,
    Published = 2,
    Archived = 3,
}

export enum AdvertisementTargetType {
    None = 1,
    Course = 2,
    ExternalUrl = 3,
}

// Common Shared Types
export interface UserBasicInfoDto {
    id: string
    firstName: string
    lastName: string
}

export interface CategorySummaryDto {
    id: number
    nameAr: string
    nameEn: string
}

export interface InstructorSummaryDto {
    id: number
    name: string
    profileImageUrl?: string | null
}

export interface TargetJobDto {
    id: number
    title: string
}

export interface RequirementDto {
    id: number
    description: string
}

export interface InstructorCourseDto {
    id: number
    name: string
    thumbnailUrl?: string | null
}

// --- Instructors Interfaces ---
export interface InstructorResponse {
    id: number
    name: string
    profileImageUrl?: string | null
    bio: string
    isActive: boolean
    courseCount: number
    createdAt: string
    updatedAt?: string | null
}

export interface InstructorDetailResponse extends InstructorResponse {
    createdByID?: string | null
    createdBy?: UserBasicInfoDto | null
    updatedByID?: string | null
    updatedBy?: UserBasicInfoDto | null
    isDeleted: boolean
    deletedAt?: string | null
    deletedByID?: string | null
    deletedBy?: UserBasicInfoDto | null
    courses: InstructorCourseDto[]
}

export interface CreateInstructorDto {
    name: string
    bio: string
    isActive?: boolean
}

export interface UpdateInstructorDto {
    name: string
    bio: string
}

export interface GetPaginatedInstructorsQueryParams {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
    isActive?: boolean
}

// --- Courses Interfaces ---
export interface CourseSummaryResponse {
    id: number
    category?: CategorySummaryDto | null
    instructor?: InstructorSummaryDto | null
    name: string
    shortDescription: string
    price: number
    thumbnailFileId?: string | null
    thumbnailUrl?: string | null
    duration: number
    language: string
    ratingCount: number
    averageRating: number
    createdAt: string
    deliveryType?: CourseDeliveryType | number
    startDate?: string | null
}

export interface AdminCourseSummaryResponse extends CourseSummaryResponse {
    status: CourseStatus
}

export interface CourseDetailResponse extends AdminCourseSummaryResponse {
    description: string
    targetJobs: TargetJobDto[]
    requirements: RequirementDto[]
    sections?: AdminCourseSectionDto[]
    updatedAt?: string | null
    createdByID?: string | null
    createdBy?: UserBasicInfoDto | null
    updatedByID?: string | null
    updatedBy?: UserBasicInfoDto | null
    isDeleted: boolean
    deletedAt?: string | null
    deletedByID?: string | null
    deletedBy?: UserBasicInfoDto | null
}

export interface CreateCourseDto {
    categoryId: number
    instructorId: number
    name: string
    shortDescription: string
    description: string
    price: number
    language: string
    deliveryType: CourseDeliveryType | string | number
    startDate?: string | null
}

export interface UpdateCourseDto {
    categoryId: number
    instructorId: number
    name: string
    shortDescription: string
    description: string
    price: number
    language: string
    startDate?: string | null
}

export interface UpdateCourseStatusDto {
    status: CourseStatus
}

export interface AddTargetJobDto {
    title: string
}

export interface AddRequirementDto {
    description: string
}

export interface GetPaginatedCoursesQueryParams {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
    categoryId?: number
    status?: CourseStatus
    instructorId?: number
    /** Filter by delivery type: 'Recorded' or 'Live' */
    deliveryType?: 'Recorded' | 'Live'
}

// --- Course Reviews Interfaces ---
export type {
    CourseReviewResponse,
    GetCourseReviewsQueryParams,
    CreateOrUpdateReviewDto,
} from './courseReview'

// --- Advertisements Interfaces ---
export interface AdvertisementResponse {
    id: number
    imageUrl?: string | null
    objectKey?: string | null
    targetType: AdvertisementTargetType
    courseId?: number | null
    courseName?: string | null
    externalUrl?: string | null
    isActive: boolean
    startAt?: string | null
    endAt?: string | null
    createdAt: string
    updatedAt?: string | null
}

export interface CreateAdvertisementDto {
    file?: File | null
    imageUrl?: string | null
    objectKey?: string | null
    targetType: AdvertisementTargetType
    courseId?: number | null
    externalUrl?: string | null
    isActive?: boolean
    startAt?: string | null
    endAt?: string | null
}

export interface UpdateAdvertisementDto {
    targetType: AdvertisementTargetType
    courseId?: number | null
    externalUrl?: string | null
    isActive?: boolean
    startAt?: string | null
    endAt?: string | null
}

export interface GetPaginatedAdvertisementsQueryParams {
    pageNumber?: number
    pageSize?: number
    isActive?: boolean
    targetType?: AdvertisementTargetType
    searchTerm?: string
    createdAtFrom?: string
    createdAtTo?: string
    startAtFrom?: string
    startAtTo?: string
    endAtFrom?: string
    endAtTo?: string
}
