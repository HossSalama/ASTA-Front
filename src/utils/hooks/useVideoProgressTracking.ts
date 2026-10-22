import { useEffect, useRef, useCallback } from 'react'
import type React from 'react'
import {
    apiUpdateCourseContentProgress,
    apiGetCourseContentProgress,
} from '@/services/CourseProgressService'

export interface UseVideoProgressOptions {
    courseId: number
    contentId: number
    duration: number
    initialPositionSeconds?: number
    isAlreadyCompleted?: boolean
    enabled?: boolean
    videoElement?: HTMLVideoElement | null
    videoRef?: React.RefObject<HTMLVideoElement | null>
    onLessonCompleted?: (
        contentId: number,
        courseProgressPercentage?: number | null,
    ) => void
    onCourseProgressUpdated?: (newPercentage: number) => void
    onCourseFinished?: () => void
    onCourseCompleted?: () => void
    onItemProgressUpdated?: (
        contentId: number,
        progressPercentage: number,
    ) => void
}

export type UseVideoProgressTrackingProps = UseVideoProgressOptions

export function useVideoProgressTracking({
    courseId,
    contentId,
    duration,
    initialPositionSeconds = 0,
    isAlreadyCompleted = false,
    enabled = true,
    videoElement,
    videoRef,
    onLessonCompleted,
    onCourseProgressUpdated,
    onCourseFinished,
    onCourseCompleted,
    onItemProgressUpdated,
}: UseVideoProgressOptions) {
    const internalVideoRef = useRef<HTMLVideoElement | null>(null)
    const lastReportedPosRef = useRef<number>(initialPositionSeconds)
    const isCompletedRef = useRef<boolean>(isAlreadyCompleted)
    const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Helper to fire course completion callback
    const fireCourseCompleted = useCallback(() => {
        onCourseFinished?.()
        onCourseCompleted?.()
    }, [onCourseFinished, onCourseCompleted])

    // Sync completion status ref with prop updates
    useEffect(() => {
        isCompletedRef.current = isAlreadyCompleted
    }, [isAlreadyCompleted])

    // Update lastReportedPosRef when initial position changes
    useEffect(() => {
        lastReportedPosRef.current = initialPositionSeconds
    }, [initialPositionSeconds])

    // Core progress update dispatcher (Endpoint 1: PUT /api/courses/{courseId}/contents/{contentId}/progress)
    const reportProgress = useCallback(
        async (currentTime: number) => {
            if (!enabled || !courseId || !contentId || duration <= 0) return

            // Clamp position between 0 and duration per doc Section 3
            const positionSeconds = Math.max(
                0,
                Math.min(Math.floor(currentTime), Math.floor(duration)),
            )

            // Avoid duplicate reports for same second if already completed per doc Section 6
            if (
                positionSeconds === lastReportedPosRef.current &&
                isCompletedRef.current
            ) {
                return
            }

            lastReportedPosRef.current = positionSeconds

            try {
                const res = await apiUpdateCourseContentProgress(
                    courseId,
                    contentId,
                    { positionSeconds },
                )

                if (!res || !res.status || !res.data) return

                const {
                    isCompleted,
                    courseProgressPercentage,
                    progressPercentage,
                } = res.data

                // 1. Check if lesson newly transitioned to completed (>= 90%)
                if (isCompleted && !isCompletedRef.current) {
                    isCompletedRef.current = true
                    onLessonCompleted?.(contentId, courseProgressPercentage)
                }

                // 2. Report per-item progress percentage if registered
                if (
                    progressPercentage !== undefined &&
                    progressPercentage !== null
                ) {
                    onItemProgressUpdated?.(contentId, progressPercentage)
                }

                // 3. Check if overall course progress was recalculated (non-null on newly completed)
                if (
                    courseProgressPercentage !== null &&
                    courseProgressPercentage !== undefined
                ) {
                    onCourseProgressUpdated?.(courseProgressPercentage)

                    if (courseProgressPercentage >= 100.0) {
                        fireCourseCompleted()
                    }
                }
            } catch (err) {
                console.error('Failed to report video playback progress:', err)
            }
        },
        [
            enabled,
            courseId,
            contentId,
            duration,
            onLessonCompleted,
            onItemProgressUpdated,
            onCourseProgressUpdated,
            fireCourseCompleted,
        ],
    )

    // Playback Resumption & Continue Learning Bookmark Query (Endpoint 2: GET /api/courses/{courseId}/contents/{contentId}/progress)
    useEffect(() => {
        if (!enabled || !courseId || !contentId) return

        let isSubscribed = true

        const fetchContentProgress = async () => {
            try {
                const res = await apiGetCourseContentProgress(
                    courseId,
                    contentId,
                )
                if (!isSubscribed || !res || !res.status || !res.data) return

                const {
                    lastPositionSeconds,
                    isCompleted,
                    courseProgressPercentage,
                    progressPercentage,
                } = res.data

                if (isCompleted) {
                    isCompletedRef.current = true
                }

                // Resume playback position if saved position exists (> 5s per doc Section 4) and not completed
                if (lastPositionSeconds > 5 && !isCompleted) {
                    const video =
                        videoRef?.current ||
                        videoElement ||
                        internalVideoRef.current
                    if (video && video.currentTime < 1) {
                        video.currentTime = lastPositionSeconds
                        lastReportedPosRef.current = lastPositionSeconds
                    }
                }

                if (
                    progressPercentage !== undefined &&
                    progressPercentage !== null
                ) {
                    onItemProgressUpdated?.(contentId, progressPercentage)
                }

                if (
                    courseProgressPercentage !== null &&
                    courseProgressPercentage !== undefined
                ) {
                    onCourseProgressUpdated?.(courseProgressPercentage)
                    if (courseProgressPercentage >= 100.0) {
                        fireCourseCompleted()
                    }
                }
            } catch {
                // Silently ignore if progress lookup encounters network error
            }
        }

        fetchContentProgress()

        return () => {
            isSubscribed = false
        }
    }, [
        enabled,
        courseId,
        contentId,
        videoRef,
        videoElement,
        onItemProgressUpdated,
        onCourseProgressUpdated,
        fireCourseCompleted,
    ])

    // Heartbeat Strategy (5s interval while playing, flush on pause, ended, unmount)
    useEffect(() => {
        if (!enabled) return

        const video =
            videoRef?.current || videoElement || internalVideoRef.current
        if (!video) return

        // 1. Resume playback position if saved initialPosition exists (> 5s per guide) and not completed
        if (
            initialPositionSeconds > 5 &&
            !isAlreadyCompleted &&
            video.currentTime < 1
        ) {
            video.currentTime = initialPositionSeconds
        }

        // 2. Play event -> Start 5-second interval heartbeat
        const handlePlay = () => {
            if (heartbeatTimerRef.current)
                clearInterval(heartbeatTimerRef.current)
            heartbeatTimerRef.current = setInterval(() => {
                if (!video.paused && !video.ended) {
                    reportProgress(video.currentTime)
                }
            }, 5000)
        }

        // 3. Pause & Ended events -> Flush progress immediately
        const handlePauseOrEnded = () => {
            if (heartbeatTimerRef.current)
                clearInterval(heartbeatTimerRef.current)
            reportProgress(video.currentTime)
        }

        video.addEventListener('play', handlePlay)
        video.addEventListener('pause', handlePauseOrEnded)
        video.addEventListener('ended', handlePauseOrEnded)

        // Cleanup on unmount or when contentId changes per doc Section 3
        return () => {
            if (heartbeatTimerRef.current)
                clearInterval(heartbeatTimerRef.current)
            video.removeEventListener('play', handlePlay)
            video.removeEventListener('pause', handlePauseOrEnded)
            video.removeEventListener('ended', handlePauseOrEnded)

            // Save position on exit
            if (video.currentTime > 0) {
                reportProgress(video.currentTime)
            }
        }
    }, [
        enabled,
        videoRef,
        videoElement,
        contentId,
        initialPositionSeconds,
        isAlreadyCompleted,
        reportProgress,
    ])

    return {
        videoRef: videoRef || internalVideoRef,
        reportProgress,
    }
}

// Export canonical name from documentation (Section 6) alongside tracking name
export const useVideoProgress = useVideoProgressTracking
export default useVideoProgressTracking
