import useSWR from 'swr'
import { useLocaleStore } from '@/store/localeStore'
import { useSessionUser } from '@/store/authStore'
import { apiGetMyCertificates } from '@/services/CertificateService'

const swrOptions = {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    shouldRetryOnError: false,
}

/**
 * Custom hook to fetch all earned completion certificates for the authenticated student.
 * Calls GET /api/certificates/my.
 */
export const useCertificates = () => {
    const locale = useLocaleStore((state) => state.currentLang)
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const userId = useSessionUser((state) => state.user.id)
    const authKey = signedIn ? userId || 'auth' : null

    const { data, error, isLoading, mutate } = useSWR(
        authKey ? ['student/certificates', locale, authKey] : null,
        () => apiGetMyCertificates(),
        swrOptions,
    )

    return {
        certificates: data?.data ?? [],
        isLoading,
        error,
        mutate,
    }
}

export default useCertificates
