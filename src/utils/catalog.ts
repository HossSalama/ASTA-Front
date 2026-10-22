import type { CategorySummaryDto } from '@/@types/adminManagement'
import type { CourseCategoryPublicResponse } from '@/@types/courseCategory'
import type { PublicCategorySummary } from '@/@types/publicCatalog'

type Bilingual = { nameAr: string; nameEn: string }

/**
 * Resolve a bilingual record to the active interface language. Some endpoints
 * return a single, already-localized `name` instead of the bilingual pair.
 */
export const localizedName = (
    record?:
        | Bilingual
        | CategorySummaryDto
        | CourseCategoryPublicResponse
        | PublicCategorySummary
        | { name?: string }
        | null,
    lang?: string,
) => {
    if (!record) {
        return ''
    }
    const bilingual = record as Partial<Bilingual> & { name?: string }
    const arabic = (lang || '').toLowerCase().startsWith('ar')
    return (
        (arabic ? bilingual.nameAr : bilingual.nameEn) ||
        bilingual.nameEn ||
        bilingual.nameAr ||
        bilingual.name ||
        ''
    )
}


/** Seconds -> compact, locale-aware reading such as "1h 30m" / "45m" / "30s". */
export const formatDuration = (seconds?: number | null, lang?: string) => {
    const totalSeconds = Math.max(0, Math.round(seconds || 0))
    const arabic = (lang || '').toLowerCase().startsWith('ar')

    if (!totalSeconds) {
        return arabic ? '—' : '—'
    }

    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hours > 0 && mins > 0) {
        return arabic ? `${hours} س ${mins} د` : `${hours}h ${mins}m`
    }
    if (hours > 0) {
        return arabic ? `${hours} س` : `${hours}h`
    }
    if (mins > 0) {
        return arabic ? `${mins} د` : `${mins}m`
    }
    return arabic ? `${secs} ث` : `${secs}s`
}

/** Converts total seconds into digital video timestamp format: "01:26" or "01:25:40" */
export const formatVideoTimestamp = (totalSeconds?: number | null): string => {
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

/** Price display; free courses read as a word, not "0.00". */
export const formatPrice = (price?: number | null, lang?: string) => {
    const arabic = (lang || '').toLowerCase().startsWith('ar')
    if (!price || price <= 0) {
        return arabic ? 'مجاني' : 'Free'
    }
    return new Intl.NumberFormat(arabic ? 'ar-SA' : 'en-SA', {
        style: 'currency',
        currency: 'SAR',
        currencyDisplay: 'symbol',
        numberingSystem: 'latn',
        maximumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price)
}

export const formatCount = (value?: number | null, lang?: string) => {
    const arabic = (lang || '').toLowerCase().startsWith('ar')
    return new Intl.NumberFormat(arabic ? 'ar-EG' : 'en-US', {
        notation: (value || 0) >= 10000 ? 'compact' : 'standard',
    }).format(value || 0)
}

export const formatDate = (value?: string | null, lang?: string) => {
    if (!value) {
        return ''
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return ''
    }
    const arabic = (lang || '').toLowerCase().startsWith('ar')
    return new Intl.DateTimeFormat(arabic ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date)
}

export const courseHref = (id: number) => `/courses/${id}`
export const instructorHref = (id: number) => `/instructors/${id}`
export const categoryHref = (id: number) => `/courses?category=${id}`
