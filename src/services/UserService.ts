import ApiService from './ApiService'
import { apiGetAccessUrl } from './StorageService'
import type { ApiResponse, PaginatedResult } from '@/@types/api'
import type {
    UserProfileResponse,
    ChangeProfileImageResponse,
    UpdateProfilePayload,
    ChangePasswordPayload,
    ChangePhoneNumberRequest,
    ChangeEmailRequestDto,
    VerifyChangeEmailRequestDto,
    UserInfoResponse,
    UserFullInfoResponse,
    UserBasicInfoResponse,
    CreateUserPayload,
    CreateUserResponse,
    UpdateUserPayload,
    UserQueryFilter,
} from '@/@types/user'

export async function apiGetMe() {
    return ApiService.fetchDataWithAxios<ApiResponse<UserProfileResponse>>({
        url: '/me',
        method: 'get',
    })
}

export async function apiUpdateProfile(data: UpdateProfilePayload) {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: '/UserAccount/profile',
        method: 'put',
        data,
    })
}

export async function apiChangeProfileImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return ApiService.fetchDataWithAxios<
        ApiResponse<ChangeProfileImageResponse>,
        FormData
    >({
        url: '/UserAccount/change-ProfileImage',
        method: 'put',
        data: formData,
    })
}

export async function apiGetPrivateAccessUrl(objectKey: string) {
    return apiGetAccessUrl(objectKey)
}

export async function apiChangePassword(data: ChangePasswordPayload) {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: '/UserAccount/change-password',
        method: 'post',
        data,
    })
}

export async function apiChangePhone(data: ChangePhoneNumberRequest) {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: '/UserAccount/change-phone',
        method: 'post',
        data,
    })
}

export async function apiChangeEmail(data: ChangeEmailRequestDto) {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: '/UserAccount/change-email',
        method: 'post',
        data,
    })
}

export async function apiResendChangeEmailOtp() {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: '/UserAccount/change-email/resend-otp',
        method: 'post',
    })
}

export async function apiVerifyChangeEmail(data: VerifyChangeEmailRequestDto) {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: '/UserAccount/change-email/verify',
        method: 'post',
        data,
    })
}

export async function apiGetUsers(params?: UserQueryFilter) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<UserInfoResponse>>
    >({
        url: '/Users/all',
        method: 'get',
        params,
    })
}

export async function apiGetUserById(id: string) {
    return ApiService.fetchDataWithAxios<ApiResponse<UserFullInfoResponse>>({
        url: `/Users/${id}`,
        method: 'get',
    })
}

export async function apiGetUserBasicById(id: string) {
    return ApiService.fetchDataWithAxios<ApiResponse<UserBasicInfoResponse>>({
        url: `/Users/${id}/basic`,
        method: 'get',
    })
}

export async function apiCreateUser(data: CreateUserPayload) {
    return ApiService.fetchDataWithAxios<ApiResponse<CreateUserResponse>>({
        url: '/Users',
        method: 'post',
        data,
    })
}

export async function apiUpdateUser(id: string, data: UpdateUserPayload) {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: `/Users/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteUser(id: string) {
    return ApiService.fetchDataWithAxios<ApiResponse>({
        url: `/Users/${id}`,
        method: 'delete',
    })
}
