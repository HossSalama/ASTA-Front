import { useEffect, useRef, useState, useCallback } from 'react'
import {
    TbPlayerPlay,
    TbPlayerPause,
    TbVolume,
    TbVolume2,
    TbVolume3,
    TbVolumeOff,
    TbMaximize,
    TbMinimize,
    TbRotateClockwise2,
    TbRotate2,
    TbRefresh,
    TbAlertCircle,
    TbCheck,
} from 'react-icons/tb'
import classNames from 'classnames'
import Loading from '@/components/shared/Loading'
import useTranslation from '@/utils/hooks/useTranslation'
import { useContentAccess } from '@/utils/hooks/useContentAccess'
import { formatVideoTimestamp } from '@/utils/catalog'
import { useVideoProgressTracking } from '@/utils/hooks/useVideoProgressTracking'
import ContentAccessGate from './ContentAccessGate'

interface VideoPlayerProps {
    contentId: number
    title?: string
    duration?: number | null
    courseId?: number
    autoPlay?: boolean
    initialPositionSeconds?: number
    isAlreadyCompleted?: boolean
    isEnrolled?: boolean
    onEnded?: () => void
    onTimeUpdate?: (currentTime: number, duration: number) => void
    onLessonCompleted?: (
        contentId: number,
        courseProgressPercentage?: number | null,
    ) => void
    onCourseProgressUpdated?: (newPercentage: number) => void
    onCourseFinished?: () => void
    onCourseCompleted?: () => void
    className?: string
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export const VideoPlayer = ({
    contentId,
    title,
    duration: expectedDuration,
    courseId,
    autoPlay = false,
    initialPositionSeconds,
    isAlreadyCompleted,
    isEnrolled,
    onEnded,
    onTimeUpdate,
    onLessonCompleted,
    onCourseProgressUpdated,
    onCourseFinished,
    onCourseCompleted,
    className,
}: VideoPlayerProps) => {
    const { t } = useTranslation()
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const speedMenuRef = useRef<HTMLDivElement | null>(null)
    const savedTimeRef = useRef<number>(0)
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const {
        signedUrl,
        isLoading,
        error,
        errorCode,
        data: accessData,
        refetch,
    } = useContentAccess(contentId)

    // Player state
    const [isPlaying, setIsPlaying] = useState<boolean>(false)
    const [currentTime, setCurrentTime] = useState<number>(0)
    const [duration, setDuration] = useState<number>(expectedDuration || 0)
    const [volume, setVolume] = useState<number>(1)
    const [isMuted, setIsMuted] = useState<boolean>(false)
    const [playbackRate, setPlaybackRate] = useState<number>(1)
    const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false)
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
    const [showControls, setShowControls] = useState<boolean>(true)
    const [isBuffering, setIsBuffering] = useState<boolean>(false)
    const [mediaError, setMediaError] = useState<string | null>(null)
    const [isRefreshingUrl, setIsRefreshingUrl] = useState<boolean>(false)

    // Storage key for client-side resume position
    const storageKey = `iatc_vid_pos_${contentId}`

