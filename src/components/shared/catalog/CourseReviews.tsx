import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    TbStar,
    TbStarFilled,
    TbEdit,
    TbTrash,
    TbPlus,
    TbSearch,
    TbX,
    TbReload,
} from 'react-icons/tb'
import Rating from '@/components/shared/catalog/Rating'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Pagination from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useAuth } from '@/auth'
import { useSessionUser } from '@/store/authStore'
import {
    apiGetCourseReviews,
    apiCreateCourseReview,
    apiUpdateCourseReview,
    apiDeleteMyCourseReview,
} from '@/services/CourseReviewService'
import { formatCount, formatDate } from '@/utils/catalog'
import type { RatingBreakdownDto } from '@/@types/courseContent'
import type {
    CourseReviewResponse,
    GetCourseReviewsQueryParams,
} from '@/@types/courseReview'

interface CourseReviewsProps {
    courseId: number
    averageRating?: number | null
    ratingCount?: number | null
    ratingBreakdown?: RatingBreakdownDto | null
    isEnrolled?: boolean
    onReviewChange?: () => void
}

interface SortOption {
    value: string
    sortBy: 'date' | 'rating'
    sortOrder: 'asc' | 'desc'
    label: string
}

const CourseReviews = ({
    courseId,
    averageRating,
    ratingCount,
    ratingBreakdown,
    isEnrolled = false,
    onReviewChange,
}: CourseReviewsProps) => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const { authenticated } = useAuth()
    const currentUser = useSessionUser((state) => state.user)

    // Reviews list state
    const [reviews, setReviews] = useState<CourseReviewResponse[]>([])
    const [totalCount, setTotalCount] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState<number>(1)
    const pageSize = 5
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // Filter & Search state
    const [searchInput, setSearchInput] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [sortKey, setSortKey] = useState<string>('newest')

    // Create / Edit modal state
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
    const [selectedRating, setSelectedRating] = useState<number>(5)
    const [hoverRating, setHoverRating] = useState<number | null>(null)
    const [comment, setComment] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [isEditMode, setIsEditMode] = useState<boolean>(false)

    // Delete modal state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
    const [isDeleting, setIsDeleting] = useState<boolean>(false)

    // Sort options
    const sortOptions: SortOption[] = useMemo(
        () => [
            {
                value: 'newest',
                sortBy: 'date',
                sortOrder: 'desc',
                label: t('course.sortNewest', 'Newest first'),
            },
            {
                value: 'oldest',
                sortBy: 'date',
                sortOrder: 'asc',
                label: t('course.sortOldest', 'Oldest first'),
            },
            {
                value: 'highestRating',
                sortBy: 'rating',
                sortOrder: 'desc',
                label: t('course.sortHighestRating', 'Highest rating'),
            },
            {
                value: 'lowestRating',
                sortBy: 'rating',
                sortOrder: 'asc',
                label: t('course.sortLowestRating', 'Lowest rating'),
            },
        ],
        [t],
    )

    const currentSort = useMemo(
        () =>
            sortOptions.find((opt) => opt.value === sortKey) || sortOptions[0],
        [sortKey, sortOptions],
    )

    // Fetch reviews from backend API
    const fetchReviews = useCallback(async () => {
        if (!courseId) return
        setLoading(true)
        setErrorMsg(null)
        try {
            const params: GetCourseReviewsQueryParams = {
                pageNumber,
                pageSize,
                sortBy: currentSort.sortBy,
                sortOrder: currentSort.sortOrder,
            }
            if (searchTerm.trim()) {
                params.searchTerm = searchTerm.trim()
            }

            const res = await apiGetCourseReviews(courseId, params)
            if (res?.status && res.data) {
                setReviews(res.data.items || [])
                setTotalCount(res.data.totalCount || 0)
            } else {
                setReviews([])
                setTotalCount(0)
            }
        } catch (err: unknown) {
            const apiError = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            const message =
                apiError?.response?.data?.message ||
                apiError?.message ||
                t('course.reviewFetchError', 'Failed to load reviews.')
            setErrorMsg(message)
            setReviews([])
        } finally {
            setLoading(false)
        }
    }, [courseId, pageNumber, pageSize, currentSort, searchTerm, t])

    useEffect(() => {
        fetchReviews()
    }, [fetchReviews])

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput)
            setPageNumber(1)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchInput])

    // Check if the current logged-in user wrote a review in the loaded list
    const myReview = useMemo(() => {
        if (!currentUser?.id || !reviews.length) return null
        return reviews.find((r) => r.userId === currentUser.id) || null
    }, [currentUser?.id, reviews])

    // Breakdown calculation based on backend breakdown or current reviews / rating
    const breakdown = useMemo(() => {
        if (ratingBreakdown) {
            const stars = [
                ratingBreakdown.fiveStars,
                ratingBreakdown.fourStars,
                ratingBreakdown.threeStars,
                ratingBreakdown.twoStars,
                ratingBreakdown.oneStar,
            ]
            return stars.map((item, index) => {
                const star = item?.star ?? 5 - index
                const count = item?.count ?? 0
                const percent =
                    typeof item?.percentage === 'number'
                        ? Math.round(item.percentage)
                        : 0
                return { star, count, percent }
            })
        }

        const buckets = [5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter(
                (review) => Math.round(review.rating) === star,
            ).length
            return { star, count }
        })
        const total = reviews.length || 1
        return buckets.map((bucket) => ({
            ...bucket,
            percent: Math.round((bucket.count / total) * 100),
        }))
    }, [ratingBreakdown, reviews])

    // Modal open handlers
    const openCreateModal = () => {
        if (!authenticated || !isEnrolled) return
        setSelectedRating(5)
        setComment('')
        setIsEditMode(false)
        setIsDialogOpen(true)
    }

    const openEditModal = (review: CourseReviewResponse) => {
        setSelectedRating(review.rating)
        setComment(review.comment || '')
        setIsEditMode(true)
        setIsDialogOpen(true)
    }

    // Submit review handler (Create: POST / Edit: PUT)
    const handleSubmitReview = async () => {
        if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
            toast.push(
                <Notification
                    type="warning"
                    title={t('common.warning', 'Warning')}
                >
                    {t(
                        'course.ratingValidation',
                        'Please choose a rating between 1 and 5 stars.',
                    )}
                </Notification>,
            )
            return
        }

        if (comment.length > 1000) {
            toast.push(
                <Notification
                    type="warning"
                    title={t('common.warning', 'Warning')}
                >
                    {t(
                        'course.commentMaxLength',
                        'Comment cannot exceed 1000 characters.',
                    )}
                </Notification>,
            )
            return
        }

        setIsSubmitting(true)
        try {
            const payload = {
                rating: selectedRating,
                comment: comment.trim() || null,
            }

            if (isEditMode) {
                const res = await apiUpdateCourseReview(courseId, payload)
                if (res?.status) {
                    toast.push(
                        <Notification
                            type="success"
                            title={t('common.success', 'Success')}
                        >
                            {res.message ||
                                t(
                                    'course.reviewUpdated',
                                    'Your review has been updated.',
                                )}
                        </Notification>,
                    )
                    setIsDialogOpen(false)
                    fetchReviews()
                    onReviewChange?.()
                } else {
                    toast.push(
                        <Notification
                            type="danger"
                            title={t('common.error', 'Error')}
                        >
                            {res?.message ||
                                t(
                                    'course.reviewError',
                                    'Failed to update review.',
                                )}
                        </Notification>,
                    )
                }
            } else {
                const res = await apiCreateCourseReview(courseId, payload)
                if (res?.status) {
                    toast.push(
                        <Notification
                            type="success"
                            title={t('common.success', 'Success')}
                        >
                            {res.message ||
                                t(
                                    'course.reviewSubmitted',
                                    'Thank you for your review!',
                                )}
                        </Notification>,
                    )
                    setIsDialogOpen(false)
                    setPageNumber(1)
                    fetchReviews()
                    onReviewChange?.()
                } else {
                    toast.push(
                        <Notification
                            type="danger"
                            title={t('common.error', 'Error')}
                        >
                            {res?.message ||
                                t(
                                    'course.reviewError',
                                    'Failed to submit review.',
                                )}
                        </Notification>,
                    )
                }
            }
        } catch (err: unknown) {
            const apiError = err as {
                response?: {
                    data?: {
                        message?: string
                        data?: { errors?: Record<string, string[]> }
                    }
                }
                message?: string
            }
            const validationErrors =
                apiError?.response?.data?.data?.errors
            let message =
                apiError?.response?.data?.message ||
                apiError?.message ||
                t(
                    'course.reviewError',
                    'Failed to submit review. Please try again.',
                )

            if (validationErrors) {
                const detailed = Object.values(validationErrors)
                    .flat()
                    .join(' ')
                if (detailed) {
                    message = detailed
                }
            }

            if (
                !isEditMode &&
                (message.toLowerCase().includes('already reviewed') ||
                    message.toLowerCase().includes('already submitted'))
            ) {
                setIsEditMode(true)
                toast.push(
                    <Notification type="info" title={t('common.info', 'Info')}>
                        {t(
                            'course.alreadyReviewedSwitchToEdit',
                            'You have already reviewed this course. You can update your existing review now.',
                        )}
                    </Notification>,
                )
            } else {
                toast.push(
                    <Notification type="danger" title={t('common.error', 'Error')}>
                        {message}
                    </Notification>,
                )
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    // Delete review handler (DELETE /api/courses/{id}/reviews)
    const handleDeleteReview = async () => {
        setIsDeleting(true)
        try {
            const res = await apiDeleteMyCourseReview(courseId)
            if (res?.status) {
                toast.push(
                    <Notification
                        type="success"
                        title={t('common.success', 'Success')}
                    >
                        {res.message ||
                            t(
                                'course.reviewDeleted',
                                'Your review has been deleted.',
                            )}
                    </Notification>,
                )
                setDeleteDialogOpen(false)
                fetchReviews()
                onReviewChange?.()
            } else {
                toast.push(
                    <Notification
                        type="danger"
                        title={t('common.error', 'Error')}
                    >
                        {res?.message ||
                            t(
                                'course.reviewDeleteError',
                                'Failed to delete review.',
                            )}
                    </Notification>,
                )
            }
        } catch (err: unknown) {
            const apiError = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            const message =
                apiError?.response?.data?.message ||
                apiError?.message ||
                t('course.reviewDeleteError', 'Failed to delete review.')
            toast.push(
                <Notification type="danger" title={t('common.error', 'Error')}>
                    {message}
                </Notification>,
            )
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <section
            aria-labelledby="reviews-heading"
            className="border-t border-border pt-8"
        >
            {/* Reviews Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2
                        id="reviews-heading"
                        className="text-xl font-bold tracking-tight text-text-primary"
                    >
                        {t('course.reviews', 'Learner reviews')}
                    </h2>
                    <p className="mt-0.5 text-sm text-text-secondary">
                        {t('course.reviewsCount', {
                            defaultValue: '{{count}} reviews',
                            count: ratingCount || totalCount,
                        })}
                    </p>
                </div>

                {myReview ? (
                    <div className="flex items-center gap-2">
                        <Button
                            icon={<TbEdit />}
                            size="sm"
                            variant="plain"
                            onClick={() => openEditModal(myReview)}
                        >
                            {t('course.editReview', 'Edit your review')}
                        </Button>
                        <Button
                            className="text-danger hover:text-danger"
                            icon={<TbTrash />}
                            size="sm"
                            variant="plain"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            {t('course.deleteReview', 'Delete')}
                        </Button>
                    </div>
                ) : authenticated && isEnrolled ? (
                    <Button
                        icon={<TbPlus />}
                        size="sm"
                        variant="solid"
                        onClick={openCreateModal}
                    >
                        {t('course.writeReview', 'Write a review')}
                    </Button>
                ) : null}
            </div>

            {/* Rating breakdown */}
            <div className="mt-5 flex flex-col gap-6 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:items-center">
                <div className="shrink-0 text-center sm:w-40">
                    <p className="text-4xl font-bold tracking-tight text-text-primary">
                        {(averageRating || 0).toFixed(1)}
                    </p>
                    <Rating
                        className="mt-1 justify-center"
                        count={ratingCount || totalCount}
                        showCount={false}
                        value={averageRating || 0}
                    />
                    <p className="mt-1 text-xs text-text-secondary">
                        {t('course.basedOn', {
                            defaultValue: 'Based on {{count}} ratings',
                            count: ratingCount || totalCount,
                        })}
                    </p>
                </div>
                <ul className="min-w-0 flex-1 space-y-1.5">
                    {breakdown.map((bucket) => (
                        <li
                            key={bucket.star}
                            className="flex items-center gap-3 text-xs text-text-secondary"
                        >
                            <span className="w-10 shrink-0">
                                {formatCount(bucket.star, lang)}★
                            </span>
                            <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-alt">
                                <span
                                    className="block h-full rounded-full bg-secondary"
                                    style={{
                                        width: `${bucket.percent}%`,
                                    }}
                                />
                            </span>
                            <span className="w-10 shrink-0 text-end">
                                {bucket.percent}%
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Filters Bar: Search & Sort */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Input
                        placeholder={t(
                            'courseReviewManagement.searchPlaceholder',
                            'Search reviews by comment...',
                        )}
                        prefix={<TbSearch className="text-base text-gray-400" />}
                        size="sm"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    {searchInput && (
                        <button
                            className="absolute inset-y-0 end-2 flex items-center px-1 text-gray-400 hover:text-gray-600"
                            type="button"
                            onClick={() => setSearchInput('')}
                        >
                            <TbX className="text-sm" />
                        </button>
                    )}
                </div>

                <div className="w-full sm:w-56">
                    <Select<SortOption>
                        options={sortOptions}
                        size="sm"
                        value={currentSort}
                        onChange={(opt) => {
                            if (opt) {
                                setSortKey(opt.value)
                                setPageNumber(1)
                            }
                        }}
                    />
                </div>
            </div>

            {/* Reviews Loading State */}
            {loading && (
                <div className="mt-6 space-y-4">
                    {[1, 2, 3].map((n) => (
                        <div
                            key={n}
                            className="animate-pulse flex gap-4 py-5 border-b border-border"
                        >
                            <div className="h-10 w-10 rounded-full bg-surface-alt shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 bg-surface-alt rounded" />
                                <div className="h-3 w-20 bg-surface-alt rounded" />
                                <div className="h-4 w-3/4 bg-surface-alt rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reviews Error State */}
            {!loading && errorMsg && (
                <div className="mt-6 flex flex-col items-center justify-center p-6 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50/50 dark:bg-red-950/20 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                        {errorMsg}
                    </p>
                    <Button
                        icon={<TbReload />}
                        size="xs"
                        variant="default"
                        onClick={fetchReviews}
                    >
                        {t('common.retry', 'Retry')}
                    </Button>
                </div>
            )}

            {/* Review List */}
            {!loading && !errorMsg && reviews.length > 0 && (
                <ul className="mt-6 divide-y divide-border">
                    {reviews.map((review) => {
                        const isOwnReview =
                            Boolean(currentUser?.id) &&
                            currentUser?.id === review.userId

                        return (
                            <li key={review.id} className="flex gap-4 py-5">
                                {review.userImage ? (
                                    <img
                                        alt=""
                                        className="h-10 w-10 shrink-0 rounded-full object-cover border border-border"
                                        loading="lazy"
                                        src={review.userImage}
                                    />
                                ) : (
                                    <span
                                        aria-hidden="true"
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt text-sm font-bold text-text-secondary border border-border"
                                    >
                                        {(review.userName || '?').charAt(0)}
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span
                                                className="text-sm font-semibold text-text-primary"
                                                dir="auto"
                                            >
                                                {review.userName}
                                            </span>
                                            {isOwnReview && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-primary-subtle text-primary">
                                                    {t('course.you', 'You')}
                                                </span>
                                            )}
                                            {review.createdAt && (
                                                <span className="text-xs text-text-muted">
                                                    {formatDate(
                                                        review.createdAt,
                                                        lang,
                                                    )}
                                                </span>
                                            )}
                                            {review.updatedAt && (
                                                <span className="text-[11px] text-text-muted italic">
                                                    ({t('course.edited', 'edited')})
                                                </span>
                                            )}
                                        </div>
                                        {isOwnReview && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                                    type="button"
                                                    onClick={() =>
                                                        openEditModal(review)
                                                    }
                                                >
                                                    <TbEdit />
                                                    {t('common.edit', 'Edit')}
                                                </button>
                                                <button
                                                    className="text-xs font-semibold text-danger hover:underline flex items-center gap-1"
                                                    type="button"
                                                    onClick={() =>
                                                        setDeleteDialogOpen(true)
                                                    }
                                                >
                                                    <TbTrash />
                                                    {t('common.delete', 'Delete')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <Rating
                                        className="mt-1"
                                        count={1}
                                        showCount={false}
                                        value={review.rating}
                                    />
                                    {review.comment && (
                                        <p
                                            className="mt-2 text-sm leading-6 text-text-secondary whitespace-pre-line"
                                            dir="auto"
                                        >
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}

            {/* Empty State */}
            {!loading && !errorMsg && reviews.length === 0 && (
                <div className="mt-8 text-center py-10 border border-dashed border-border rounded-lg bg-surface/50">
                    <p className="text-sm text-text-muted">
                        {searchTerm
                            ? t(
                                  'course.noReviewsMatchSearch',
                                  'No reviews match your search term.',
                              )
                            : t(
                                  'course.noReviewsYet',
                                  'No reviews yet for this course. Be the first to share your thoughts!',
                              )}
                    </p>
                    {authenticated && isEnrolled && !myReview && !searchTerm && (
                        <div className="mt-4">
                            <Button
                                icon={<TbPlus />}
                                size="sm"
                                variant="solid"
                                onClick={openCreateModal}
                            >
                                {t('course.writeReview', 'Write a review')}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalCount > pageSize && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                    <span className="text-xs text-text-secondary">
                        {t('course.showingReviewsCount', {
                            defaultValue:
                                'Showing {{start}} to {{end}} of {{total}} reviews',
                            start: (pageNumber - 1) * pageSize + 1,
                            end: Math.min(pageNumber * pageSize, totalCount),
                            total: totalCount,
                        })}
                    </span>
                    <Pagination
                        currentPage={pageNumber}
                        pageSize={pageSize}
                        total={totalCount}
                        onChange={(page) => setPageNumber(page)}
                    />
                </div>
            )}

            {/* Create / Edit Review Dialog */}
            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onRequestClose={() => setIsDialogOpen(false)}
            >
                <div className="p-4 sm:p-6">
                    <h3 className="text-lg font-bold text-text-primary">
                        {isEditMode
                            ? t('course.editReview', 'Edit your review')
                            : t('course.writeReview', 'Write a review')}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                        {t(
                            'course.reviewInstructions',
                            'Select your star rating and write an optional comment about your learning experience.',
                        )}
                    </p>

                    <div className="mt-6">
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                            {t('course.yourRating', 'Your Rating')} *
                        </label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => {
                                const activeStar =
                                    (hoverRating ?? selectedRating) >= star
                                return (
                                    <button
                                        key={star}
                                        className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                                        type="button"
                                        onClick={() => setSelectedRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(null)}
                                    >
                                        {activeStar ? (
                                            <TbStarFilled className="text-amber-400" />
                                        ) : (
                                            <TbStar className="text-text-muted" />
                                        )}
                                    </button>
                                )
                            })}
                            <span className="ms-2 text-sm font-semibold text-text-primary">
                                {hoverRating ?? selectedRating} / 5
                            </span>
                        </div>
                    </div>

                    <div className="mt-5">
                        <div className="flex items-center justify-between mb-2">
                            <label
                                className="block text-sm font-semibold text-text-primary"
                                htmlFor="review-comment"
                            >
                                {t(
                                    'course.yourComment',
                                    'Review Comment (Optional)',
                                )}
                            </label>
                            <span
                                className={`text-xs ${
                                    comment.length > 1000
                                        ? 'text-danger font-semibold'
                                        : 'text-text-muted'
                                }`}
                            >
                                {comment.length} / 1000
                            </span>
                        </div>
                        <Input
                            textArea
                            id="review-comment"
                            maxLength={1000}
                            placeholder={t(
                                'course.commentPlaceholder',
                                'What did you like or dislike about this course?',
                            )}
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <Button
                            disabled={isSubmitting}
                            variant="plain"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            loading={isSubmitting}
                            variant="solid"
                            onClick={handleSubmitReview}
                        >
                            {isEditMode
                                ? t('common.saveChanges', 'Save Changes')
                                : t('course.submitReview', 'Submit Review')}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                confirmButtonProps={{ loading: isDeleting }}
                isOpen={deleteDialogOpen}
                title={t(
                    'courseReviewManagement.confirmDeleteTitle',
                    'Confirm Review Deletion',
                )}
                type="danger"
                onCancel={() => setDeleteDialogOpen(false)}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteReview}
                onRequestClose={() => setDeleteDialogOpen(false)}
            >
                <p className="text-sm text-text-secondary">
                    {t(
                        'course.deleteReviewConfirm',
                        'Are you sure you want to delete your review? This action cannot be undone.',
                    )}
                </p>
            </ConfirmDialog>
        </section>
    )
}

export default CourseReviews
