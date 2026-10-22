import type {
    CourseProgressResponse,
    CourseProgressItem,
} from '@/@types/courseProgress'

/**
 * Determines the target item to open when the user clicks "Continue Learning" / "Resume"
 * according to Section 7.3 of the Course Progress Outline API specification:
 * 1. If backend provided lastContentId, locate it.
 * 2. If no lastContentId or not found, find the first uncompleted item (isCompleted === false).
 * 3. Fallback: First item of first section.
 */
export function resolveContinueLearningTarget(
    courseProgress: CourseProgressResponse,
): { targetItemId: number; sectionId: number; item: CourseProgressItem } | null {
    const allSections = courseProgress.sections || []

    // Flatten all items with section ID
    const allItems: Array<{ item: CourseProgressItem; sectionId: number }> = []
    for (const section of allSections) {
        for (const item of section.items || []) {
            allItems.push({ item, sectionId: section.id })
        }
    }

    if (allItems.length === 0) return null

    // 1. If backend provided lastContentId, locate it
    if (courseProgress.lastContentId) {
        const found = allItems.find((x) => x.item.id === courseProgress.lastContentId)
        if (found) {
            return {
                targetItemId: found.item.id,
                sectionId: found.sectionId,
                item: found.item,
            }
        }
    }

    // 2. If no lastContentId or not found, find first uncompleted item
    const firstUncompleted = allItems.find((x) => x.item.isCompleted === false)
    if (firstUncompleted) {
        return {
            targetItemId: firstUncompleted.item.id,
            sectionId: firstUncompleted.sectionId,
            item: firstUncompleted.item,
        }
    }

    // 3. Fallback: First item of first section
    return {
        targetItemId: allItems[0].item.id,
        sectionId: allItems[0].sectionId,
        item: allItems[0].item,
    }
}

export { formatCourseDuration } from './duration'

/**
 * Formats duration in seconds into a friendly string (e.g. 125s -> "02:05", 3660s -> "01:01:00")
 * per Section 7.4 of the specification.
 */
export function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '00:00'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    const pad = (n: number) => n.toString().padStart(2, '0')

    if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
    }
    return `${pad(mins)}:${pad(secs)}`
}

export type StatusBadgeColor = 'purple' | 'green' | 'amber' | 'gray'

export interface ItemStatusBadgeResult {
    label: string
    color: StatusBadgeColor
    isDone: boolean
}

/**
 * Returns icon and badge styling based on item type & completion state
 * per Section 7.4 of the specification.
 */
export function getItemStatusBadge(item: {
    type: string
    isCompleted: boolean | null
    progressPercentage: number
}): ItemStatusBadgeResult {
    if (item.type === 'LiveSession') {
        return { label: 'Live Session', color: 'purple', isDone: false }
    }

    if (item.isCompleted === true) {
        return { label: 'Completed', color: 'green', isDone: true }
    }

    if (item.progressPercentage > 0) {
        return {
            label: `${Math.round(item.progressPercentage)}%`,
            color: 'amber',
            isDone: false,
        }
    }

    return { label: 'Not Started', color: 'gray', isDone: false }
}
