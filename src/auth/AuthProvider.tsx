import { useRef, useImperativeHandle, useEffect } from 'react'
import AuthContext from './AuthContext'
import appConfig from '@/configs/app.config'
import { useSessionUser, useToken } from '@/store/authStore'
import { useEnrollmentStore } from '@/store/enrollmentStore'
import { apiSignIn, apiSignOut, apiSignUp, apiVerifyEmail, apiResetPassword } from '@/services/AuthService'
import { apiGetMe } from '@/services/UserService'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { useNavigate } from 'react-router-dom'
import { extractRolesFromToken } from '@/utils/jwt'
import { extractApiErrorMessage } from '@/utils/apiError'
import type {
    SignInCredential,
    SignUpCredential,
    VerifyEmailPayload,
    ResetPasswordPayload,
    AuthResult,
    OauthSignInCallbackPayload,
    User,
    Token,
} from '@/@types/auth'
import type { ReactNode, Ref } from 'react'
import type { NavigateFunction } from 'react-router-dom'

type AuthProviderProps = { children: ReactNode }

export type IsolatedNavigatorRef = {
    navigate: NavigateFunction
}

const IsolatedNavigator = ({ ref }: { ref: Ref<IsolatedNavigatorRef> }) => {
    const navigate = useNavigate()

    useImperativeHandle(ref, () => {
        return {
            navigate,
        }
    }, [navigate])

    return <></>
}

