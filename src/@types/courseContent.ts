// ==========================================
// 1. Enums
// ==========================================
export enum ContentType {
    Video = 1,
    File = 2,
    Quiz = 3,
    LiveSession = 4,
}

export const CourseDeliveryType = {
    Recorded: 1,
    Live: 2,
} as const
export type CourseDeliveryType = 'Recorded' | 'Live' | 'recorded' | 'live' | 1 | 2

export const LiveSessionDeliveryMode = {
    Online: 1,
    InPerson: 2,
    Hybrid: 3,
} as const
export type LiveSessionDeliveryMode =
    | 'Online'
    | 'InPerson'
    | 'Hybrid'
    | 'online'
    | 'inperson'
    | 'hybrid'
    | 1
    | 2
    | 3

export {
    isLiveCourse,
    isLiveCourseType,
    isRecordedCourse,
    isLiveSessionItem,
    isOnlineDeliveryMode,
    isOfflineDeliveryMode,
    getCourseStartDate,
} from '@/utils/courseTypeHelpers'

export interface LiveSessionDto {
    scheduledStartTime: string // ISO 8601 UTC
    deliveryMode: LiveSessionDeliveryMode | string
    meetingUrl: string | null
    location: string | null
    locationUrl: string | null
}

export interface LiveSessionResponseDto extends LiveSessionDto {
    id: number
    contentId: number
}

export interface CreateLiveSessionDto {
    contentId: number
    scheduledStartTime: string // ISO 8601 UTC in the future
    deliveryMode: LiveSessionDeliveryMode
    meetingUrl?: string | null
    location?: string | null
    locationUrl?: string | null
}

export interface UpdateLiveSessionDto {
    scheduledStartTime?: string | null
    deliveryMode: LiveSessionDeliveryMode
    meetingUrl?: string | null
    location?: string | null
    locationUrl?: string | null
}

export enum ContentItemStatus {
    Draft = 1,
    Published = 2,
    Archived = 3,
}

export enum CourseStatus {
    Draft = 1,
    Published = 2,
    Archived = 3,
}

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

// ==========================================
// 2. Public Course & Curriculum DTOs
// ==========================================
export interface PublicCategorySummaryDto {
    id: number
    name: string
}

export interface CourseDetailsInstructorDto {
    id?: number
    name: string
    profileImageUrl: string | null
    bio?: string
}

export interface RequirementDto {
    id: number
    description: string
}

export interface TargetJobDto {
    id: number
    title: string
}

export interface CourseDetailsReviewDto {
    id: number
    userId: string
    fullName: string
    image: string | null
    rating: number
    comment: string
    createdAt?: string
}

export interface CourseSectionItemDto {
    id: number
    title: string
    type: 'Video' | 'File' | 'Quiz' | 'LiveSession' | 'Document' | ContentType | string | number
    isPreview: boolean
    duration?: number | null
    liveSession?: LiveSessionDto | null
}

export interface CourseSectionDto {
    id: number
    title: string
    items: CourseSectionItemDto[]
}

export interface RatingStarBreakdownDto {
    star: number
    count: number
    percentage: number
}

export interface RatingBreakdownDto {
    fiveStars: RatingStarBreakdownDto
    fourStars: RatingStarBreakdownDto
    threeStars: RatingStarBreakdownDto
    twoStars: RatingStarBreakdownDto
    oneStar: RatingStarBreakdownDto
}

export interface PublicCourseDetailsResponse {
    id: number
    name: string
    deliveryType?: CourseDeliveryType | string | number
    startDate?: string | null
    shortDescription: string
    description?: string | null
    price: number
    thumbnailUrl: string | null
    duration: number // in seconds
    language: string
    ratingCount: number
    averageRating: number
    ratingBreakdown?: RatingBreakdownDto
    createdAt: string
    updatedAt?: string | null
    category: PublicCategorySummaryDto | null
    instructorId: number
    instructor: CourseDetailsInstructorDto | null
    requirements: RequirementDto[]
    targetJobs: TargetJobDto[]
    reviews: CourseDetailsReviewDto[]
    isEnrolled: boolean
    hasActivePaymentRequest: boolean
    sections: CourseSectionDto[]
}

// ==========================================
// 3. Content Access & Delivery DTOs
// ==========================================
export interface ContentDeliveryDto {
    type: string // "SignedUrl"
    url: string
    expiresAt: string // ISO 8601
}

export interface ContentAccessResponse {
    contentId: number
    accessGranted: boolean
    delivery: ContentDeliveryDto | null
    lastPositionSeconds?: number
    isCompleted?: boolean
    courseProgressPercentage?: number
}

// Compatibility Aliases for Content Access
export type ContentAccessDelivery = ContentDeliveryDto
export type ContentAccessResponseData = ContentAccessResponse

// ==========================================
// 4. Admin Course & Curriculum DTOs
// ==========================================
export interface AdminCourseContentItemDto {
    id: number
    sectionId: number
    title: string
    type: ContentType | string | number
    fileId: string | null
    duration?: number | null
    isPreview: boolean
    status: ContentItemStatus
    quizId?: number | null
    orderIndex?: number
    liveSession?: LiveSessionDto | null
    createdAt?: string
    updatedAt?: string | null
}

export type CourseContentItemResponse = AdminCourseContentItemDto

export interface AdminCourseSectionDto {
    id: number
    courseId: number
    title: string
    createdAt?: string
    updatedAt?: string | null
    items: AdminCourseContentItemDto[]
}

export interface SectionResponse {
    id: number
    courseId: number
    title: string
    orderIndex?: number
    items?: AdminCourseContentItemDto[]
    contents?: AdminCourseContentItemDto[]
    courseContents?: AdminCourseContentItemDto[]
    createdAt?: string
    updatedAt?: string | null
}

// ==========================================
// 5. Section & Content Item Mutation Requests
// ==========================================
export interface CreateSectionDto {
    courseId: number
    title: string
}

export interface UpdateSectionDto {
    title: string
}

export interface CreateContentItemDto {
    sectionId: number
    title: string
    type: ContentType // 1 = Video, 2 = File, 3 = Quiz
    fileId: string | null
    duration?: number | null // Required for Video, null for File/Quiz
    isPreview: boolean
    status: ContentItemStatus // 1 = Draft, 2 = Published, 3 = Archived
}

export type CreateCourseContentDto = CreateContentItemDto

export interface UpdateContentItemDto {
    title: string
    fileId?: string | null
    duration?: number | null
    isPreview: boolean
    status: ContentItemStatus
}

export type UpdateCourseContentDto = UpdateContentItemDto
