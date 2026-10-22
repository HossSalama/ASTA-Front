// ==========================================
// Enums
// ==========================================
export enum TicketPriority {
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}

export enum TicketStatus {
    New = 1,
    InProgress = 2,
    Closed = 3,
}

// ==========================================
// Ticket Rating DTO
// ==========================================
export interface TicketRatingDto {
    id: number
    rating: number // 1 to 5
    comment: string | null
    createdAt: string // ISO-8601
}

// ==========================================
// Public & Client DTOs
// ==========================================
export interface TicketTypePublicResponse {
    id: number
    name: string // Localized based on Accept-Language
}

export interface UserTicketListItemResponse {
    id: number
    ticketNumber: string
    ticketTypeId: number
    ticketTypeName: string // Localized
    status: TicketStatus
    description: string | null
    hasAttachment: boolean
    createdAt: string
    closedAt: string | null
}

export interface UserTicketDetailResponse {
    id: number
    ticketNumber: string
    ticketTypeId: number
    ticketTypeName: string // Localized
    status: TicketStatus
    description: string
    attachmentUrl: string | null // Direct presigned working URL
    attachmentFileName: string | null
    createdAt: string
    adminReply: string | null
    rating: TicketRatingDto | null
}

export interface GetUserTicketsParams {
    status?: TicketStatus
    pageNumber?: number
    pageSize?: number
}

export interface CreateTicketRatingPayload {
    rating: number
    comment?: string
}

// ==========================================
// Admin DTOs
// ==========================================
export interface TicketTypeResponse {
    id: number
    nameAr: string
    nameEn: string
    priority: TicketPriority
    isActive: boolean
    createdAt: string
    updatedAt: string | null
}

export interface TicketTypeDetailResponse extends TicketTypeResponse {
    associatedTicketsCount: number
}

export interface GetAdminTicketTypesParams {
    searchTerm?: string
    isActive?: boolean
    pageNumber?: number
    pageSize?: number
}

export interface CreateTicketTypeRequest {
    nameAr: string
    nameEn: string
    priority: TicketPriority
    isActive?: boolean
}

export interface UpdateTicketTypeRequest {
    nameAr: string
    nameEn: string
    priority: TicketPriority
    isActive?: boolean
}

export interface AdminTicketListItemResponse {
    id: number
    ticketNumber: string
    ticketTypeId: number
    ticketTypeNameAr: string
    ticketTypeNameEn: string
    priority: TicketPriority
    status: TicketStatus
    description: string | null
    hasAttachment: boolean
    userId: string
    userName: string
    userEmail: string | null
    createdAt: string
    closedAt: string | null
}

export interface AdminTicketDetailResponse {
    id: number
    ticketNumber: string
    ticketTypeId: number
    ticketTypeNameAr: string
    ticketTypeNameEn: string
    ticketTypePriority: TicketPriority
    priority: TicketPriority
    status: TicketStatus
    description: string
    attachmentUrl: string | null // Direct presigned working URL
    attachmentFileName: string | null
    adminReply: string | null
    userId: string
    userName: string
    userEmail: string | null
    userPhoneNumber: string | null
    closedByID: string | null
    closedByName: string | null
    closedAt: string | null
    createdByID: string | null
    createdAt: string
    updatedByID: string | null
    updatedAt: string | null
    rating: TicketRatingDto | null
}

export interface GetAdminTicketsParams {
    status?: TicketStatus
    ticketTypeId?: number
    priority?: TicketPriority
    userId?: string
    searchTerm?: string
    pageNumber?: number
    pageSize?: number
    sortBy?: 'createdAt' | 'priority' | 'status' | string
    sortOrder?: 'asc' | 'desc'
}

export interface UpdateTicketStatusPayload {
    status: TicketStatus
}

export interface CloseTicketPayload {
    adminReply?: string
}
