import { useTranslation as useReactI18NextTranslation } from 'react-i18next'

export const useTranslation = (usePlaceholder?: boolean) => {
    const i18NextTranslation = useReactI18NextTranslation()

    const translatePlaceholder = ((
        _: string,
        fallback?: string | Record<string, string | number>,
    ) => {
        if (typeof fallback === 'string') {
            return fallback
        }
        return ''
    }) as unknown as typeof i18NextTranslation.t

    if (usePlaceholder) {
        return {
            ...i18NextTranslation,
            t: translatePlaceholder,
            ready: true,
        }
    }

    return i18NextTranslation
}

export default useTranslation
