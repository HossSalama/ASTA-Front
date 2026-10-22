import type { LiveSessionDto } from './courseContent'

// ==================== Enrolled Course Summary ====================
export enum EnrollmentFilter {
    InProgress = 'InProgress', // or 0 (progressPercentage < 100%)
    PendingPayment = 'PendingPayment', // or 1 (pending manual payment verification)
    Completed = 'Completed', // or 2 (progressPercentage == 100%)
}

export type EnrollmentFilterValue =
    | EnrollmentFilter
    | 'InProgress'
    | 'PendingPayment'
    | 'Completed'
    | 0
    | 1
    | 2

export interface EnrolledCourseSummary {
    id: number
    name: string
    deliveryType?: 'Recorded' | 'Live' | 'InPerson' | string
    shortDescription: string
    price: number
    thumbnailUrl: string | null
    duration: number // Duration in seconds
    language: string
    ratingCount: number
    averageRating: number
    createdAt: string // ISO 8601 date string
    contentsCount: number // Total number of content items in the course
    isEnrolled: boolean // Always true for enrolled courses; false for PendingPayment state
    progressPercentage: number // 0.0 to 100.0
    category: {
        id: number
        name: string
    } | null
}

// ==================== Full Course Curriculum & Progress Outline ====================
export interface CourseCategorySummary {
    id: number
    name: string
}

export type CourseContentType = 'Video' | 'Quiz' | 'File' | 'LiveSession'
export type CourseProgressDeliveryType = 'Recorded' | 'Live' | 'InPerson' | string
export type LiveSessionProgressDeliveryMode = 'Online' | 'Offline' | string

export interface LiveSessionDetails {
    scheduledStartTime: string // ISO 8601 UTC
    deliveryMode: LiveSessionProgressDeliveryMode
    meetingUrl: string | null
    location: string | null
    locationUrl: string | null
}

export interface CourseProgressItem {
    id: number
    title: string
    type: CourseContentType
    isPreview: boolean
    duration: number // In seconds (0 for non-video)
    lastPositionSeconds: number // 0 for non-video
    progressPercentage: number // 0.0 to 100.0
    isCompleted: boolean | null // null only for LiveSession
    liveSession?: LiveSessionDetails | null
}

export interface CourseProgressSection {
    id: number
    title: string
    items: CourseProgressItem[]
}

// Aliases for backward compatibility
export type CourseProgressSectionDto = CourseProgressSection
export type CourseProgressSectionItemDto = CourseProgressItem

export interface CourseProgressResponse {
    id: number
    name: string
    deliveryType: 'Recorded' | 'Live' | 'InPerson' | string
    shortDescription: string
    price: number
    thumbnailUrl: string | null
    duration: number // In seconds
    language: string
    progressPercentage: number // 0.0 to 100.0
    completedContents: number // Count of completed items
    totalContents: number // Count of total published items
    lastContentId: number | null // Content ID for "Continue Learning"
    isReviewed: boolean
    category: CourseCategorySummary | null
    sections: CourseProgressSection[]
}

// ==================== API Error Payload ====================
export interface ApiValidationErrorPayload {
    errors?: Record<string, string[]>
}

// ==================== Content Item Progress DTOs ====================
export interface UpdateContentProgressDto {
    positionSeconds: number // Must be 0 <= positionSeconds <= duration
}

export interface ContentProgressResponse {
    contentId: number
    lastPositionSeconds: number
    progressPercentage: number // 0.0 to 100.0 (100.0 if completed)
    isCompleted: boolean
    courseProgressPercentage: number | null // Non-null only when video newly completes 90%
}

// ==================== Certificate DTO ====================
export interface StudentCertificateResponse {
    certificateId: number
    certificateNumber: string
    studentName: string
    courseId: number
    courseName: string
    courseDurationSeconds: number
    completionDate: string
    verificationUrl: string
}
