/**
 * Unified API Response Envelope
 */
export interface ApiResponse<T> {
    status: boolean
    message: string
    data: T
}

/**
 * Filter options for GET /api/enrollments
 * Both enum string names ('InProgress', 'PendingPayment', 'Completed')
 * and integer values (0, 1, 2) are supported by ASP.NET Core backend.
 */
export enum EnrollmentFilter {
    InProgress = 'InProgress', // or 0
    PendingPayment = 'PendingPayment', // or 1
    Completed = 'Completed', // or 2
}

export type EnrollmentFilterValue =
    | EnrollmentFilter
    | 'InProgress'
    | 'PendingPayment'
    | 'Completed'
    | 0
    | 1
    | 2

/**
 * Localized Category Summary
 */
export interface PublicCategorySummary {
    id: number
    name: string // Localized in Arabic or English based on Accept-Language
}

/**
 * Enrolled Course DTO
 */
export interface EnrolledCourseSummary {
    id: number
    name: string
    deliveryType?: 'Recorded' | 'Live' | 'InPerson' | string
    shortDescription: string
    price: number
    thumbnailUrl: string | null
    duration: number // Duration in SECONDS
    language: string
    ratingCount: number
    averageRating: number
    createdAt: string // ISO 8601 string
    contentsCount: number
    isEnrolled: boolean // false for PendingPayment, true otherwise
    progressPercentage: number // 0.0 to 100.0
    category: PublicCategorySummary | null
}
