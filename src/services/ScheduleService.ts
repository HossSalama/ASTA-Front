import ApiService from './ApiService'
import type { ApiResponse } from '@/@types/api'
import type { MyScheduleItem } from '@/@types/schedule'

/**
 * Formats a JavaScript Date object or string into strictly YYYY-MM-DD (ISO Date format)
 * using local calendar components to prevent timezone-shift off-by-one errors.
 */
export function formatScheduleDateParam(date: Date | string): string {
    if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date
        }
        const parsed = new Date(date)
        if (!isNaN(parsed.getTime())) {
            const year = parsed.getFullYear()
            const month = String(parsed.getMonth() + 1).padStart(2, '0')
            const day = String(parsed.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }
        return date
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Retrieves the authenticated student's scheduled live sessions for a specific date.
 * GET /api/my-schedule?date=YYYY-MM-DD
 */
export async function apiGetMySchedule(date: string | Date) {
    const dateStr = formatScheduleDateParam(date)
    return ApiService.fetchDataWithAxios<ApiResponse<MyScheduleItem[]>>({
        url: '/my-schedule',
        method: 'get',
        params: { date: dateStr },
    })
}

/**
 * Convenience unwrapped helper matching the frontend integration guide.
 * Returns array of schedule items or throws error if unsuccessful.
 */
export async function getMySchedule(date: string | Date): Promise<MyScheduleItem[]> {
    const response = await apiGetMySchedule(date)
    if (response && response.status) {
        return response.data ?? []
    }
    throw new Error(response?.message || 'Failed to retrieve schedule')
}
