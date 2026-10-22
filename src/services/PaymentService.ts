import ApiService from './ApiService'
import type { ApiResponse, PaginatedResult } from '@/@types/api'
import type {
    PaymentMethodPublicResponse,
    PaymentMethodResponse,
    GetAdminPaymentMethodsParams,
    PaymentRequestCreatedResponse,
    MyPaymentRequestListItem,
    GetMyPaymentRequestsParams,
    MyPaymentRequestDetail,
    AdminPaymentRequestListItem,
    GetAdminPaymentRequestsParams,
    AdminPaymentRequestDetail,
    RejectPaymentRequestPayload,
} from '@/@types/payment'

// =========================================================================
// 1. Payment Methods (Student / Public)
// =========================================================================

/**
 * 1.1 List Active Payment Methods
 * GET /api/payment-methods/public
 */
export async function apiGetPublicPaymentMethods() {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaymentMethodPublicResponse[]>
    >({
        url: '/payment-methods/public',
        method: 'get',
    })
}

// =========================================================================
// 2. Payment Methods (Admin Management)
// =========================================================================

/**
 * 2.1 List All Payment Methods
 * GET /api/payment-methods
 */
export async function apiGetAdminPaymentMethods(
    params?: GetAdminPaymentMethodsParams,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaymentMethodResponse[]>
    >({
        url: '/payment-methods',
        method: 'get',
        params,
    })
}

/**
 * 2.2 Get Payment Method Details
 * GET /api/payment-methods/{id}
 */
export async function apiGetAdminPaymentMethodById(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<PaymentMethodResponse>>({
        url: `/payment-methods/${id}`,
        method: 'get',
    })
}

/**
 * 2.3 Create Payment Method
 * POST /api/payment-methods (multipart/form-data)
 */
export async function apiCreatePaymentMethod(formData: FormData) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaymentMethodResponse>,
        FormData
    >({
        url: '/payment-methods',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 2.4 Update Payment Method
 * PUT /api/payment-methods/{id} (multipart/form-data)
 */
export async function apiUpdatePaymentMethod(id: number, formData: FormData) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaymentMethodResponse>,
        FormData
    >({
        url: `/payment-methods/${id}`,
        method: 'put',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 2.5 Toggle Payment Method Status
 * PATCH /api/payment-methods/{id}/toggle-status
 */
export async function apiTogglePaymentMethodStatus(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<boolean>>({
        url: `/payment-methods/${id}/toggle-status`,
        method: 'patch',
    })
}

// =========================================================================
// 3. Student Payment Requests
// =========================================================================

/**
 * 3.1 Submit Payment Request
 * POST /api/payment-requests (multipart/form-data)
 */
export async function apiSubmitPaymentRequest(formData: FormData) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaymentRequestCreatedResponse>,
        FormData
    >({
        url: '/payment-requests',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 3.2 List My Payment Requests
 * GET /api/payment-requests/my
 */
export async function apiGetMyPaymentRequests(
    params?: GetMyPaymentRequestsParams,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<MyPaymentRequestListItem>>
    >({
        url: '/payment-requests/my',
        method: 'get',
        params,
    })
}

/**
 * 3.3 Get My Payment Request Details
 * GET /api/payment-requests/my/{id}
 */
export async function apiGetMyPaymentRequestById(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<MyPaymentRequestDetail>>({
        url: `/payment-requests/my/${id}`,
        method: 'get',
    })
}

// =========================================================================
// 4. Admin Payment Requests Review & Processing
// =========================================================================

/**
 * 4.1 List Payment Requests (Admin Queue)
 * GET /api/payment-requests
 */
export async function apiGetAdminPaymentRequests(
    params?: GetAdminPaymentRequestsParams,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<AdminPaymentRequestListItem>>
    >({
        url: '/payment-requests',
        method: 'get',
        params,
    })
}

/**
 * 4.2 Get Payment Request Details (Admin)
 * GET /api/payment-requests/{id}
 */
export async function apiGetAdminPaymentRequestById(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<AdminPaymentRequestDetail>>({
        url: `/payment-requests/${id}`,
        method: 'get',
    })
}

/**
 * 4.3 Mark Under Review (New -> Pending)
 * POST /api/payment-requests/{id}/under-review
 */
export async function apiMarkPaymentRequestUnderReview(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<boolean>>({
        url: `/payment-requests/${id}/under-review`,
        method: 'post',
    })
}

/**
 * 4.4 Approve Payment Request (Pending -> Approved + Atomic Enrollment)
 * POST /api/payment-requests/{id}/approve
 */
export async function apiApprovePaymentRequest(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<boolean>>({
        url: `/payment-requests/${id}/approve`,
        method: 'post',
    })
}

/**
 * 4.5 Reject Payment Request (Pending -> Rejected)
 * POST /api/payment-requests/{id}/reject
 */
export async function apiRejectPaymentRequest(
    id: number,
    payload?: RejectPaymentRequestPayload,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<boolean>,
        RejectPaymentRequestPayload
    >({
        url: `/payment-requests/${id}/reject`,
        method: 'post',
        data: payload || {},
    })
}
