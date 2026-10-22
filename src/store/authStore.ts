import cookiesStorage from '@/utils/cookiesStorage'
import appConfig from '@/configs/app.config'
import {
    TOKEN_NAME_IN_STORAGE,
    REFRESH_TOKEN_NAME_IN_STORAGE,
} from '@/constants/api.constant'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/@types/auth'

type Session = {
    signedIn: boolean
}

type AuthState = {
    session: Session
    user: User
}

type AuthAction = {
    setSessionSignedIn: (payload: boolean) => void
    setUser: (payload: User) => void
}

const getPersistStorage = () => {
    if (appConfig.accessTokenPersistStrategy === 'localStorage') {
        return localStorage
    }

    if (appConfig.accessTokenPersistStrategy === 'sessionStorage') {
        return sessionStorage
    }

    return cookiesStorage
}

const initialState: AuthState = {
    session: {
        signedIn: false,
    },
    user: {
        id: '',
        avatar: '',
        userName: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        status: 4,
        authority: [],
        roles: [],
    },
}

export const useSessionUser = create<AuthState & AuthAction>()(
    persist(
        (set) => ({
            ...initialState,
            setSessionSignedIn: (payload) =>
                set((state) => ({
                    session: {
                        ...state.session,
                        signedIn: payload,
                    },
                })),
            setUser: (payload) =>
                set((state) => ({
                    user: {
                        ...state.user,
                        ...payload,
                    },
                })),
        }),
        { name: 'sessionUser', storage: createJSONStorage(() => localStorage) },
    ),
)

export const useToken = () => {
    const storage = getPersistStorage()

    const setToken = (accessToken: string, refreshToken?: string) => {
        if (accessToken) {
            storage.setItem(TOKEN_NAME_IN_STORAGE, accessToken)
            localStorage.setItem(TOKEN_NAME_IN_STORAGE, accessToken)
        } else {
            storage.removeItem(TOKEN_NAME_IN_STORAGE)
            localStorage.removeItem(TOKEN_NAME_IN_STORAGE)
        }

        if (refreshToken) {
            storage.setItem(REFRESH_TOKEN_NAME_IN_STORAGE, refreshToken)
            localStorage.setItem(REFRESH_TOKEN_NAME_IN_STORAGE, refreshToken)
        } else if (accessToken === '') {
            storage.removeItem(REFRESH_TOKEN_NAME_IN_STORAGE)
            localStorage.removeItem(REFRESH_TOKEN_NAME_IN_STORAGE)
        }
    }

    return {
        setToken,
        token: (storage.getItem(TOKEN_NAME_IN_STORAGE) as string) || localStorage.getItem(TOKEN_NAME_IN_STORAGE),
        refreshToken: (storage.getItem(REFRESH_TOKEN_NAME_IN_STORAGE) as string) || localStorage.getItem(REFRESH_TOKEN_NAME_IN_STORAGE),
    }
}
