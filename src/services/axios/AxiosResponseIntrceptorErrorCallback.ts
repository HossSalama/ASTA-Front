import axios from 'axios'
import appConfig from '@/configs/app.config'
import {
    TOKEN_NAME_IN_STORAGE,
    REFRESH_TOKEN_NAME_IN_STORAGE,
    REQUEST_HEADER_AUTH_KEY,
    TOKEN_TYPE,
} from '@/constants/api.constant'
import { useSessionUser } from '@/store/authStore'
import { useLocaleStore } from '@/store/localeStore'
import { extractRolesFromToken } from '@/utils/jwt'
import type { ApiResponse } from '@/@types/api'
import type { AuthResponse, User } from '@/@types/auth'
import type { AxiosError, InternalAxiosRequestConfig, AxiosInstance } from 'axios'

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean
}

let isRefreshing = false
let failedQueue: Array<{
    resolve: (token: string) => void
    reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token!)
        }
    })
    failedQueue = []
}

const clearAuthAndRedirect = () => {
    localStorage.removeItem(TOKEN_NAME_IN_STORAGE)
    localStorage.removeItem(REFRESH_TOKEN_NAME_IN_STORAGE)
    useSessionUser.getState().setUser({})
    useSessionUser.getState().setSessionSignedIn(false)

    // REDIRECT LOGIC: Only redirect to sign-in if current path is a protected route.
    // Public paths allow the error to propagate without forcing a redirect.
    const pathname = window.location.pathname
    const protectedPrefixes = ['/admin', '/user']
    const isProtectedRoute = protectedPrefixes.some((prefix) =>
        pathname.startsWith(prefix),
    )

    if (isProtectedRoute && pathname !== '/sign-in') {
        window.location.href = '/sign-in'
    }
}

export const handleAxiosResponseError = async (
    error: AxiosError,
    axiosInstance: AxiosInstance,
) => {
    const originalRequest = error.config as CustomAxiosRequestConfig

    const url = originalRequest?.url || ''
    const isAuthEndpoint =
        url.includes('Auth/refresh-token') ||
        url.includes('Auth/login') ||
        url.includes('Auth/register') ||
        url.includes('Auth/verify-email') ||
        url.includes('Auth/forgot-password') ||
        url.includes('Auth/verify-reset-code') ||
        url.includes('Auth/reset-password')

    if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isAuthEndpoint
    ) {
        if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({ resolve, reject })
            })
                .then((token) => {
                    originalRequest.headers[REQUEST_HEADER_AUTH_KEY] =
                        `${TOKEN_TYPE}${token}`
                    return axiosInstance(originalRequest)
                })
                .catch((err) => Promise.reject(err))
        }

        const currentRefreshToken =
            localStorage.getItem(REFRESH_TOKEN_NAME_IN_STORAGE) || ''

        // If there's no refresh token, session cannot be refreshed
        if (!currentRefreshToken) {
            clearAuthAndRedirect()
            return Promise.reject(error)
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
            const currentLang =
                useLocaleStore.getState()?.currentLang || appConfig.locale || 'en'

            // POST /api/Auth/refresh-token with { refreshToken } as specified in AUTH_API_DOCUMENTATION.md
            const refreshResponse = await axios.post<ApiResponse<AuthResponse>>(
                `${appConfig.apiPrefix}/Auth/refresh-token`,
                {
                    refreshToken: currentRefreshToken,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept-Language': currentLang,
                    },
                },
            )

            const refreshData = refreshResponse.data
            if (refreshData?.status && refreshData?.data?.accessToken) {
                const { accessToken, refreshToken: newRefreshToken, user: authUser } =
                    refreshData.data

                localStorage.setItem(TOKEN_NAME_IN_STORAGE, accessToken)
                if (newRefreshToken) {
                    localStorage.setItem(REFRESH_TOKEN_NAME_IN_STORAGE, newRefreshToken)
                }

                if (authUser) {
                    const tokenRoles = extractRolesFromToken(accessToken)
                    const rawRoles =
                        authUser.roles && authUser.roles.length > 0
                            ? authUser.roles
                            : tokenRoles
                    const roles =
                        rawRoles.length > 0
                            ? rawRoles.map((r) => (r.toLowerCase() === 'admin' ? 'Admin' : r))
                            : ['User']

                    const updatedUser: User = {
                        id: authUser.id || undefined,
                        userId: authUser.id || undefined,
                        firstName: authUser.firstName,
                        lastName: authUser.lastName,
                        userName:
                            authUser.firstName && authUser.lastName
                                ? `${authUser.firstName} ${authUser.lastName}`
                                : authUser.email || '',
                        email: authUser.email,
                        phoneNumber: authUser.phoneNumber,
                        status: authUser.status,
                        authority: roles,
                        roles,
                        profileImageUrl: authUser.profileImageUrl,
                        avatar: authUser.profileImageUrl,
                    }
                    useSessionUser.getState().setUser(updatedUser)
                    useSessionUser.getState().setSessionSignedIn(true)
                }

                originalRequest.headers[REQUEST_HEADER_AUTH_KEY] =
                    `${TOKEN_TYPE}${accessToken}`
                processQueue(null, accessToken)
                return axiosInstance(originalRequest)
            } else {
                throw new Error(refreshData?.message || 'Refresh token expired or invalid')
            }
        } catch (refreshErr) {
            processQueue(refreshErr, null)
            clearAuthAndRedirect()
            return Promise.reject(refreshErr)
        } finally {
            isRefreshing = false
        }
    }

    return Promise.reject(error)
}

export default handleAxiosResponseError
