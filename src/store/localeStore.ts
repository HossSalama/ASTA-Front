import appConfig from '@/configs/app.config'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import i18n from 'i18next'
import { dateLocales } from '@/locales'
import dayjs from 'dayjs'
import { useThemeStore } from '@/store/themeStore'

type LocaleState = {
    currentLang: string
    setLang: (payload: string) => void
}

export const useLocaleStore = create<LocaleState>()(
    devtools(
        persist(
            (set) => ({
                currentLang: appConfig.locale,
                setLang: (lang: string) => {
                    const formattedLang = lang.replace(
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

                    set({ currentLang: lang })
                },
            }),
            { name: 'locale' },
        ),
    ),
)
