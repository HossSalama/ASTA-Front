/**
 * Helper utilities for formatting durations and timestamps in the application.
 */

/**
 * Converts total seconds to a human-readable duration format.
 * Examples:
 * - ar: "2 ساعة و 15 دقيقة", "45 دقيقة", "30 ثانية", "0 دقيقة"
 * - en: "2h 15m", "45m", "30s", "0 mins"
 *
 * @param totalSeconds - Total duration in seconds
 * @param lang - Target language ('ar' | 'en')
 */
export function formatCourseDuration(
    totalSeconds?: number | null,
    lang: 'ar' | 'en' = 'ar',
): string {
    if (!totalSeconds || totalSeconds <= 0) {
        return lang === 'ar' ? '0 دقيقة' : '0 mins'
    }

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (lang === 'ar') {
        if (hours > 0 && minutes > 0) return `${hours} ساعة و ${minutes} دقيقة`
        if (hours > 0) return `${hours} ساعة`
        if (minutes > 0) return `${minutes} دقيقة`
        return `${seconds} ثانية`
    } else {
        if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
        if (hours > 0) return `${hours}h`
        if (minutes > 0) return `${minutes}m`
        return `${seconds}s`
    }
}

/**
 * Converts video seconds into standard video player timestamp format.
 * Examples: "05:30" or "01:25:40"
 *
 * @param totalSeconds - Video duration in seconds
 */
export function formatVideoTimestamp(totalSeconds?: number | null): string {
    if (!totalSeconds || totalSeconds <= 0) return '00:00'

    const total = Math.floor(totalSeconds)
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const seconds = total % 60

    const pad = (num: number) => num.toString().padStart(2, '0')

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    }
    return `${pad(minutes)}:${pad(seconds)}`
}

export default formatCourseDuration