function AuthProvider({ children }: AuthProviderProps) {
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const user = useSessionUser((state) => state.user)
    const setUser = useSessionUser((state) => state.setUser)
    const setSessionSignedIn = useSessionUser(
        (state) => state.setSessionSignedIn,
    )
    const { token, refreshToken, setToken } = useToken()

    const authenticated = Boolean(token && signedIn)

    const navigatorRef = useRef<IsolatedNavigatorRef>(null)

    const getLandingPath = (userObj?: User) => {
        const currentUser = userObj || user
        if (currentUser?.status === 1) {
            return `/verify-email${currentUser.email ? `?email=${encodeURIComponent(currentUser.email)}` : ''}`
        }
        const roles = currentUser?.roles || currentUser?.authority || []
        if (roles.some((r) => r.toLowerCase() === 'admin')) {
            return '/admin/users'
        }
        return '/courses'
    }

    const redirect = (targetPath?: string) => {
        const search = window.location.search
        const params = new URLSearchParams(search)
        const redirectUrl = params.get(REDIRECT_URL_KEY)

        if (redirectUrl) {
            navigatorRef.current?.navigate(redirectUrl)
            return
        }

        const landing = targetPath || getLandingPath()
        navigatorRef.current?.navigate(landing)
    }

    const handleSignIn = (tokens: Token, userObj?: User) => {
        setToken(tokens.accessToken, tokens.refreshToken)
        setSessionSignedIn(true)

        if (userObj) {
            const roles = userObj.roles || userObj.authority || []
            setUser({
                ...userObj,
                authority: roles,
                roles,
            })
        }
    }

    const handleSignOut = () => {
        setToken('')
        setUser({})
        setSessionSignedIn(false)
        useEnrollmentStore.getState().clearEnrollments()
    }

    // Sync session on mount if authenticated
    useEffect(() => {
        if (authenticated && token) {
            apiGetMe()
                .then((res) => {
                    if (res?.status && res?.data?.user) {
                        const profile = res.data.user
                        if (profile.status === 6 || profile.status === 7) {
                            handleSignOut()
                            navigatorRef.current?.navigate('/sign-in')
                            return
                        }
                        const tokenRoles = extractRolesFromToken(token)
                        const userRoles = (user.roles && user.roles.length > 0)
                            ? user.roles
                            : (tokenRoles.length > 0
                                ? tokenRoles.map((r: string) => (r.toLowerCase() === 'admin' ? 'Admin' : r))
                                : ['User'])

                        setUser({
                            id: profile.id || undefined,
                            userId: profile.id || undefined,
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                            userName: profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : profile.email || '',
                            email: profile.email,
                            phoneNumber: profile.phoneNumber,
                            status: profile.status,
                            authority: userRoles,
                            roles: userRoles,
                            profileImageUrl: profile.profileImageUrl,
                            avatar: profile.profileImageUrl,
                        })
                    }
                })
                .catch(() => {
                    // Handled by response interceptor
                })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authenticated, token])

    const signIn = async (values: SignInCredential): AuthResult => {
        try {
            const resp = await apiSignIn(values)
            if (resp && resp.status && resp.data) {
                const { accessToken, refreshToken, user: authUser } = resp.data

                // Handle unconfirmed email (status 1) where tokens are null
                if (authUser?.status === 1 || !accessToken) {
                    const emailParam =
                        authUser?.email ||
                        (values.identifier.includes('@') ? values.identifier : '')
                    navigatorRef.current?.navigate(
                        `/verify-email${emailParam ? `?email=${encodeURIComponent(emailParam)}` : ''}`,
                    )
                    return {
                        status: 'failed',
                        message:
                            resp.message ||
                            'Please verify your email before continuing.',
                    }
                }

                const tokenStr = accessToken || ''
                const refreshTokenStr = refreshToken || undefined
                const tokenRoles = extractRolesFromToken(tokenStr)
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
                handleSignIn(
                    { accessToken: tokenStr, refreshToken: refreshTokenStr },
                    updatedUser,
                )
                const landing = getLandingPath(updatedUser)
                redirect(landing)
                return {
                    status: 'success',
                    message: resp.message || 'Login successful',
                    data: resp.data,
                }
            }

            const errorMsg = extractApiErrorMessage(
                resp,
                'Invalid email or password. Please check your credentials and try again.',
            )
            return {
                status: 'failed',
                message: errorMsg,
            }
        } catch (errors: unknown) {
            const errorMsg = extractApiErrorMessage(
                errors,
                'Unable to sign in. Please check your network and try again.',
            )
            return {
                status: 'failed',
                message: errorMsg,
            }
        }
    }

    const signUp = async (values: SignUpCredential): AuthResult => {
        try {
            const resp = await apiSignUp(values)
            if (resp && resp.status) {
                return {
                    status: 'success',
                    message: resp.message || 'OTP has been sent to your email.',
                }
            }
            const errorMsg = extractApiErrorMessage(
                resp,
                'Unable to create account. Please check your details and try again.',
            )
            return {
                status: 'failed',
                message: errorMsg,
            }
        } catch (errors: unknown) {
            const errorMsg = extractApiErrorMessage(
                errors,
                'Registration failed. Please check your information and try again.',
            )
            return {
                status: 'failed',
                message: errorMsg,
            }
        }
    }

    const verifyEmail = async (values: VerifyEmailPayload): AuthResult => {
        try {
            const resp = await apiVerifyEmail(values)
            if (resp && resp.status && resp.data?.accessToken) {
                const { accessToken, refreshToken, user: verifyUser } = resp.data
                const tokenStr = accessToken || ''
                const refreshTokenStr = refreshToken || undefined
                const tokenRoles = extractRolesFromToken(tokenStr)
                const rawRoles =
                    verifyUser.roles && verifyUser.roles.length > 0
                        ? verifyUser.roles
                        : tokenRoles
                const roles =
                    rawRoles.length > 0
                        ? rawRoles.map((r) => (r.toLowerCase() === 'admin' ? 'Admin' : r))
                        : ['User']

                const updatedUser: User = {
                    id: verifyUser.id || undefined,
                    userId: verifyUser.id || undefined,
                    firstName: verifyUser.firstName,
                    lastName: verifyUser.lastName,
                    userName:
                        verifyUser.firstName && verifyUser.lastName
                            ? `${verifyUser.firstName} ${verifyUser.lastName}`
                            : verifyUser.email || '',
                    email: verifyUser.email,
                    phoneNumber: verifyUser.phoneNumber,
                    status: verifyUser.status,
                    authority: roles,
                    roles: roles,
                    profileImageUrl: verifyUser.profileImageUrl,
                    avatar: verifyUser.profileImageUrl,
                }
                handleSignIn(
                    { accessToken: tokenStr, refreshToken: refreshTokenStr },
                    updatedUser,
                )
                const landing = getLandingPath(updatedUser)
                redirect(landing)
                return {
                    status: 'success',
                    message: resp.message || 'Email verified successfully',
                    data: resp.data,
                }
            }

            const errorMsg = extractApiErrorMessage(
                resp,
                'The verification code is incorrect or expired. Please check the code and try again.',
            )
            return {
                status: 'failed',
                message: errorMsg,
            }
        } catch (errors: unknown) {
            const errorMsg = extractApiErrorMessage(
                errors,
                'Verification failed. Please check the code and try again.',
            )
            return {
                status: 'failed',
                message: errorMsg,
            }
        }
    }

    const resetPassword = async (values: ResetPasswordPayload): AuthResult => {
        try {
            const resp = await apiResetPassword(values)
            if (resp && resp.status && resp.data?.accessToken) {
                const { accessToken, refreshToken, user: authUser } = resp.data
                const tokenStr = accessToken || ''
                const refreshTokenStr = refreshToken || undefined
                const tokenRoles = extractRolesFromToken(tokenStr)
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
                    roles: roles,
                    profileImageUrl: authUser.profileImageUrl,
                    avatar: authUser.profileImageUrl,
                }
                handleSignIn(
                    { accessToken: tokenStr, refreshToken: refreshTokenStr },
                    updatedUser,
                )
                const landing = getLandingPath(updatedUser)
                redirect(landing)
                return {
                    status: 'success',
                    message: resp.message || 'Password reset successfully',
                    data: resp.data,
                }
            }

            const errorMsg = extractApiErrorMessage(
                resp,
                'Failed to reset password. The reset session may have expired.',
            )
            return {
                status: 'failed',
                message: errorMsg,
            }
        } catch (errors: unknown) {
            const errorMsg = extractApiErrorMessage(
                errors,
                'Password reset failed. Please request a new code.',
            )
            return {
                status: 'failed',
                message: errorMsg,
            }
        }
    }

    const signOut = async () => {
        try {
            if (refreshToken) {
                await apiSignOut({ refreshToken })
            }
        } catch {
            // Silence signout network errors
        } finally {
            handleSignOut()
            navigatorRef.current?.navigate(appConfig.unAuthenticatedEntryPath)
        }
    }

    const oAuthSignIn = (
        callback: (payload: OauthSignInCallbackPayload) => void,
    ) => {
        callback({
            onSignIn: handleSignIn,
            redirect,
        })
    }

    return (
        <AuthContext.Provider
            value={{
                authenticated,
                user,
                signIn,
                signUp,
                verifyEmail,
                resetPassword,
                signOut,
                oAuthSignIn,
            }}
        >
            {children}
            <IsolatedNavigator ref={navigatorRef} />
        </AuthContext.Provider>
    )
}

export default AuthProvider
