import useSWR from 'swr'
import type { SWRConfiguration } from 'swr'
import { useLocaleStore } from '@/store/localeStore'
import { useSessionUser } from '@/store/authStore'
import { apiGetMySchedule, formatScheduleDateParam } from '@/services/ScheduleService'
import type { MyScheduleItem } from '@/@types/schedule'

const swrOptions: SWRConfiguration = {
    revalidateOnFocus: true,
    revalidateIfStale: true,
    shouldRetryOnError: false,
}

/**
 * Custom hook to fetch and reactively track the student's scheduled live sessions for a given date.
 * Calls GET /api/my-schedule?date=YYYY-MM-DD
 */
export const useMySchedule = (date: string | Date, enabled: boolean = true) => {
    const locale = useLocaleStore((state) => state.currentLang)
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const userId = useSessionUser((state) => state.user.id)
    const authKey = signedIn ? userId || 'auth' : null

    const dateStr = formatScheduleDateParam(date)

    const { data, error, isLoading, isValidating, mutate } = useSWR(
        enabled && authKey ? ['student/my-schedule', dateStr, locale, authKey] : null,
        ([, d]) => apiGetMySchedule(d as string),
        swrOptions,
    )

    const schedule = (data?.data ?? []) as MyScheduleItem[]
    const isEmpty = !isLoading && !error && schedule.length === 0

    return {
        schedule,
        rawResponse: data,
        isLoading,
        isValidating,
        error,
        isEmpty,
        mutate,
        dateStr,
    }
}

export default useMySchedule
