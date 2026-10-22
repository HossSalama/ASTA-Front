import ApiService from './ApiService'
import type { ApiResponse, PaginatedResult } from '@/@types/api'
import type {
    PublicFAQ,
    PublicFAQListResponse,
    GetPublicFaqsParams,
    AdminFAQSummary,
    AdminFAQDetail,
    GetAdminFaqsParams,
    CreateFAQPayload,
    UpdateFAQPayload,
} from '@/@types/faq'

/**
 * 1. Get Paginated Active FAQs (Public)
 * GET /api/faqs/public
 */
export async function apiGetPublicFaqs(params?: GetPublicFaqsParams) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PublicFAQListResponse>
    >({
        url: '/faqs/public',
        method: 'get',
        params,
    })
}

/**
 * 2. Get Paginated FAQs for Admin Dashboard
 * GET /api/faqs
 */
export async function apiGetAdminFaqs(params?: GetAdminFaqsParams) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<AdminFAQSummary>>
    >({
        url: '/faqs',
        method: 'get',
        params,
    })
}

/**
 * 3. Get FAQ Details by ID (Admin Audit View)
 * GET /api/faqs/{id}
 */
export async function apiGetFaqById(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<AdminFAQDetail>
    >({
        url: `/faqs/${id}`,
        method: 'get',
    })
}

/**
 * 4. Create FAQ (Admin)
 * POST /api/faqs
 */
export async function apiCreateFaq(data: CreateFAQPayload) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<AdminFAQSummary>,
        CreateFAQPayload
    >({
        url: '/faqs',
        method: 'post',
        data,
    })
}

/**
 * 5. Update FAQ (Admin)
 * PUT /api/faqs/{id}
 */
export async function apiUpdateFaq(id: number, data: UpdateFAQPayload) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<AdminFAQSummary>,
        UpdateFAQPayload
    >({
        url: `/faqs/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 6. Toggle FAQ Active Status (Admin)
 * PUT /api/faqs/{id}/toggle-status
 */
export async function apiToggleFaqStatus(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<AdminFAQSummary>
    >({
        url: `/faqs/${id}/toggle-status`,
        method: 'put',
    })
}

/**
 * 7. Soft Delete FAQ (Admin)
 * DELETE /api/faqs/{id}
 */
export async function apiDeleteFaq(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<null>
    >({
        url: `/faqs/${id}`,
        method: 'delete',
    })
}
