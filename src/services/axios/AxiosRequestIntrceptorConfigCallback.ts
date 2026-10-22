import appConfig from '@/configs/app.config'
import {
    TOKEN_TYPE,
    REQUEST_HEADER_AUTH_KEY,
    TOKEN_NAME_IN_STORAGE,
} from '@/constants/api.constant'
import cookiesStorage from '@/utils/cookiesStorage'
import { useLocaleStore } from '@/store/localeStore'
import type { InternalAxiosRequestConfig } from 'axios'

const ANONYMOUS_AUTH_ENDPOINTS = [
    '/Auth/login',
    '/Auth/register',
    '/Auth/verify-email',
    '/Auth/resend-otp',
    '/Auth/refresh-token',
    '/Auth/forgot-password',
    '/Auth/verify-reset-code',
    '/Auth/reset-password',
]

const AxiosRequestIntrceptorConfigCallback = (
    config: InternalAxiosRequestConfig,
) => {
    const storageStrategy = appConfig.accessTokenPersistStrategy
    let accessToken = ''

    if (storageStrategy === 'localStorage') {
        accessToken = localStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
    } else if (storageStrategy === 'sessionStorage') {
        accessToken = sessionStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
    } else {
        accessToken = (cookiesStorage.getItem(TOKEN_NAME_IN_STORAGE) as string) || ''
    }

    if (!accessToken) {
        accessToken = localStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
    }

    const isAnonymousAuth = ANONYMOUS_AUTH_ENDPOINTS.some((endpoint) =>
        config.url?.endsWith(endpoint) || config.url?.includes(endpoint),
    )

    if (accessToken && !isAnonymousAuth) {
        if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set(REQUEST_HEADER_AUTH_KEY, `${TOKEN_TYPE}${accessToken}`)
        } else {
            config.headers[REQUEST_HEADER_AUTH_KEY] = `${TOKEN_TYPE}${accessToken}`
        }
    }

    // Default to application/json if data is not FormData and header not explicitly set
    if (!(config.data instanceof FormData) && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json'
    }

    // Attach language headers based on current locale store (defaults to 'en' or 'ar')
    const currentLang =
        useLocaleStore.getState()?.currentLang || appConfig.locale || 'en'
    config.headers['Accept-Language'] = currentLang

    return config
}

export default AxiosRequestIntrceptorConfigCallback
