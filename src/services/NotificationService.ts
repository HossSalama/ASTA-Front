import ApiService from './ApiService'
import type { ApiResponse, PaginatedResult } from '@/@types/api'
import type {
    NotificationGroup,
    GetNotificationsParams,
} from '@/@types/notification'

/**
 * ====================================================
 * Notifications API (/api/notifications)
 * ====================================================
 */

/**
 * Fetches paginated, date-grouped notifications for the current authenticated user.
 * GET /api/notifications?pageNumber=1&pageSize=10
 */
export async function apiGetNotifications(params: GetNotificationsParams = {}) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<NotificationGroup>>
    >({
        url: '/notifications',
        method: 'get',
        params: {
            pageNumber: params.pageNumber ?? 1,
            pageSize: params.pageSize ?? 10,
        },
    })
}

/**
 * High-level service wrapper matching the documentation blueprint
 */
export class NotificationsApiService {
    /**
     * Fetches paginated, date-grouped notifications and returns unwrapped PaginatedResult.
     */
    static async getNotifications(
        params: GetNotificationsParams = {},
    ): Promise<PaginatedResult<NotificationGroup>> {
        const response = await apiGetNotifications(params)
        if (!response.status || !response.data) {
            throw new Error(
                response.message || 'Failed to retrieve notifications',
            )
        }
        return response.data
    }
}

export default NotificationsApiService
