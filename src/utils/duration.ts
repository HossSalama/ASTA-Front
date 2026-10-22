/**
 * Formats duration in seconds into human-readable hours and minutes.
 * Examples:
 *   7200 seconds -> "2h 0m" or "2 ساعة"
 *   3750 seconds -> "1h 2m" or "1 س 2 د"
 *   0 seconds    -> "0 mins" or "0 دقيقة"
 */
export function formatCourseDuration(
    totalSeconds: number,
    isArabic = false,
): string {
    if (!totalSeconds || totalSeconds <= 0) {
        return isArabic ? '0 دقيقة' : '0 mins'
    }

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    if (isArabic) {
        if (hours > 0 && minutes > 0) return `${hours} س ${minutes} د`
        if (hours > 0) return `${hours} ساعة`
        return `${minutes} دقيقة`
    }

    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h`
    return `${minutes}m`
}

export default formatCourseDuration
