export interface UserBasicInfoDto {
    id: string
    firstName: string
    lastName: string
}

export interface CourseCategoryPublicResponse {
    id: number
    nameAr: string
    nameEn: string
}

export interface CourseCategoryResponse {
    id: number
    nameAr: string
    nameEn: string
    isActive: boolean
    createdAt: string
    updatedAt: string | null
}

export interface CourseCategoryDetailResponse extends CourseCategoryResponse {
    createdBy: UserBasicInfoDto | null
    updatedBy: UserBasicInfoDto | null
}

export interface CreateCourseCategoryRequest {
    nameAr: string
    nameEn: string
    isActive?: boolean
}

export interface UpdateCourseCategoryRequest {
    nameAr: string
    nameEn: string
}

export interface GetPaginatedCourseCategoriesQueryParams {
    pageNumber?: number
    pageSize?: number
    isActive?: boolean
    searchTerm?: string
}
