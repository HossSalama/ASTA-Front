export type SignInCredential = {
    identifier: string
    password: string
}

export type SignUpCredential = {
    firstName: string
    lastName: string
    phoneNumber: string
    email: string
    password: string
}

export type VerifyEmailPayload = {
    email: string
    otp: string
}

export type ResendOtpPayload = {
    email: string
}

export type ForgotPasswordPayload = {
    email: string
}

export type VerifyResetCodePayload = {
    email: string
    code: string
}

export type VerifyResetCodeResponse = {
    resetToken: string
}

export type ResetPasswordPayload = {
    resetToken: string
    newPassword: string
}

export type RefreshTokenPayload = {
    refreshToken: string
}

export type LogoutPayload = {
    refreshToken: string
}

export type AuthUserDto = {
    id: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
    phoneNumber: string | null
    status: number
    profileImageUrl?: string | null
    roles?: string[]
}

export type AuthResponse = {
    accessToken: string | null
    refreshToken: string | null
    expiresIn?: number | null
    refreshTokenExpiration?: string | null
    user: AuthUserDto
}

export type VerifyEmailResponse = AuthResponse

export type AuthRequestStatus = 'success' | 'failed' | ''

export type AuthResult = Promise<{
    status: AuthRequestStatus
    message: string
    data?: unknown
}>

export type User = {
    id?: string
    userId?: string | null
    firstName?: string | null
    lastName?: string | null
    userName?: string | null
    email?: string | null
    phoneNumber?: string | null
    status?: number
    authority?: string[]
    roles?: string[]
    avatar?: string | null
    profileImageUrl?: string | null
    identityFileUrl?: string | null
    nationality?: string | null
}

export type Token = {
    accessToken: string
    refreshToken?: string
}

export type OauthSignInCallbackPayload = {
    onSignIn: (tokens: Token, user?: User) => void
    redirect: () => void
}
