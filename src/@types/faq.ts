import type { PaginatedResult } from './api'

export interface UserBasicInfo {
    id: string
    firstName: string
    lastName: string
}

export interface PublicFAQ {
    id: number
    question: string
    answer: string
}

export interface PublicFAQListResponse extends PaginatedResult<PublicFAQ> {
    hasTickets: boolean
    whatsAppNumber: string | null
}

export interface GetPublicFaqsParams {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
}

export interface AdminFAQSummary {
    id: number
    questionAr: string
    questionEn: string
    answerAr: string
    answerEn: string
    isActive: boolean
    createdAt: string
    updatedAt: string | null
}

export interface AdminFAQDetail extends AdminFAQSummary {
    createdBy: UserBasicInfo | null
    updatedBy: UserBasicInfo | null
}

export interface GetAdminFaqsParams {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
    isActive?: boolean
}

export interface CreateFAQPayload {
    questionAr: string
    questionEn: string
    answerAr: string
    answerEn: string
    isActive?: boolean
}

export interface UpdateFAQPayload {
    questionAr: string
    questionEn: string
    answerAr: string
    answerEn: string
    isActive?: boolean
}
