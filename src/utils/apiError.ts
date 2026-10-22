import type { ApiResponse } from '@/@types/api'

interface ErrorWithResponse {
    response?: {
        data?: ApiResponse<any> | Record<string, any>
        status?: number
    }
    message?: string
}

/**
 * Extracts a user-facing error message from an API response, AxiosError, or unknown error.
 * Handles the backend's unified envelope `ApiResponse`, FluentValidation errors dictionary,
 * ASP.NET model binding failures, and standard HTTP error payloads.
 */
export function extractApiErrorMessage(
    errorOrResponse: unknown,
    fallbackMessage = 'An unexpected error occurred. Please try again.',
): string {
    if (!errorOrResponse) {
        return fallbackMessage
    }

    // 1. Direct ApiResponse object with status === false
    const apiResp = errorOrResponse as ApiResponse<any>
    if (typeof apiResp === 'object' && 'status' in apiResp && apiResp.status === false) {
        // Check if data contains validation errors map
        const errorData = apiResp.data as { errors?: Record<string, string[]> } | null
        if (errorData?.errors && typeof errorData.errors === 'object') {
            const errorKeys = Object.keys(errorData.errors)
            if (errorKeys.length > 0) {
                const firstKey = errorKeys[0]
                const fieldErrors = errorData.errors[firstKey]
                if (Array.isArray(fieldErrors) && fieldErrors.length > 0 && fieldErrors[0]) {
                    return fieldErrors[0]
                }
            }
        }
        if (apiResp.message) {
            return apiResp.message
        }
    }

    // 2. AxiosError or Error object with .response.data
    const err = errorOrResponse as ErrorWithResponse
    if (err.response?.data) {
        const data = err.response.data as Record<string, any>

        // Check if response data has data.errors
        const nestedErrors = data.data?.errors || data.errors
        if (nestedErrors && typeof nestedErrors === 'object') {
            const errorKeys = Object.keys(nestedErrors)
            if (errorKeys.length > 0) {
                const firstKey = errorKeys[0]
                const fieldErrors = nestedErrors[firstKey]
                if (Array.isArray(fieldErrors) && fieldErrors.length > 0 && fieldErrors[0]) {
                    return fieldErrors[0]
                }
            }
        }

        if (typeof data.message === 'string' && data.message.trim().length > 0) {
            return data.message
        }

        if (typeof data.title === 'string' && data.title.trim().length > 0) {
            return data.title
        }
    }

    // 3. Plain Error instance message
    if (typeof err.message === 'string' && err.message.trim().length > 0 && !err.message.includes('[object Object]')) {
        return err.message
    }

    return fallbackMessage
}
