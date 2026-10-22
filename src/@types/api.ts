export enum UserStatus {
    PendingEmailVerification = 1,
    PendingIdentityVerification = 2,
    PendingApproval = 3,
    Active = 4,
    Rejected = 5,
    Suspended = 6,
    Locked = 7,
}

export interface ApiResponse<T = any> {
    status: boolean
    message: string
    data: T | null
    isSuccess?: boolean
    errors?: any | null
    title?: string
}

export interface ValidationErrorData {
    errors: Record<string, string[]>
}

export interface PaginatedResult<T> {
    items: T[]
    totalCount: number
    pageNumber: number
    pageSize: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
}
