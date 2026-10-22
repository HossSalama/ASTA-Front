// ==========================================
// Enums & Statuses
// ==========================================
export type PaymentRequestStatus = 'New' | 'Pending' | 'Approved' | 'Rejected'

// ==========================================
// Payment Methods (Student / Public)
// ==========================================
export interface PaymentMethodPublicResponse {
    id: number
    name: string // Localized based on Accept-Language
    accountNumber: string
    instructions: string
    logoUrl: string | null
}

// ==========================================
// Payment Methods (Admin Management)
// ==========================================
export interface PaymentMethodResponse {
    id: number
    nameAr: string
    nameEn: string
    accountNumber: string
    instructionsAr: string
    instructionsEn: string
    logoUrl: string | null
    isActive: boolean
    createdAt: string
    updatedAt: string | null
}

export interface GetAdminPaymentMethodsParams {
    isActive?: boolean
}

export interface CreatePaymentMethodRequest {
    nameAr: string
    nameEn: string
    accountNumber: string
    instructionsAr: string
    instructionsEn: string
    isActive?: boolean
    logo?: File | null
}

export interface UpdatePaymentMethodRequest {
    nameAr: string
    nameEn: string
    accountNumber: string
    instructionsAr: string
    instructionsEn: string
    isActive?: boolean
    logo?: File | null
}

// ==========================================
// Student Payment Requests
// ==========================================
export interface SubmitPaymentRequestPayload {
    courseId: number
    paymentMethodId: number
    senderAccount: string
    notes?: string
    proofFile: File
}

export interface PaymentRequestCreatedResponse {
    id: number
    courseId: number
    courseName?: string
    courseTitle?: string
    amount: number
    paymentMethodId: number
    paymentMethodNameAr?: string
    paymentMethodNameEn?: string
    paymentMethodName?: string
    senderAccount: string
    status: PaymentRequestStatus
    notes: string | null
    createdAt: string
}

export interface MyPaymentRequestListItem {
    id: number
    courseId: number
    courseName?: string
    courseTitle?: string
    amount: number
    paymentMethodId: number
    paymentMethodNameAr?: string
    paymentMethodNameEn?: string
    paymentMethodName?: string
    status: PaymentRequestStatus
    rejectionReason: string | null
    createdAt: string
}

export interface GetMyPaymentRequestsParams {
    status?: PaymentRequestStatus | null
    pageNumber?: number
    pageSize?: number
}

export interface MyPaymentRequestDetail {
    id: number
    courseId: number
    courseName?: string
    courseTitle?: string
    amount: number
    paymentMethodId: number
    paymentMethodNameAr?: string
    paymentMethodNameEn?: string
    paymentMethodName?: string
    senderAccount: string
    proofUrl: string | null
    studentNotes: string | null
    status: PaymentRequestStatus
    rejectionReason: string | null
    createdAt: string
    updatedAt: string | null
}

// ==========================================
// Admin Payment Requests Review & Processing
// ==========================================
export interface AdminPaymentRequestListItem {
    id: number
    studentId: string
    studentName: string
    studentEmail: string
    courseId: number
    courseName?: string
    courseTitle?: string
    amount: number
    paymentMethodId: number
    paymentMethodNameAr?: string
    paymentMethodNameEn?: string
    paymentMethodName?: string
    senderAccount: string
    status: PaymentRequestStatus
    createdAt: string
    updatedAt: string | null
}

export interface GetAdminPaymentRequestsParams {
    status?: PaymentRequestStatus | null
    courseId?: number | null
    fromDate?: string | null
    toDate?: string | null
    searchTerm?: string
    pageNumber?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface AdminPaymentRequestDetail {
    id: number
    studentId: string
    studentName: string
    studentEmail: string
    studentPhoneNumber: string | null
    courseId: number
    courseName?: string
    courseTitle?: string
    amount: number
    paymentMethodId: number
    paymentMethodNameAr?: string
    paymentMethodNameEn?: string
    paymentMethodName?: string
    paymentMethodAccountNumber: string
    senderAccount: string
    proofUrl: string | null
    proofFileName: string | null
    studentNotes: string | null
    status: PaymentRequestStatus
    rejectionReason: string | null
    createdAt: string
    updatedAt: string | null
    reviewerId: string | null
    reviewerName: string | null
}

export interface RejectPaymentRequestPayload {
    reason?: string
}
