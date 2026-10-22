import {
    CourseDeliveryType,
    LiveSessionDeliveryMode,
    ContentType,
} from '@/@types/courseContent'

/**
 * Checks if a course is a Live course.
 * Handles:
 * - Number: 2 (CourseDeliveryType.Live)
 * - String: 'Live', 'live', 'LIVE', '2'
 * - Fallback: checks if course sections contain any LiveSession items
 */
export const isLiveCourse = (
    deliveryType?: unknown,
    sections?: Array<{ items?: Array<{ type?: unknown }> }> | null,
): boolean => {
    if (
        deliveryType !== null &&
        deliveryType !== undefined &&
        deliveryType !== ''
    ) {
        if (typeof deliveryType === 'number') {
            if (deliveryType === CourseDeliveryType.Live || deliveryType === 2) {
                return true
            }
            if (
                deliveryType === CourseDeliveryType.Recorded ||
                deliveryType === 1
            ) {
                return false
            }
        }
        const str = String(deliveryType).trim().toLowerCase()
        if (str === 'live' || str === '2') return true
        if (str === 'recorded' || str === '1') return false
    }

    // Fallback: If deliveryType is missing/unspecified, inspect sections for live sessions
    if (sections && Array.isArray(sections)) {
        for (const section of sections) {
            if (section.items && Array.isArray(section.items)) {
                for (const item of section.items) {
                    if (isLiveSessionItem(item.type)) {
                        return true
                    }
                }
            }
        }
    }

    return false
}

export const isLiveCourseType = isLiveCourse

/**
 * Checks if a course is Recorded.
 */
export const isRecordedCourse = (
    deliveryType?: unknown,
    sections?: Array<{ items?: Array<{ type?: unknown }> }> | null,
): boolean => {
    return !isLiveCourse(deliveryType, sections)
}

/**
 * Checks if a content item is a LiveSession.
 * Handles:
 * - Number: 4 (ContentType.LiveSession)
 * - String: 'LiveSession', 'livesession', 'liveSession', '4'
 */
export const isLiveSessionItem = (type?: unknown): boolean => {
    if (type === null || type === undefined) return false
    if (typeof type === 'number') {
        return type === ContentType.LiveSession || type === 4
    }
    const str = String(type).trim().toLowerCase()
    return str === 'livesession' || str === '4'
}

/**
 * Checks if a live session delivery mode is Online.
 * Default is true if unspecified.
 * Handles: 1, '1', 'Online', 'online', 'ONLINE'
 */
export const isOnlineDeliveryMode = (mode?: unknown): boolean => {
    if (mode === null || mode === undefined || mode === '') return true
    if (typeof mode === 'number') {
        return mode === LiveSessionDeliveryMode.Online || mode === 1
    }
    const str = String(mode).trim().toLowerCase()
    return str === 'online' || str === '1'
}

/**
 * Checks if a live session delivery mode is In-Person (was previously called 'Offline').
 * Handles: 2, '2', 'InPerson', 'inperson', 'in-person', 'Offline', 'offline' (legacy)
 */
export const isOfflineDeliveryMode = (mode?: unknown): boolean => {
    if (mode === null || mode === undefined || mode === '') return false
    if (typeof mode === 'number') {
        return mode === LiveSessionDeliveryMode.InPerson || mode === 2
    }
    const str = String(mode).trim().toLowerCase()
    return (
        str === 'inperson' ||
        str === 'offline' || // legacy support
        str === '2' ||
        str === 'in-person'
    )
}

/**
 * Extracts the start date of a course, falling back to the earliest scheduled live session if top-level startDate is not present.
 */
export const getCourseStartDate = (
    course?: {
        startDate?: string | null
        sections?: Array<{
            items?: Array<{
                liveSession?: { scheduledStartTime?: string | null } | null
            }>
        }> | null
    } | null,
): string | null => {
    if (!course) return null
    if (course.startDate) return course.startDate

    if (course.sections && Array.isArray(course.sections)) {
        for (const section of course.sections) {
            if (section.items && Array.isArray(section.items)) {
                for (const item of section.items) {
                    if (item.liveSession?.scheduledStartTime) {
                        return item.liveSession.scheduledStartTime
                    }
                }
            }
        }
    }

    return null
}
