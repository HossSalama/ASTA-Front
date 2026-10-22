import ApiService from './ApiService'
import type { ApiResponse, PaginatedResult } from '@/@types/api'
import type {
    TicketTypePublicResponse,
    UserTicketListItemResponse,
    UserTicketDetailResponse,
    GetUserTicketsParams,
    CreateTicketRatingPayload,
    TicketRatingDto,
    TicketTypeResponse,
    TicketTypeDetailResponse,
    GetAdminTicketTypesParams,
    CreateTicketTypeRequest,
    UpdateTicketTypeRequest,
    AdminTicketListItemResponse,
    AdminTicketDetailResponse,
    GetAdminTicketsParams,
    UpdateTicketStatusPayload,
    CloseTicketPayload,
} from '@/@types/ticket'

// =========================================================================
// Public & Client Endpoints
// =========================================================================

/**
 * 1. Get Public Active Ticket Types (Dropdown Selection)
 * GET /api/ticket-types/public
 */
export async function apiGetPublicTicketTypes() {
    return ApiService.fetchDataWithAxios<
        ApiResponse<TicketTypePublicResponse[]>
    >({
        url: '/ticket-types/public',
        method: 'get',
    })
}

/**
 * 2. Create Ticket with Optional Attachment
 * POST /api/tickets (multipart/form-data)
 */
export async function apiCreateTicket(formData: FormData) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<UserTicketDetailResponse>,
        FormData
    >({
        url: '/tickets',
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 3. Get My Tickets List (Client)
 * GET /api/tickets/my
 */
export async function apiGetMyTickets(params?: GetUserTicketsParams) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<UserTicketListItemResponse>>
    >({
        url: '/tickets/my',
        method: 'get',
        params,
    })
}

/**
 * 4. Get User Ticket Details
 * GET /api/tickets/{id}
 */
export async function apiGetUserTicketById(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<UserTicketDetailResponse>>(
        {
            url: `/tickets/${id}`,
            method: 'get',
        },
    )
}

/**
 * 5. Submit Ticket Rating (Owner Only, Closed Ticket Only)
 * POST /api/tickets/{id}/rating
 */
export async function apiSubmitTicketRating(
    id: number,
    data: CreateTicketRatingPayload,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<TicketRatingDto>,
        CreateTicketRatingPayload
    >({
        url: `/tickets/${id}/rating`,
        method: 'post',
        data,
    })
}

// =========================================================================
// Admin Ticket Types Endpoints
// =========================================================================

/**
 * 6. List all ticket types (Admin)
 * GET /api/ticket-types
 */
export async function apiGetAdminTicketTypes(
    params?: GetAdminTicketTypesParams,
) {
    return ApiService.fetchDataWithAxios<ApiResponse<TicketTypeResponse[]>>({
        url: '/ticket-types',
        method: 'get',
        params,
    })
}

/**
 * 7. Get ticket type details with associated tickets count (Admin)
 * GET /api/ticket-types/{id}
 */
export async function apiGetAdminTicketTypeById(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<TicketTypeDetailResponse>>(
        {
            url: `/ticket-types/${id}`,
            method: 'get',
        },
    )
}

/**
 * 8. Create ticket type (Admin)
 * POST /api/ticket-types
 */
export async function apiCreateTicketType(data: CreateTicketTypeRequest) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<TicketTypeResponse>,
        CreateTicketTypeRequest
    >({
        url: '/ticket-types',
        method: 'post',
        data,
    })
}

/**
 * 9. Update ticket type (Admin)
 * PUT /api/ticket-types/{id}
 */
export async function apiUpdateTicketType(
    id: number,
    data: UpdateTicketTypeRequest,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<TicketTypeResponse>,
        UpdateTicketTypeRequest
    >({
        url: `/ticket-types/${id}`,
        method: 'put',
        data,
    })
}

/**
 * 10. Toggle ticket type active flag (Admin)
 * PATCH /api/ticket-types/{id}/toggle-status
 */
export async function apiToggleTicketTypeStatus(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<TicketTypeResponse>>({
        url: `/ticket-types/${id}/toggle-status`,
        method: 'patch',
    })
}

/**
 * 11. Soft delete ticket type (Admin)
 * DELETE /api/ticket-types/{id}
 */
export async function apiDeleteTicketType(id: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>>({
        url: `/ticket-types/${id}`,
        method: 'delete',
    })
}

// =========================================================================
// Admin Tickets Endpoints
// =========================================================================

/**
 * 12. Search & Filter all tickets (Admin)
 * GET /api/admin/tickets
 */
export async function apiGetAdminTickets(params?: GetAdminTicketsParams) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<PaginatedResult<AdminTicketListItemResponse>>
    >({
        url: '/admin/tickets',
        method: 'get',
        params,
    })
}

/**
 * 13. Get full administrative ticket details (Admin)
 * GET /api/admin/tickets/{id}
 */
export async function apiGetAdminTicketById(id: number) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<AdminTicketDetailResponse>
    >({
        url: `/admin/tickets/${id}`,
        method: 'get',
    })
}

/**
 * 14. Update ticket status (New <-> InProgress) (Admin)
 * PATCH /api/admin/tickets/{id}/status
 */
export async function apiUpdateAdminTicketStatus(
    id: number,
    data: UpdateTicketStatusPayload,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<null>,
        UpdateTicketStatusPayload
    >({
        url: `/admin/tickets/${id}/status`,
        method: 'patch',
        data,
    })
}

/**
 * 15. Close ticket with reply (Admin)
 * POST /api/admin/tickets/{id}/close
 */
export async function apiCloseAdminTicket(
    id: number,
    data: CloseTicketPayload,
) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>, CloseTicketPayload>(
        {
            url: `/admin/tickets/${id}/close`,
            method: 'post',
            data,
        },
    )
}
