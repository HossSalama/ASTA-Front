import { useState, useEffect, useCallback } from 'react'
import { apiGetCourseContentAccess } from '@/services/CourseContentService'
import type { ContentAccessResponse } from '@/@types/courseContent'

export type ContentAccessErrorCode =
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'NOT_PUBLISHED'
    | 'DELIVERY_FAILED'
    | 'FILE_INTEGRITY_ERROR'
    | 'UNKNOWN_ERROR'

export interface UseContentAccessResult {
    signedUrl: string | null
    expiresAt: string | null
    isLoading: boolean
    error: string | null
    errorCode: ContentAccessErrorCode | null
    data: ContentAccessResponse | null
    refetch: () => Promise<void>
}

/**
 * Custom hook to authorize and retrieve a temporary Cloudflare R2 presigned URL
 * for video streaming or resource file downloading.
 *
 * Calls GET /api/course-content/{contentId}/access.
 * - If user is logged in, Bearer token is automatically attached.
 * - If user is a guest / unauthenticated, works seamlessly for `isPreview: true` items.
 * - Handles 401 Unauthorized (Prompt login), 403 Forbidden (Prompt enrollment),
 *   400 BadRequest (Unpublished content), and expired signed URLs.
 */
export function useContentAccess(
    contentId: number | null | undefined,
): UseContentAccessResult {
    const [signedUrl, setSignedUrl] = useState<string | null>(null)
    const [expiresAt, setExpiresAt] = useState<string | null>(null)
    const [data, setData] = useState<ContentAccessResponse | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [errorCode, setErrorCode] = useState<ContentAccessErrorCode | null>(
        null,
    )

    const fetchAccessUrl = useCallback(async () => {
        if (!contentId || contentId <= 0) {
            setSignedUrl(null)
            setExpiresAt(null)
            setData(null)
            setIsLoading(false)
            setError(null)
            setErrorCode(null)
            return
        }

        setIsLoading(true)
        setError(null)
        setErrorCode(null)

        try {
            const response = await apiGetCourseContentAccess(contentId)

            if (
                (response?.status || (response as any)?.isSuccess) &&
                response?.data?.accessGranted &&
                response?.data?.delivery?.url
            ) {
                setSignedUrl(response.data.delivery.url)
                setExpiresAt(response.data.delivery.expiresAt)
                setData(response.data)
                setError(null)
                setErrorCode(null)
            } else {
                setSignedUrl(null)
                setExpiresAt(null)
                setData(response?.data || null)
                const msg =
                    response?.message ||
                    'Access was not granted for this content.'
                setError(msg)

                const isAuthError =
                    msg.toLowerCase().includes('authentication') ||
                    msg.toLowerCase().includes('unauthorized') ||
                    msg.toLowerCase().includes('sign in') ||
                    msg.toLowerCase().includes('login') ||
                    (response as any)?.errorCode === 'UNAUTHORIZED' ||
                    (response?.data as any)?.errorCode === 'UNAUTHORIZED'

                if (isAuthError) {
                    setErrorCode('UNAUTHORIZED')
                } else {
                    setErrorCode('FORBIDDEN')
                }
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: {
                    status?: number
                    data?: {
                        message?: string
                        errorCode?: string
                    }
                }
                message?: string
            }

            const status = errorObj.response?.status
            const serverMessage = errorObj.response?.data?.message

            setSignedUrl(null)
            setExpiresAt(null)
            setData(null)

            if (status === 401) {
                setErrorCode('UNAUTHORIZED')
                setError(
                    serverMessage ||
                        'Please log in to view this course content.',
                )
            } else if (status === 403) {
                setErrorCode('FORBIDDEN')
                setError(
                    serverMessage ||
                        'You must be enrolled in this course to access this lesson.',
                )
            } else if (status === 404) {
                setErrorCode('NOT_FOUND')
                setError(
                    serverMessage || 'Content item could not be found.',
                )
            } else if (status === 400) {
                setErrorCode('NOT_PUBLISHED')
                setError(
                    serverMessage ||
                        'This lesson is currently not published or available.',
                )
            } else {
                setErrorCode('UNKNOWN_ERROR')
                setError(
                    serverMessage ||
                        errorObj.message ||
                        'Failed to load content access URL.',
                )
            }
        } finally {
            setIsLoading(false)
        }
    }, [contentId])

    useEffect(() => {
        fetchAccessUrl()
    }, [fetchAccessUrl])

    return {
        signedUrl,
        expiresAt,
        isLoading,
        error,
        errorCode,
        data,
        refetch: fetchAccessUrl,
    }
}

export default useContentAccess