    // Load saved timestamp from localStorage
    const getSavedPosition = useCallback(() => {
        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) {
                const parsed = parseFloat(saved)
                return !isNaN(parsed) && parsed > 0 ? parsed : 0
            }
        } catch {
            // Ignore storage errors
        }
        return 0
    }, [storageKey])

    // Save position to localStorage
    const savePosition = useCallback(
        (time: number, totalDur: number) => {
            try {
                if (totalDur > 0 && time < totalDur - 5 && time > 2) {
                    localStorage.setItem(storageKey, time.toString())
                } else if (totalDur > 0 && time >= totalDur - 5) {
                    localStorage.removeItem(storageKey)
                }
            } catch {
                // Ignore storage errors
            }
        },
        [storageKey],
    )

    // Auto-refresh signed URL if playback encounters an expired URL or network error
    const handlePlaybackError = useCallback(async () => {
        if (!videoRef.current) return
        savedTimeRef.current = videoRef.current.currentTime || currentTime
        setIsRefreshingUrl(true)
        setMediaError(
            t(
                'learning.refreshingAccess',
                'Refreshing secure playback link...',
            ),
        )

        try {
            await refetch()
            setMediaError(null)
        } catch {
            setMediaError(
                t(
                    'learning.mediaPlaybackFailed',
                    'Media playback failed. Please check your connection and retry.',
                ),
            )
        } finally {
            setIsRefreshingUrl(false)
        }
    }, [currentTime, refetch, t])

    // Resolve initial resume position and completion state
    const resolvedInitialPos =
        initialPositionSeconds !== undefined
            ? initialPositionSeconds
            : (accessData?.lastPositionSeconds ?? (isEnrolled ? 0 : getSavedPosition()))

    const resolvedIsCompleted =
        isAlreadyCompleted !== undefined
            ? isAlreadyCompleted
            : Boolean(accessData?.isCompleted)

    // Hook up automated video progress heartbeat (5s) and 90% completion
    useVideoProgressTracking({
        courseId: courseId || 0,
        contentId,
        duration: duration || expectedDuration || 0,
        initialPositionSeconds: resolvedInitialPos,
        isAlreadyCompleted: resolvedIsCompleted,
        enabled: isEnrolled !== false,
        videoRef: videoRef,
        onLessonCompleted,
        onCourseProgressUpdated,
        onCourseFinished,
        onCourseCompleted,
    })

    // When signedUrl updates, assign to video src and restore saved timestamp
    useEffect(() => {
        const video = videoRef.current
        if (!video || !signedUrl) return

        // Per doc Section 2 & 4: Only resume if > 5s and NOT completed
        const resumePos =
            resolvedIsCompleted
                ? 0
                : resolvedInitialPos > 5
                  ? resolvedInitialPos
                  : !isEnrolled
                    ? getSavedPosition()
                    : 0

        const prevTime = savedTimeRef.current || resumePos
        setMediaError(null)

        if (video.src !== signedUrl) {
            video.src = signedUrl
            video.load()

            const onLoadedData = () => {
                if (prevTime > 0 && prevTime < (video.duration || Infinity)) {
                    video.currentTime = prevTime
                }
                if (autoPlay) {
                    video.play().catch(() => {
                        // Browser autoplay policy prevented playback
                        setIsPlaying(false)
                    })
                }
            }

            video.addEventListener('loadeddata', onLoadedData, { once: true })
            return () => {
                video.removeEventListener('loadeddata', onLoadedData)
            }
        }
    }, [
        signedUrl,
        autoPlay,
        getSavedPosition,
        resolvedInitialPos,
        resolvedIsCompleted,
        isEnrolled,
    ])

    // Control visibility management
    const handleMouseMove = () => {
        setShowControls(true)
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current)
        }
        if (isPlaying && !showSpeedMenu) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false)
                setShowSpeedMenu(false)
            }, 3000)
        }
    }

    // Toggle Play/Pause
    const togglePlay = useCallback(() => {
        const video = videoRef.current
        if (!video) return
        setShowSpeedMenu(false)

        if (video.paused || video.ended) {
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
        } else {
            video.pause()
            setIsPlaying(false)
        }
    }, [])

    // Seek handlers
    const handleSeek = (seconds: number) => {
        const video = videoRef.current
        if (!video) return
        const newTime = Math.max(0, Math.min(seconds, duration))
        video.currentTime = newTime
        setCurrentTime(newTime)
        savePosition(newTime, duration)
    }

    const handleSkip = (seconds: number) => {
        const video = videoRef.current
        if (!video) return
        handleSeek(video.currentTime + seconds)
    }

    // Volume change
    const handleVolumeChange = (newVolume: number) => {
        const video = videoRef.current
        if (!video) return
        const clamped = Math.max(0, Math.min(newVolume, 1))
        video.volume = clamped
        setVolume(clamped)
        setIsMuted(clamped === 0)
    }

    // Toggle Mute
    const toggleMute = () => {
        const video = videoRef.current
        if (!video) return
        if (isMuted) {
            video.muted = false
            video.volume = volume || 0.5
            setIsMuted(false)
        } else {
            video.muted = true
            setIsMuted(true)
        }
    }

    // Playback Rate Selection
    const selectPlaybackRate = (rate: number) => {
        const video = videoRef.current
        if (!video) return
        video.playbackRate = rate
        setPlaybackRate(rate)
        setShowSpeedMenu(false)
    }

    // Close speed menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                speedMenuRef.current &&
                !speedMenuRef.current.contains(e.target as Node)
            ) {
                setShowSpeedMenu(false)
            }
        }

        if (showSpeedMenu) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showSpeedMenu])

    // Fullscreen Toggle
    const toggleFullscreen = () => {
        const container = containerRef.current
        if (!container) return

        setShowSpeedMenu(false)

        if (!document.fullscreenElement) {
            container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
        }
    }

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement))
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
        }
    }, [])

    // Keyboard Shortcuts inside player
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null
            if (
                target &&
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
            ) {
                return
            }

            if (e.code === 'Space') {
                e.preventDefault()
                togglePlay()
            } else if (e.code === 'ArrowRight') {
                e.preventDefault()
                handleSkip(5)
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault()
                handleSkip(-5)
            } else if (e.code === 'KeyM') {
                e.preventDefault()
                toggleMute()
            } else if (e.code === 'KeyF') {
                e.preventDefault()
                toggleFullscreen()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [togglePlay])

    // Video Event Listeners
    const onVideoTimeUpdate = () => {
        const video = videoRef.current
        if (!video) return
        const time = video.currentTime
        const dur = video.duration || duration
        setCurrentTime(time)
        setDuration(dur)
        onTimeUpdate?.(time, dur)
        savePosition(time, dur)
    }

    const onVideoLoadedMetadata = () => {
        const video = videoRef.current
        if (!video) return
        const dur = video.duration || expectedDuration || 0
        setDuration(dur)
    }

    const onVideoEnded = () => {
        setIsPlaying(false)
        try {
            localStorage.removeItem(storageKey)
        } catch {
            // Ignore
        }
        onEnded?.()
    }

    const VolumeIcon = isMuted || volume === 0
        ? TbVolumeOff
        : volume < 0.3
          ? TbVolume
          : volume < 0.7
            ? TbVolume2
            : TbVolume3

    // Render Access Gate for unauthorized/forbidden/not-published errors
    if (!isLoading && error && !signedUrl) {
        return (
            <div
                className={classNames(
                    'relative flex aspect-video w-full items-center justify-center overflow-hidden bg-neutral-950 text-white shadow-xl',
                    className,
                )}
            >
                <ContentAccessGate
                    errorCode={errorCode}
                    errorMessage={error}
                    courseId={courseId}
                    onRetry={refetch}
                />
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            dir="ltr"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && !showSpeedMenu && setShowControls(false)}
            className={classNames(
                'group relative flex aspect-video w-full select-none items-center justify-center overflow-hidden bg-black font-sans text-white focus:outline-none',
                className,
            )}
        >
            {/* Loading / Refreshing Overlay */}
            {(isLoading || isRefreshingUrl) && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs">
                    <Loading loading={true} />
                    <p className="mt-3 text-xs font-medium text-white/70">
                        {isRefreshingUrl
                            ? t('learning.refreshing', 'Securing stream…')
                            : t('learning.loadingVideo', 'Loading video…')}
                    </p>
                </div>
            )}

            {/* Media Error Overlay */}
            {mediaError && !isRefreshingUrl && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
                    <TbAlertCircle className="mb-2 text-4xl text-amber-400" />
                    <p className="max-w-md text-sm text-white/90">
                        {mediaError}
                    </p>
                    <button
                        type="button"
                        onClick={handlePlaybackError}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/30"
                    >
                        <TbRefresh className="text-base" />
                        {t('common.retry', 'Retry')}
                    </button>
                </div>
            )}

            {/* HTML5 Video Element (Direct streaming via R2 presigned URL; NO custom Authorization headers) */}
            <video
                ref={videoRef}
                playsInline
                preload="metadata"
                controlsList="nodownload"
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={onVideoTimeUpdate}
                onLoadedMetadata={onVideoLoadedMetadata}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onEnded={onVideoEnded}
                onError={handlePlaybackError}
                className="h-full w-full object-contain cursor-pointer"
            />

            {/* Buffering Spinner */}
            {isBuffering && !isLoading && !mediaError && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                </div>
            )}

            {/* Big Center Play Button on Pause */}
            {!isPlaying && !isLoading && !isBuffering && !mediaError && (
                <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={t('learning.play', 'Play')}
                    className="absolute z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-white shadow-2xl backdrop-blur-xs transition-transform hover:scale-110 hover:bg-primary"
                >
                    <TbPlayerPlay className="ms-1 text-3xl" />
                </button>
            )}

            {/* Bottom Controls Bar */}
            <div
                dir="ltr"
                className={classNames(
                    'absolute inset-x-0 bottom-0 z-15 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-3 pt-6 transition-opacity duration-300',
                    showControls ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
            >
                {/* Progress / Seek Bar */}
                <div className="relative mb-2 flex items-center">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        step="0.1"
                        value={currentTime}
                        onChange={(e) => handleSeek(parseFloat(e.target.value))}
                        aria-label={t('learning.seek', 'Seek')}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-primary hover:h-2 transition-all"
                        style={{
                            background: `linear-gradient(to right, #4f46e5 ${
                                duration > 0 ? (currentTime / duration) * 100 : 0
                            }%, rgba(255, 255, 255, 0.2) ${
                                duration > 0 ? (currentTime / duration) * 100 : 0
                            }%)`,
                        }}
                    />
                </div>

                {/* Control Actions Row */}
                <div className="flex items-center justify-between gap-2 text-sm">
                    {/* Left Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={togglePlay}
                            aria-label={isPlaying ? t('learning.pause', 'Pause') : t('learning.play', 'Play')}
                            className="rounded p-1 text-white/80 hover:text-white transition"
                        >
                            {isPlaying ? (
                                <TbPlayerPause className="text-xl" />
                            ) : (
                                <TbPlayerPlay className="text-xl" />
                            )}
                        </button>

                        {/* Skip 10s backward / forward */}
                        <button
                            type="button"
                            onClick={() => handleSkip(-10)}
                            aria-label="-10s"
                            className="rounded p-1 text-white/70 hover:text-white transition hidden sm:block"
                        >
                            <TbRotate2 className="text-lg" />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSkip(10)}
                            aria-label="+10s"
                            className="rounded p-1 text-white/70 hover:text-white transition hidden sm:block"
                        >
                            <TbRotateClockwise2 className="text-lg" />
                        </button>

                        {/* Volume Control */}
                        <div className="flex items-center gap-1.5 group/vol">
                            <button
                                type="button"
                                onClick={toggleMute}
                                aria-label={isMuted ? 'Unmute' : 'Mute'}
                                className="rounded p-1 text-white/80 hover:text-white transition"
                            >
                                <VolumeIcon className="text-lg" />
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                aria-label="Volume"
                                className="h-1 w-14 sm:w-18 cursor-pointer appearance-none rounded-full accent-white hover:h-1.5 transition-all"
                                style={{
                                    background: `linear-gradient(to right, #ffffff ${
                                        isMuted ? 0 : Math.round((volume || 0) * 100)
                                    }%, rgba(255, 255, 255, 0.25) ${
                                        isMuted ? 0 : Math.round((volume || 0) * 100)
                                    }%)`,
                                }}
                            />
                        </div>

                        {/* Time display */}
                        <span className="text-xs font-mono text-white/70 tabular-nums dir-ltr">
                            {formatVideoTimestamp(currentTime)} / {formatVideoTimestamp(duration)}
                        </span>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3 relative">
                        {/* Speed Selection Dropdown Menu */}
                        {showSpeedMenu && (
                            <div
                                ref={speedMenuRef}
                                className="absolute bottom-10 end-8 z-30 flex flex-col gap-0.5 min-w-[130px] rounded-xl bg-neutral-900/95 p-1.5 shadow-2xl backdrop-blur-md border border-white/10"
                            >
                                <div className="px-2.5 py-1 text-[11px] font-semibold text-white/50 border-b border-white/10 mb-1">
                                    {t('learning.playbackSpeed', 'Playback Speed')}
                                </div>
                                {PLAYBACK_RATES.map((rate) => {
                                    const active = playbackRate === rate
                                    return (
                                        <button
                                            key={rate}
                                            type="button"
                                            onClick={() => selectPlaybackRate(rate)}
                                            className={classNames(
                                                'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-start',
                                                active
                                                    ? 'bg-primary text-white font-semibold'
                                                    : 'text-white/80 hover:bg-white/10 hover:text-white',
                                            )}
                                        >
                                            <span>
                                                {rate === 1
                                                    ? `1x (${t('learning.normalSpeed', 'Normal')})`
                                                    : `${rate}x`}
                                            </span>
                                            {active && (
                                                <TbCheck className="text-sm shrink-0" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* Playback Speed Trigger Button */}
                        <button
                            type="button"
                            onClick={() => setShowSpeedMenu((prev) => !prev)}
                            aria-label="Playback speed"
                            aria-expanded={showSpeedMenu}
                            className={classNames(
                                'rounded px-2.5 py-1 text-xs font-semibold transition',
                                showSpeedMenu
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white',
                            )}
                        >
                            {playbackRate}x
                        </button>

                        {/* Fullscreen Button */}
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                            className="rounded p-1 text-white/80 hover:text-white transition"
                        >
                            {isFullscreen ? (
                                <TbMinimize className="text-lg" />
                            ) : (
                                <TbMaximize className="text-lg" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VideoPlayer
