import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Spinner from '@/components/ui/Spinner'
import Progress from '@/components/ui/Progress'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import classNames from 'classnames'
import {
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineSparkles,
    HiOutlineAcademicCap,
    HiOutlineExclamationTriangle,
    HiOutlineCheck,
    HiOutlineXMark,
    HiOutlineArrowPath,
    HiOutlineArrowRight,
    HiOutlineInformationCircle,
    HiOutlineLockClosed,
} from 'react-icons/hi2'
import {
    apiGetStudentQuiz,
    apiSubmitQuiz,
} from '@/services/QuizService'
import type {
    StudentQuizResponse,
    StudentQuizQuestion,
    StudentQuizOption,
    QuizEvaluationResponse,
} from '@/@types/quiz'

interface QuizPlayerProps {
    contentId: number
    courseId?: number
    title?: string
    hideTitle?: boolean
    onQuizCompleted?: (result: QuizEvaluationResponse | StudentQuizResponse) => void
    onNextLesson?: () => void
    hasNextLesson?: boolean
}

export const QuizPlayer = ({
    contentId,
    courseId,
    title: initialTitle,
    hideTitle = false,
    onQuizCompleted,
    onNextLesson,
    hasNextLesson,
}: QuizPlayerProps) => {
    const { t, i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'

    // Loading and error states
    const [loading, setLoading] = useState<boolean>(true)
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [submitError, setSubmitError] = useState<string | null>(null)

    // Quiz data
    const [quiz, setQuiz] = useState<StudentQuizResponse | null>(null)
    const [recentEvaluation, setRecentEvaluation] = useState<QuizEvaluationResponse | null>(null)

    // Selected answers in Take mode: map of questionId -> selectedOptionId
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})

    // Confirmation modal state
    const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false)

    // Fetch quiz data
    const loadQuiz = useCallback(async () => {
        if (!contentId) return
        setLoading(true)
        setFetchError(null)
        try {
            const res = await apiGetStudentQuiz(contentId)
            if (res && (res.status || res.isSuccess) && res.data) {
                setQuiz(res.data)
                // If the quiz is in Review mode and has question states, prefill selected answers
                if (res.data.mode === 'Review' && res.data.questions) {
                    const prefilled: Record<number, number> = {}
                    res.data.questions.forEach((q) => {
                        if (q.selectedOptionId != null) {
                            prefilled[q.id] = q.selectedOptionId
                        }
                    })
                    setSelectedAnswers(prefilled)
                }
            } else {
                setFetchError(res?.message || t('quiz.loadFailed', 'Failed to load quiz.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            const msg =
                errorObj?.response?.data?.message ||
                errorObj?.message ||
                t('quiz.loadFailed', 'Failed to load quiz.')
            setFetchError(msg)
        } finally {
            setLoading(false)
        }
    }, [contentId, t])

    useEffect(() => {
        loadQuiz()
    }, [loadQuiz])

    // Handling choice selection
    const handleSelectOption = (questionId: number, optionId: number) => {
        if (quiz?.mode === 'Review' || submitting) return
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: optionId,
        }))
    }

    // Submit handler
    const handleConfirmSubmit = async () => {
        if (!quiz || !contentId || submitting) return
        setConfirmModalOpen(false)
        setSubmitting(true)
        setSubmitError(null)

        const payload = {
            answers: (quiz.questions || []).map((q) => ({
                questionId: q.id,
                selectedOptionId: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : null,
            })),
        }

        try {
            const res = await apiSubmitQuiz(contentId, payload)
            if (res && (res.status || res.isSuccess) && res.data) {
                setRecentEvaluation(res.data)
                // Reload full quiz to enter authoritative Review mode from server
                await loadQuiz()
                onQuizCompleted?.(res.data)
            } else {
                setSubmitError(res?.message || t('quiz.submitFailed', 'Failed to submit quiz.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            const msg =
                errorObj?.response?.data?.message ||
                errorObj?.message ||
                t('quiz.submitFailed', 'Failed to submit quiz.')
            setSubmitError(msg)
        } finally {
            setSubmitting(false)
        }
    }

    const totalQuestions = quiz?.totalQuestions ?? quiz?.questions?.length ?? 0
    const answeredCount = useMemo(() => {
        return Object.keys(selectedAnswers).length
    }, [selectedAnswers])

    // ==========================================
    // Render: Loading State
    // ==========================================
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[420px] p-8 text-center">
                <Spinner size={44} className="text-primary mb-4" />
                <p className="text-sm font-medium text-text-secondary">
                    {t('quiz.loadingQuiz', 'Loading assessment questions...')}
                </p>
            </div>
        )
    }

    // ==========================================
    // Render: Error State
    // ==========================================
    if (fetchError || !quiz) {
        return (
            <div className="max-w-2xl mx-auto my-12 p-6 rounded-2xl border border-border bg-surface text-center shadow-sm">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-2xl">
                    <HiOutlineExclamationTriangle />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                    {t('quiz.unableToLoad', 'Unable to Load Assessment')}
                </h3>
                <p className="text-sm text-text-secondary mb-6">
                    {fetchError}
                </p>
                <Button
                    variant="solid"
                    size="sm"
                    icon={<HiOutlineArrowPath />}
                    onClick={loadQuiz}
                >
                    {t('quiz.retry', 'Retry')}
                </Button>
            </div>
        )
    }

    // ==========================================
    // Render: Empty Questions State
    // ==========================================
    if (!quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl border border-dashed border-border bg-surface-alt/40 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-2xl">
                    <HiOutlineInformationCircle />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                    {t('quiz.noQuestionsTitle', 'No Questions Published Yet')}
                </h3>
                <p className="text-sm text-text-secondary mb-6">
                    {t('quiz.noQuestionsDesc', 'The instructor has not added questions to this quiz yet. Please check back later.')}
                </p>
                {hasNextLesson && onNextLesson && (
                    <Button variant="solid" size="sm" onClick={onNextLesson}>
                        {t('learning.nextLesson', 'Continue to Next Lesson')}
                    </Button>
                )}
            </div>
        )
    }

    const isReviewMode = quiz.mode === 'Review'
    const evalData = quiz.evaluation || recentEvaluation
    const passed = evalData ? evalData.passed : false
    const score = evalData ? Math.round(evalData.scorePercentage) : 0
    const passingScore = quiz.passingScore ?? 70

    // Certificate eligibility check
    const isCertificateEligible =
        passed &&
        (quiz.courseProgressPercentage >= 100 || (recentEvaluation && recentEvaluation.courseProgressPercentage >= 100))

    return (
        <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:px-6">
            {/* Header Card */}
            <div className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    {!hideTitle ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary text-xl">
                                <HiOutlineAcademicCap />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                    {isReviewMode
                                        ? t('quiz.reviewModeBadge', 'Assessment Results')
                                        : t('quiz.assessmentBadge', 'Course Assessment')}
                                </span>
                                <h2 className="text-xl font-bold text-text-primary">
                                    {quiz.title || initialTitle}
                                </h2>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {isReviewMode && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                    {t('quiz.reviewModeBadge', 'Assessment Results')}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-alt border border-border text-text-secondary">
                            {totalQuestions} {t('quiz.questionsCount', 'Questions')}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
                            {t('quiz.passingScoreLabel', 'Pass Score')}: {passingScore}%
                        </span>
                    </div>
                </div>

                {/* Sub-header instruction / attempt advisory */}
                {!isReviewMode ? (
                    <div className="mt-4 flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
                        <HiOutlineLockClosed className="text-base shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div>
                            <span className="font-semibold block mb-0.5">
                                {t('quiz.singleAttemptWarningTitle', 'Single Attempt Assessment')}
                            </span>
                            <span>
                                {t(
                                    'quiz.singleAttemptWarningDesc',
                                    'You have strictly 1 attempt for this assessment. Answer each question carefully before submitting.',
                                )}
                            </span>
                        </div>
                    </div>
                ) : (
                    evalData && (
                        /* Review Summary Banner */
                        <div className="mt-5 space-y-4">
                            <div
                                className={classNames(
                                    'p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                                    passed
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                                        : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200',
                                )}
                            >
                                <div className="flex items-center gap-3.5">
                                    {passed ? (
                                        <HiOutlineCheckCircle className="text-3xl text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    ) : (
                                        <HiOutlineXCircle className="text-3xl text-rose-600 dark:text-rose-400 shrink-0" />
                                    )}
                                    <div>
                                        <h4 className="text-base font-bold text-text-primary">
                                            {passed
                                                ? t('quiz.passedCongratulations', 'Congratulations! You Passed!')
                                                : t('quiz.notPassedNotice', 'Assessment Completed - Not Passed')}
                                        </h4>
                                        <p className="text-xs text-text-secondary mt-0.5">
                                            {t('quiz.scored', 'You achieved')}{' '}
                                            <span className="font-bold text-text-primary">{score}%</span>{' '}
                                            ({evalData.correctAnswersCount}/{evalData.totalQuestionsCount}{' '}
                                            {t('quiz.correct', 'correct')}) · {t('quiz.required', 'Required')}: {passingScore}%
                                        </p>
                                    </div>
                                </div>

                                <div className="text-end shrink-0">
                                    <div
                                        className={classNames(
                                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                                            passed
                                                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-300',
                                        )}
                                    >
                                        {passed ? t('quiz.passed', 'Passed') : t('quiz.failed', 'Failed')}
                                    </div>
                                    {evalData.submittedAt && (
                                        <span className="block text-[11px] text-text-muted mt-1">
                                            {dayjs(evalData.submittedAt).format('MMM D, YYYY h:mm A')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Certificate Banner if finished entire course */}
                            {isCertificateEligible && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <HiOutlineSparkles className="text-2xl text-primary shrink-0" />
                                        <div>
                                            <h5 className="text-sm font-bold text-text-primary">
                                                {t('quiz.certificateReadyTitle', 'Certificate of Completion Ready!')}
                                            </h5>
                                            <p className="text-xs text-text-secondary">
                                                {t('quiz.certificateReadyDesc', 'You have completed all course requirements and earned your verified certificate.')}
                                            </p>
                                        </div>
                                    </div>
                                    <Link to="/certificates">
                                        <Button size="sm" variant="solid">
                                            {t('quiz.viewCertificate', 'View Certificate')}
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>

            {/* Error banner upon submission */}
            {submitError && (
                <Alert type="danger" showIcon className="mb-6">
                    {submitError}
                </Alert>
            )}

            {/* Progress counter in Take mode */}
            {!isReviewMode && (
                <div className="mb-6 flex items-center justify-between text-xs text-text-secondary">
                    <span>
                        {t('quiz.answeredProgress', 'Answered')}:{' '}
                        <strong className="text-text-primary">
                            {answeredCount}/{totalQuestions}
                        </strong>
                    </span>
                    <span>
                        {Math.round((answeredCount / totalQuestions) * 100)}%
                    </span>
                </div>
            )}

            {/* Questions List */}
            <div className="space-y-6">
                {quiz.questions.map((question: StudentQuizQuestion, qIdx: number) => {
                    const studentChoiceId = selectedAnswers[question.id] ?? question.selectedOptionId
                    const isQuestionAnswered = studentChoiceId !== undefined && studentChoiceId !== null
                    const isQuestionCorrect = isReviewMode ? question.isCorrect : undefined

                    return (
                        <div
                            key={question.id}
                            className={classNames(
                                'rounded-2xl border p-5 sm:p-6 transition-all bg-surface shadow-xs',
                                isReviewMode
                                    ? isQuestionCorrect
                                        ? 'border-emerald-500/40 ring-1 ring-emerald-500/10'
                                        : 'border-rose-500/40 ring-1 ring-rose-500/10'
                                    : isQuestionAnswered
                                      ? 'border-primary/50 shadow-sm ring-1 ring-primary/20'
                                      : 'border-border',
                            )}
                        >
                            {/* Question Header */}
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex items-start gap-3">
                                    <span
                                        className={classNames(
                                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                                            isReviewMode
                                                ? isQuestionCorrect
                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                                : isQuestionAnswered
                                                  ? 'bg-primary text-white'
                                                  : 'bg-surface-alt text-text-muted border border-border',
                                        )}
                                    >
                                        {qIdx + 1}
                                    </span>
                                    <h3 className="text-base font-semibold text-text-primary leading-relaxed pt-0.5">
                                        {question.questionText}
                                    </h3>
                                </div>

                                {isReviewMode && (
                                    <div className="shrink-0">
                                        {isQuestionCorrect ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                                                <HiOutlineCheck className="text-sm" />
                                                {t('quiz.correct', 'Correct')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400">
                                                <HiOutlineXMark className="text-sm" />
                                                {isQuestionAnswered
                                                    ? t('quiz.incorrect', 'Incorrect')
                                                    : t('quiz.unanswered', 'Skipped')}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Options List */}
                            <div className="space-y-2.5 ps-0 sm:ps-10">
                                {question.options.map((option: StudentQuizOption) => {
                                    const isSelected = studentChoiceId === option.id
                                    const isCorrectOption = isReviewMode && (option.isCorrect || question.correctOptionId === option.id)
                                    const isStudentWrong = isReviewMode && isSelected && !isCorrectOption

                                    let optionStyles = 'border-border bg-surface-alt/40 text-text-primary hover:bg-surface-alt hover:border-text-muted/30'

                                    if (!isReviewMode) {
                                        if (isSelected) {
                                            optionStyles = 'border-primary bg-primary/10 text-primary font-medium shadow-xs ring-1 ring-primary/30'
                                        }
                                    } else {
                                        // Review Mode Styling
                                        if (isCorrectOption) {
                                            optionStyles = 'border-emerald-500/60 bg-emerald-50 text-emerald-900 font-semibold dark:bg-emerald-500/15 dark:border-emerald-500/50 dark:text-emerald-100'
                                        } else if (isStudentWrong) {
                                            optionStyles = 'border-rose-500/60 bg-rose-50 text-rose-900 dark:bg-rose-500/15 dark:border-rose-500/50 dark:text-rose-200'
                                        } else {
                                            optionStyles = 'border-border/60 bg-surface-alt/20 text-text-muted opacity-60'
                                        }
                                    }

                                    return (
                                        <div
                                            key={option.id}
                                            role={isReviewMode ? 'none' : 'button'}
                                            tabIndex={isReviewMode ? -1 : 0}
                                            onClick={() => handleSelectOption(question.id, option.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === ' ' || e.key === 'Enter') {
                                                    e.preventDefault()
                                                    handleSelectOption(question.id, option.id)
                                                }
                                            }}
                                            className={classNames(
                                                'flex items-center justify-between gap-3 p-3.5 rounded-xl border text-sm transition-all select-none',
                                                !isReviewMode && 'cursor-pointer',
                                                optionStyles,
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Indicator circle / radio */}
                                                <div
                                                    className={classNames(
                                                        'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs transition-colors',
                                                        isReviewMode
                                                            ? isCorrectOption
                                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                : isStudentWrong
                                                                  ? 'border-rose-500 bg-rose-500 text-white'
                                                                  : 'border-border bg-transparent'
                                                            : isSelected
                                                              ? 'border-primary bg-primary text-white'
                                                              : 'border-border bg-transparent',
                                                    )}
                                                >
                                                    {isReviewMode ? (
                                                        isCorrectOption ? (
                                                            <HiOutlineCheck className="text-xs stroke-3" />
                                                        ) : isStudentWrong ? (
                                                            <HiOutlineXMark className="text-xs stroke-3" />
                                                        ) : null
                                                    ) : isSelected ? (
                                                        <div className="w-2 h-2 rounded-full bg-white" />
                                                    ) : null}
                                                </div>

                                                <span className="leading-snug break-words">
                                                    {option.optionText}
                                                </span>
                                            </div>

                                            {/* Review mode badges */}
                                            {isReviewMode && (
                                                <div className="shrink-0 text-xs">
                                                    {isCorrectOption && (
                                                        <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                                                            {isSelected
                                                                ? t('quiz.yourCorrectAnswer', '✓ Your Answer (Correct)')
                                                                : t('quiz.correctAnswer', '✓ Correct Answer')}
                                                        </span>
                                                    )}
                                                    {isStudentWrong && (
                                                        <span className="text-rose-700 dark:text-rose-400 font-bold text-[11px] uppercase tracking-wider">
                                                            {t('quiz.yourWrongAnswer', '✗ Your Answer (Incorrect)')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-surface shadow-sm">
                {!isReviewMode ? (
                    <>
                        <div className="text-xs text-text-secondary text-center sm:text-start">
                            <span>
                                {answeredCount === totalQuestions
                                    ? t('quiz.allQuestionsAnswered', 'All questions answered. Ready to submit!')
                                    : t('quiz.unansweredReminder', 'Unanswered questions will count as 0 points.')}
                            </span>
                        </div>

                        <Button
                            variant="solid"
                            size="md"
                            loading={submitting}
                            icon={<HiOutlineCheckCircle />}
                            onClick={() => setConfirmModalOpen(true)}
                            className="w-full sm:w-auto"
                        >
                            {t('quiz.submitQuiz', 'Submit Assessment')}
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="text-xs text-text-secondary">
                            <span>
                                {t('quiz.reviewCompleteDesc', 'You have completed this assessment. Your score is permanently recorded.')}
                            </span>
                        </div>

                        {hasNextLesson && onNextLesson && (
                            <Button
                                variant="solid"
                                size="md"
                                icon={<HiOutlineArrowRight className={classNames(isRtl && 'rotate-180')} />}
                                onClick={onNextLesson}
                                className="w-full sm:w-auto"
                            >
                                {t('learning.nextLesson', 'Next Lesson')}
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* Submit Confirmation Modal */}
            <ConfirmDialog
                isOpen={confirmModalOpen}
                type="warning"
                title={t('quiz.confirmSubmitTitle', 'Submit Assessment?')}
                confirmText={t('quiz.confirmSubmitBtn', 'Yes, Submit Now')}
                cancelText={t('quiz.cancel', 'Cancel')}
                onConfirm={handleConfirmSubmit}
                onCancel={() => setConfirmModalOpen(false)}
            >
                <div className="space-y-2 text-sm text-text-secondary">
                    <p>
                        {t(
                            'quiz.confirmSubmitNotice',
                            'Are you sure you want to submit your answers? You only have 1 attempt for this assessment.',
                        )}
                    </p>
                    {answeredCount < totalQuestions && (
                        <p className="text-amber-600 dark:text-amber-400 font-medium">
                            {t(
                                'quiz.unansweredWarning',
                                'You have {{unanswered}} unanswered question(s) which will be scored as 0 points.',
                                { unanswered: totalQuestions - answeredCount },
                            )}
                        </p>
                    )}
                </div>
            </ConfirmDialog>
        </div>
    )
}

export default QuizPlayer
