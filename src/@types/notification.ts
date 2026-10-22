import type { ApiResponse, PaginatedResult } from './api'

/**
 * Known backend notification category discriminators
 */
export type NotificationType =
    | 'payment_request'
    | 'course_certificate'
    | 'course_content'
    | (string & {})

export const NotificationTypes = {
    PaymentRequest: 'payment_request',
    CourseCertificate: 'course_certificate',
    CourseContent: 'course_content',
} as const

/**
 * Individual notification item returned by the backend
 */
export interface NotificationItem {
    id: number
    title: string
    body: string
    type: NotificationType
    entityId: string | null
    createdAt: string // ISO 8601 UTC timestamp
}

/**
 * Date-grouped notifications container returned by the backend
 */
export interface NotificationGroup {
    date: string // Format: "YYYY-MM-DD"
    notifications: NotificationItem[]
}

/**
 * Query parameters for fetching notifications
 */
export interface GetNotificationsParams {
    pageNumber?: number
    pageSize?: number
}

export type NotificationsApiResponse = ApiResponse<PaginatedResult<NotificationGroup>>
