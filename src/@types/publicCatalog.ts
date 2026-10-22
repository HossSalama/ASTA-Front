import type { PaginatedResult } from './api'
import type {
    CourseSectionDto,
    CourseSectionItemDto,
    PublicCourseDetailsResponse,
    RatingBreakdownDto,
    RatingStarBreakdownDto,
    CourseDeliveryType,
} from './courseContent'

// ==================== Shared & Category DTOs ====================
export interface PublicCategorySummary {
    id: number
    name: string // Localized based on Accept-Language header
}

// ==================== Course Summary DTO ====================
export interface PublicCourseSummary {
    id: number
    category: PublicCategorySummary | null
    name: string
    shortDescription: string
    price: number
    thumbnailUrl: string | null // Fully resolved CDN URL
    duration: number // Total duration in seconds
    language: string
    ratingCount: number // Total number of ratings
    averageRating: number // e.g. 4.8
    createdAt: string // ISO 8601 date string
    contentsCount: number // Total number of content items in the course
    isEnrolled: boolean // true if the authenticated user is enrolled
    updatedAt?: string | null
    instructor?: CourseInstructorDetails | null
    deliveryType?: CourseDeliveryType | string | number
    startDate?: string | null
}

// ==================== Home Page DTOs ====================
export enum AdvertisementTargetType {
    None = 1,
    Course = 2,
    ExternalUrl = 3,
}

export interface HomeAdvertisement {
    id: number
    imageUrl: string | null // Fully resolved CDN URL
    targetType: AdvertisementTargetType // 1: None, 2: Course, 3: ExternalUrl
    courseId: number | null // Present if targetType === 2
    courseName: string | null // Present if targetType === 2
    externalUrl: string | null // Present if targetType === 3
    endAt: string | null // ISO 8601 date string
}

export interface HomePageData {
    popularCourses: PaginatedResult<PublicCourseSummary>
    advertisements: HomeAdvertisement[]
}

// ==================== Course Details DTOs ====================
export interface CourseInstructorDetails {
    id?: number
    name: string
    profileImageUrl: string | null
    bio?: string
}

export interface CourseRequirement {
    id: number
    description: string
}

export interface CourseTargetJob {
    id: number
    title: string
}

export interface CourseReviewSummary {
    id: number
    userId: string
    fullName: string
    image: string | null
    rating: number // 1 - 5
    comment: string
    createdAt?: string
}

export type CourseSectionItem = CourseSectionItemDto
export type CourseSection = CourseSectionDto
export type PublicCourseDetails = PublicCourseDetailsResponse
export type RatingStarBreakdown = RatingStarBreakdownDto
export type RatingBreakdown = RatingBreakdownDto
export type { RatingStarBreakdownDto, RatingBreakdownDto }

export type {
    CourseReviewResponse,
    CreateOrUpdateReviewDto,
    CreateOrUpdateReviewPayload,
    GetCourseReviewsQueryParams,
    CourseReviewsListResponse,
    SingleCourseReviewResponse,
    EmptyApiResponse,
} from './courseReview'

// ==================== Public Instructor DTO ====================
export interface PublicInstructorSummary {
    id: number
    name: string
    profileImageUrl: string | null // Fully resolved CDN URL
    bio: string
    courseCount: number // Total active courses assigned
    isActive?: boolean
}

// ==================== Query Params ====================
export interface GetPublicCoursesQueryParams {
    pageNumber?: number
    pageSize?: number
    categoryId?: number
    searchTerm?: string
    instructorId?: number
}

export interface GetPublicInstructorsQueryParams {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
}

// Compatibility Aliases
export type CatalogCourse = PublicCourseSummary
export type CatalogCourseDetails = PublicCourseDetails
