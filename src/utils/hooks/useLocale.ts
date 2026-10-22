import { useEffect } from 'react'
import i18n from 'i18next'
import { useLocaleStore } from '@/store/localeStore'
import { useThemeStore } from '@/store/themeStore'
import { dateLocales } from '@/locales'
import dayjs from 'dayjs'

const useLocale = () => {
    const currentLang = useLocaleStore((state) => state.currentLang)

    useEffect(() => {
        if (i18n.language !== currentLang) {
            const formattedLang = currentLang.replace(
                /-([a-z])/g,
                function (g) {
                    return g[1].toUpperCase()
                },
            )
            i18n.changeLanguage(formattedLang)

            if (dateLocales[formattedLang]) {
                dateLocales[formattedLang]().then(() => {
                    dayjs.locale(formattedLang)
                })
            }

            const dir = formattedLang === 'ar' ? 'rtl' : 'ltr'
            useThemeStore.getState().setDirection(dir)
        }
    }, [currentLang])

    return {
        locale: currentLang,
    }
}

export default useLocale
