import { useState, useEffect } from 'react'
import { TbStar, TbStarFilled } from 'react-icons/tb'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    apiCreateCourseReview,
    apiUpdateCourseReview,
} from '@/services/CourseReviewService'
import type { CourseReviewResponse } from '@/@types/courseReview'

export interface CourseReviewModalProps {
    isOpen: boolean
    onClose: () => void
    courseId: number
    courseName?: string
    initialReview?: CourseReviewResponse | { rating: number; comment?: string | null } | null
    isEdit?: boolean
    onSuccess?: (review?: CourseReviewResponse) => void
}

const CourseReviewModal = ({
    isOpen,
    onClose,
    courseId,
    courseName,
    initialReview,
    isEdit = false,
    onSuccess,
}: CourseReviewModalProps) => {
    const { t } = useTranslation()
    const isInitiallyEditing = Boolean(isEdit || initialReview)
    const [editMode, setEditMode] = useState<boolean>(isInitiallyEditing)
    const [rating, setRating] = useState<number>(initialReview?.rating ?? 5)
    const [hoverRating, setHoverRating] = useState<number | null>(null)
    const [comment, setComment] = useState<string>(initialReview?.comment ?? '')
    const [submitting, setSubmitting] = useState<boolean>(false)

    useEffect(() => {
        if (isOpen) {
            setRating(initialReview?.rating ?? 5)
            setComment(initialReview?.comment ?? '')
            setEditMode(Boolean(isEdit || initialReview))
            setHoverRating(null)
        }
    }, [isOpen, initialReview, isEdit])

    const handleSubmit = async () => {
        if (rating < 1 || rating > 5) return

        if (comment.length > 1000) {
            toast.push(
                <Notification type="warning" title={t('common.warning', 'Warning')}>
                    {t(
                        'course.commentMaxLength',
                        'Comment cannot exceed 1000 characters.',
                    )}
                </Notification>,
            )
            return
        }

        setSubmitting(true)
        try {
            const payload = {
                rating,
                comment: comment.trim() ? comment.trim() : null,
            }

            const res = editMode
                ? await apiUpdateCourseReview(courseId, payload)
                : await apiCreateCourseReview(courseId, payload)

            if (res?.status) {
                toast.push(
                    <Notification
                        type="success"
                        title={t('common.success', 'Success')}
                    >
                        {res.message ||
                            (editMode
                                ? t(
                                      'course.reviewUpdated',
                                      'Your review has been updated.',
                                  )
                                : t(
                                      'course.reviewSubmitted',
                                      'Thank you for your review!',
                                  ))}
                    </Notification>,
                )
                onSuccess?.(res.data)
                onClose()
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
        } catch (err: any) {
            const serverMsg =
                err?.response?.data?.message ||
                err?.message ||
                t('course.reviewError', 'Failed to submit review.')

            // If user already reviewed, offer to switch to edit mode per docs Table 10
            if (
                !editMode &&
                (serverMsg.toLowerCase().includes('already reviewed') ||
                    serverMsg.toLowerCase().includes('already submitted'))
            ) {
                setEditMode(true)
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
                        {serverMsg}
                    </Notification>,
                )
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} width={480}>
            <div className="p-6">
                <h3 className="text-lg font-bold text-text-primary mb-1">
                    {editMode
                        ? t('course.editReview', 'Edit Your Review')
                        : t('course.rateCourse', 'Rate This Course')}
                </h3>
                {courseName && (
                    <p className="text-xs text-text-muted mb-4 line-clamp-1">
                        {courseName}
                    </p>
                )}

                <div className="my-5 flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-1.5" dir="ltr">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(null)}
                                className="p-1 text-3xl transition-transform hover:scale-115 focus:outline-none cursor-pointer"
                                aria-label={`${star} star`}
                            >
                                {star <= (hoverRating ?? rating) ? (
                                    <TbStarFilled className="text-amber-400" />
                                ) : (
                                    <TbStar className="text-gray-300 dark:text-gray-600" />
                                )}
                            </button>
                        ))}
                    </div>
                    <span className="text-sm font-semibold text-text-secondary">
                        {rating === 5 && t('course.rating5', 'Excellent!')}
                        {rating === 4 && t('course.rating4', 'Very Good!')}
                        {rating === 3 && t('course.rating3', 'Average')}
                        {rating === 2 && t('course.rating2', 'Poor')}
                        {rating === 1 && t('course.rating1', 'Terrible')}
                    </span>
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label
                            htmlFor="review-comment"
                            className="block text-xs font-semibold text-text-secondary"
                        >
                            {t('course.writeReviewOptional', 'Feedback (Optional)')}
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
                    <textarea
                        id="review-comment"
                        rows={4}
                        maxLength={1000}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t(
                            'course.reviewPlaceholder',
                            'Share your experience with this course, what you learned, or how it helped you...',
                        )}
                        className="w-full rounded-xl border border-border bg-surface-alt/50 p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                    />
                </div>

                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="plain"
                        size="sm"
                        disabled={submitting}
                        onClick={onClose}
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        variant="solid"
                        size="sm"
                        loading={submitting}
                        onClick={handleSubmit}
                    >
                        {editMode
                            ? t('common.saveChanges', 'Save Changes')
                            : t('course.submitReview', 'Submit Review')}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default CourseReviewModal
