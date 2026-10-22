import ApiService from './ApiService'
import type { ApiResponse } from '@/@types/api'
import type { StudentCertificateResponse } from '@/@types/courseProgress'

/**
 * ====================================================
 * Certificates API (/api/certificates)
 * ====================================================
 */

/**
 * Fetch All Earned Certificates for the Authenticated Student
 * GET /api/certificates/my
 * Returns official issued certificates once a course reaches 100% completion
 * and passing score criteria are met.
 */
export async function apiGetMyCertificates() {
    return ApiService.fetchDataWithAxios<
        ApiResponse<StudentCertificateResponse[]>
    >({
        url: '/certificates/my',
        method: 'get',
    })
}
