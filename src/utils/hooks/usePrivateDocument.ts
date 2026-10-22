import { useState, useEffect, useCallback } from 'react'
import { apiGetAccessUrl } from '@/services/StorageService'

interface UsePrivateDocumentResult {
    accessUrl: string | null
    loading: boolean
    error: string | null
    fetchAccessUrl: () => Promise<string | null>
}

/**
 * Hook to resolve presigned GET access URLs for private documents (e.g. National ID, Certificates).
 * If objectKey is already an absolute HTTP/HTTPS URL, returns it immediately.
 * If objectKey is a private key path (e.g. 'private/documents/...'), requests a presigned access URL from the backend.
 */
export function usePrivateDocument(
    objectKey?: string | null,
    autoFetch = true,
): UsePrivateDocumentResult {
    const [accessUrl, setAccessUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAccessUrl = useCallback(async (): Promise<string | null> => {
        if (!objectKey) {
            setAccessUrl(null)
            return null
        }

        // If it's already a full HTTP(S) URL, return directly
        if (objectKey.startsWith('http://') || objectKey.startsWith('https://')) {
            setAccessUrl(objectKey)
            return objectKey
        }

        setLoading(true)
        setError(null)

        try {
            const res = await apiGetAccessUrl(objectKey)
            if (res?.status && res.data?.accessUrl) {
                setAccessUrl(res.data.accessUrl)
                return res.data.accessUrl
            } else {
                const msg = res?.message || 'Failed to generate access URL'
                setError(msg)
                return null
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            const msg =
                errorObj?.response?.data?.message ||
                errorObj.message ||
                'Error fetching document access URL'
            setError(msg)
            return null
        } finally {
            setLoading(false)
        }
    }, [objectKey])

    useEffect(() => {
        if (autoFetch && objectKey) {
            fetchAccessUrl()
        }
    }, [objectKey, autoFetch, fetchAccessUrl])

    return {
        accessUrl,
        loading,
        error,
        fetchAccessUrl,
    }
}
