export type { PaginatedResult } from './api'

export type UserProfileDto = {
    id: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
    phoneNumber: string | null
    status: number
    profileImageUrl?: string | null
}

export type UserProfileResponse = {
    user: UserProfileDto
}

export type ChangeProfileImageResponse = {
    profileImageUrl: string
}

export type UpdateProfilePayload = {
    firstName: string
    lastName: string
}

export type ChangePasswordPayload = {
    currentPassword: string
    newPassword: string
}

export type ChangePhoneNumberRequest = {
    currentPassword: string
    newPhoneNumber: string
}

export type ChangeEmailRequestDto = {
    currentPassword: string
    newEmail: string
}

export type VerifyChangeEmailRequestDto = {
    newEmail: string
    otp: string
}

export type UserInfoResponse = {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    status: number
    roles: string[]
    imageUrl?: string | null
}

export type UserFullInfoResponse = {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    nationality?: string | null
    status: number
    roles: string[]
    imageUrl?: string | null
    filesUrl?: string | null
}

export type UserBasicInfoResponse = {
    id: string
    fullName: string
    email: string
    phoneNumber: string
    createdAt: string
    imageUrl?: string | null
}

export type CreateUserPayload = {
    firstName: string
    lastName: string
    email?: string
    password: string
    phoneNumber?: string
    roles: string[]
}

export type CreateUserResponse = {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phoneNumber: string | null
    status: number
    roles: string[]
}

export type UpdateUserPayload = {
    firstName: string
    lastName: string
    email?: string
    phoneNumber?: string
    roles: string[]
}

export type UserQueryFilter = {
    pageNumber?: number
    pageSize?: number
    status?: number
    email?: string
    phoneNumber?: string
    fullName?: string
}
