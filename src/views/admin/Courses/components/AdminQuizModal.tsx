import { useState, useEffect, useCallback } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import Spinner from '@/components/ui/Spinner'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import useTranslation from '@/utils/hooks/useTranslation'
import classNames from 'classnames'
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineCheck,
    HiOutlineAcademicCap,
    HiOutlineCheckCircle,
    HiOutlineExclamationTriangle,
    HiOutlineArrowPath,
    HiOutlineXMark,
} from 'react-icons/hi2'
import {
    apiGetStudentQuiz,
    apiGetAdminQuiz,
    apiCreateQuiz,
    apiUpdateQuiz,
    apiDeleteQuiz,
    apiCreateQuestion,
    apiUpdateQuestion,
    apiDeleteQuestion,
    apiCreateOption,
    apiUpdateOption,
    apiDeleteOption,
    apiSetCorrectOption,
    apiResolveAdminQuiz,
    saveQuizIdMapping,
    removeQuizIdMapping,
} from '@/services/QuizService'
import type {
    QuizAdminDetailsResponse,
    AdminQuizQuestion,
    AdminQuizOption,
    CreateQuestionOptionPayload,
} from '@/@types/quiz'

interface AdminQuizModalProps {
    isOpen: boolean
    onClose: () => void
    contentId: number
    quizId?: number | null
    initialTitle?: string
    onSuccess?: (message?: string) => void
}

export const AdminQuizModal = ({
    isOpen,
    onClose,
    contentId,
    quizId,
    initialTitle,
    onSuccess,
}: AdminQuizModalProps) => {
    const { t } = useTranslation()

    // Loading & error states
    const [loading, setLoading] = useState<boolean>(true)
    const [busyAction, setBusyAction] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Quiz data
    const [quizData, setQuizData] = useState<QuizAdminDetailsResponse | null>(null)
    const [quizNotFound, setQuizNotFound] = useState<boolean>(false)

    // Header edit state (passing score)
    const [isEditingHeader, setIsEditingHeader] = useState<boolean>(false)
    const [passingScoreInput, setPassingScoreInput] = useState<number>(75)

    // Add Question form state
    const [addQuestionModalOpen, setAddQuestionModalOpen] = useState<boolean>(false)
    const [newQuestionText, setNewQuestionText] = useState<string>('')
    const [newQuestionOptions, setNewQuestionOptions] = useState<CreateQuestionOptionPayload[]>([
        { optionText: '', isCorrect: true },
        { optionText: '', isCorrect: false },
    ])
    const [addQuestionError, setAddQuestionError] = useState<string>('')

    // Edit Question state
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null)
    const [editingQuestionText, setEditingQuestionText] = useState<string>('')

    // Add Option state
    const [addingOptionQuestionId, setAddingOptionQuestionId] = useState<number | null>(null)
    const [newOptionText, setNewOptionText] = useState<string>('')

    // Edit Option state
    const [editingOptionId, setEditingOptionId] = useState<number | null>(null)
    const [editingOptionText, setEditingOptionText] = useState<string>('')

    // Confirm dialogs
    const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<AdminQuizQuestion | null>(null)
    const [deleteQuizDialogOpen, setDeleteQuizDialogOpen] = useState<boolean>(false)

    // Fetch quiz data
    const fetchQuizDetails = useCallback(async () => {
        if (!contentId && !quizId) return
        setLoading(true)
        setErrorMsg('')
        setQuizNotFound(false)

        try {
            const data = await apiResolveAdminQuiz(contentId, quizId)
            if (data) {
                setQuizData(data)
                setPassingScoreInput(data.passingScore)
                setQuizNotFound(false)
            } else {
                setQuizNotFound(true)
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            const msg =
                errorObj?.response?.data?.message ||
                errorObj?.message ||
                t('quiz.fetchFailed', 'Failed to fetch quiz details.')
            setErrorMsg(msg)
        } finally {
            setLoading(false)
        }
    }, [contentId, quizId, t])

    useEffect(() => {
        if (isOpen) {
            fetchQuizDetails()
        }
    }, [isOpen, fetchQuizDetails])

    // ==========================================
    // 1. Initialize Quiz Header if not created
    // ==========================================
    const handleInitializeQuiz = async () => {
        if (!contentId) return
        setBusyAction(true)
        setErrorMsg('')
        try {
            const res = await apiCreateQuiz({
                contentId,
                passingScore: passingScoreInput || 75,
            })
            if (res && (res.status || res.isSuccess)) {
                if (res.data) {
                    saveQuizIdMapping(contentId, res.data)
                }
                setSuccessMsg(t('quiz.initializedSuccess', 'Quiz created successfully.'))
                await fetchQuizDetails()
            } else {
                const msg = res?.message || ''
                if (
                    msg.includes('AlreadyExists') ||
                    msg.includes('بالفعل') ||
                    msg.includes('already exists')
                ) {
                    const resolved = await apiResolveAdminQuiz(contentId)
                    if (resolved) {
                        setQuizData(resolved)
                        setPassingScoreInput(resolved.passingScore)
                        setQuizNotFound(false)
                        return
                    }
                }
                setErrorMsg(msg || t('quiz.createFailed', 'Failed to create quiz.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            const msg =
                errorObj?.response?.data?.message ||
                errorObj?.message ||
                t('quiz.createFailed', 'Failed to create quiz.')
            if (
                msg.includes('AlreadyExists') ||
                msg.includes('بالفعل') ||
                msg.includes('already exists')
            ) {
                const resolved = await apiResolveAdminQuiz(contentId)
                if (resolved) {
                    setQuizData(resolved)
                    setPassingScoreInput(resolved.passingScore)
                    setQuizNotFound(false)
                    return
                }
            }
            setErrorMsg(msg)
        } finally {
            setBusyAction(false)
        }
    }

    // ==========================================
    // 2. Update Quiz Header Passing Score
    // ==========================================
    const handleSavePassingScore = async () => {
        if (!quizData) return
        setBusyAction(true)
        setErrorMsg('')
        try {
            const res = await apiUpdateQuiz(quizData.id, {
                passingScore: Number(passingScoreInput),
            })
            if (res && (res.status || res.isSuccess)) {
                setQuizData((prev) => prev ? { ...prev, passingScore: Number(passingScoreInput) } : null)
                setIsEditingHeader(false)
                setSuccessMsg(t('quiz.scoreUpdated', 'Passing score updated.'))
            } else {
                setErrorMsg(res?.message || t('quiz.updateFailed', 'Failed to update score.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj?.message ||
                    t('quiz.updateFailed', 'Failed to update score.'),
            )
        } finally {
            setBusyAction(false)
        }
    }

    // ==========================================
    // 3. Delete Entire Quiz
    // ==========================================
    const handleConfirmDeleteQuiz = async () => {
        if (!quizData) return
        setBusyAction(true)
        setDeleteQuizDialogOpen(false)
        try {
            const res = await apiDeleteQuiz(quizData.id)
            if (res && (res.status || res.isSuccess)) {
                removeQuizIdMapping(contentId)
                onSuccess?.(t('quiz.quizDeletedSuccess', 'Quiz deleted successfully.'))
                onClose()
            } else {
                setErrorMsg(res?.message || t('quiz.deleteFailed', 'Failed to delete quiz.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj?.message ||
                    t('quiz.deleteFailed', 'Failed to delete quiz.'),
            )
        } finally {
            setBusyAction(false)
        }
    }

    // ==========================================
    // 4. Add Question Flow
    // ==========================================
    const handleOpenAddQuestion = () => {
        setNewQuestionText('')
        setNewQuestionOptions([
            { optionText: '', isCorrect: true },
            { optionText: '', isCorrect: false },
        ])
        setAddQuestionError('')
        setAddQuestionModalOpen(true)
    }

    const handleAddOptionFieldInDraft = () => {
        setNewQuestionOptions((prev) => [
            ...prev,
            { optionText: '', isCorrect: false },
        ])
    }

    const handleRemoveOptionFieldInDraft = (index: number) => {
        if (newQuestionOptions.length <= 2) return
        const wasCorrect = newQuestionOptions[index].isCorrect
        const updated = newQuestionOptions.filter((_, idx) => idx !== index)
        if (wasCorrect && updated.length > 0) {
            updated[0].isCorrect = true
        }
        setNewQuestionOptions(updated)
    }

    const handleSelectDraftCorrectOption = (targetIndex: number) => {
        setNewQuestionOptions((prev) =>
            prev.map((opt, idx) => ({
                ...opt,
                isCorrect: idx === targetIndex,
            })),
        )
    }

    const handleSaveNewQuestion = async () => {
        if (!quizData) return
        setAddQuestionError('')

        const trimmedPrompt = newQuestionText.trim()
        if (!trimmedPrompt) {
            setAddQuestionError(t('quiz.questionTextRequired', 'Question prompt is required.'))
            return
        }

        const validOptions = newQuestionOptions.map((opt) => ({
            optionText: opt.optionText.trim(),
            isCorrect: opt.isCorrect,
        }))

        if (validOptions.length < 2) {
            setAddQuestionError(t('quiz.minTwoOptionsRequired', 'Question must have at least 2 choices.'))
            return
        }

        if (validOptions.some((opt) => !opt.optionText)) {
            setAddQuestionError(t('quiz.allOptionTextsRequired', 'Please fill in text for all choices.'))
            return
        }

        const correctCount = validOptions.filter((opt) => opt.isCorrect).length
        if (correctCount !== 1) {
            setAddQuestionError(t('quiz.singleCorrectOptionRequired', 'Exactly one option must be marked as correct.'))
            return
        }

        setBusyAction(true)
        try {
            const res = await apiCreateQuestion(quizData.id, {
                questionText: trimmedPrompt,
                options: validOptions,
            })

            if (res && (res.status || res.isSuccess)) {
                setAddQuestionModalOpen(false)
                setSuccessMsg(t('quiz.questionCreatedSuccess', 'Question added successfully.'))
                await fetchQuizDetails()
            } else {
                setAddQuestionError(res?.message || t('quiz.createQuestionFailed', 'Failed to add question.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setAddQuestionError(
                errorObj?.response?.data?.message ||
                    errorObj?.message ||
                    t('quiz.createQuestionFailed', 'Failed to add question.'),
            )
        } finally {
            setBusyAction(false)
        }
    }

    // ==========================================
    // 5. Edit Question Prompt
    // ==========================================
    const handleStartEditQuestion = (question: AdminQuizQuestion) => {
        setEditingQuestionId(question.id)
        setEditingQuestionText(question.questionText)
    }

    const handleSaveQuestionText = async (questionId: number) => {
        const trimmed = editingQuestionText.trim()
        if (!trimmed) return

        setBusyAction(true)
        setErrorMsg('')
        try {
            const res = await apiUpdateQuestion(questionId, { questionText: trimmed })
            if (res && (res.status || res.isSuccess)) {
                setQuizData((prev) => {
                    if (!prev) return null
                    return {
                        ...prev,
                        questions: prev.questions.map((q) =>
                            q.id === questionId ? { ...q, questionText: trimmed } : q,
                        ),
                    }
                })
                setEditingQuestionId(null)
                setSuccessMsg(t('quiz.questionUpdated', 'Question updated.'))
            } else {
                setErrorMsg(res?.message || t('quiz.updateFailed', 'Failed to update question.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj?.message ||
                    t('quiz.updateFailed', 'Failed to update question.'),
            )
        } finally {
            setBusyAction(false)
        }
    }

    // ==========================================
    // 6. Delete Question
    // ==========================================
    const handleConfirmDeleteQuestion = async () => {
        if (!deleteQuestionTarget) return
        setBusyAction(true)
        setErrorMsg('')
        const targetId = deleteQuestionTarget.id
        setDeleteQuestionTarget(null)

        try {
            const res = await apiDeleteQuestion(targetId)
            if (res && (res.status || res.isSuccess)) {
                setQuizData((prev) => {
                    if (!prev) return null
                    return {
                        ...prev,
                        questions: prev.questions.filter((q) => q.id !== targetId),
                    }
                })
                setSuccessMsg(t('quiz.questionDeleted', 'Question deleted.'))
            } else {
                setErrorMsg(res?.message || t('quiz.deleteFailed', 'Failed to delete question.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj?.message ||
                    t('quiz.deleteFailed', 'Failed to delete question.'),
            )
        } finally {
            setBusyAction(false)
        }
    }

    // ==========================================
    // 7. Options Management
    // ==========================================
    const handleAddOptionToQuestion = async (questionId: number) => {
        const trimmed = newOptionText.trim()
        if (!trimmed) return

        setBusyAction(true)
        setErrorMsg('')
        try {
            const res = await apiCreateOption(questionId, {
                optionText: trimmed,
                isCorrect: false,
            })
            if (res && (res.status || res.isSuccess) && res.data) {
                const newOptionId = res.data
                setQuizData((prev) => {
                    if (!prev) return null
                    return {
                        ...prev,
                        questions: prev.questions.map((q) => {
                            if (q.id === questionId) {
                                return {
                                    ...q,
                                    options: [
                                        ...q.options,
                                        { id: newOptionId, optionText: trimmed, isCorrect: false },
                                    ],
                                }
                            }
                            return q
                        }),
                    }
                })
                setAddingOptionQuestionId(null)
                setNewOptionText('')
                setSuccessMsg(t('quiz.optionAdded', 'Option added.'))
            } else {
                setErrorMsg(res?.message || t('quiz.addOptionFailed', 'Failed to add option.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj?.message ||
                    t('quiz.addOptionFailed', 'Failed to add option.'),
            )
        } finally {
            setBusyAction(false)
        }
    }

    const handleSaveOptionText = async (option: AdminQuizOption, questionId: number) => {
        const trimmed = editingOptionText.trim()
        if (!trimmed) return

        setBusyAction(true)
        setErrorMsg('')
        try {
            const res = await apiUpdateOption(option.id, {
                optionText: trimmed,
                isCorrect: option.isCorrect,
            })
            if (res && (res.status || res.isSuccess)) {
                setQuizData((prev) => {
                    if (!prev) return null
                    return {
                        ...prev,
                        questions: prev.questions.map((q) => {
                            if (q.id === questionId) {
                                return {
                                    ...q,
                                    options: q.options.map((opt) =>
                                        opt.id === option.id ? { ...opt, optionText: trimmed } : opt,
                                    ),
                                }
                            }
                            return q
                        }),
                    }
                })
                setEditingOptionId(null)
                setSuccessMsg(t('quiz.optionUpdated', 'Option updated.'))
            } else {
                setErrorMsg(res?.message || t('quiz.updateFailed', 'Failed to update option.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj?.message ||
                    t('quiz.updateFailed', 'Failed to update option.'),
            )
        } finally {
            setBusyAction(false)
        }
    }

    const handleSetCorrectOption = async (questionId: number, optionId: number) => {
        setBusyAction(true)
        setErrorMsg('')
        try {
            const res = await apiSetCorrectOption(questionId, optionId)
            if (res && (res.status || res.isSuccess)) {
                setQuizData((prev) => {
                    if (!prev) return null
                    return {
                        ...prev,
                        questions: prev.questions.map((q) => {
                            if (q.id === questionId) {
                                return {
                                    ...q,
                                    options: q.options.map((opt) => ({
                                        ...opt,
                                        isCorrect: opt.id === optionId,
                                    })),
                                }
                            }
                            return q
                        }),
                    }
                })
                setSuccessMsg(t('quiz.correctOptionSet', 'Correct option updated.'))
            } else {
                setErrorMsg(res?.message || t('quiz.setCorrectFailed', 'Failed to set correct option.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj?.message ||
                    t('quiz.setCorrectFailed', 'Failed to set correct option.'),
            )
        } finally {
            setBusyAction(false)
        }
    }

    const handleDeleteOption = async (questionId: number, option: AdminQuizOption, totalOptions: number) => {
        // Backend invariants check:
        // 1. Min 2 options required
        if (totalOptions <= 2) {
            setErrorMsg(t('quiz.minTwoOptionsRequired', 'Question must have at least 2 choices.'))
            return
        }
        // 2. Cannot delete the only correct option
        if (option.isCorrect) {
            setErrorMsg(
                t(
                    'quiz.cannotDeleteCorrectOption',
                    'Cannot delete the only correct option. Designate another option as correct first.',
                ),
            )
            return
        }

        setBusyAction(true)
        setErrorMsg('')
        try {
            const res = await apiDeleteOption(option.id)
            if (res && (res.status || res.isSuccess)) {
                setQuizData((prev) => {
                    if (!prev) return null
                    return {
                        ...prev,
                        questions: prev.questions.map((q) => {
                            if (q.id === questionId) {
                                return {
                                    ...q,
                                    options: q.options.filter((opt) => opt.id !== option.id),
                                }
                            }
                            return q
                        }),
                    }
                })
                setSuccessMsg(t('quiz.optionDeleted', 'Option deleted.'))
            } else {
                setErrorMsg(res?.message || t('quiz.deleteFailed', 'Failed to delete option.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj?.message ||
                    t('quiz.deleteFailed', 'Failed to delete option.'),
            )
        } finally {
            setBusyAction(false)
        }
    }

    return (
        <>
            <Dialog
                isOpen={isOpen}
                onClose={onClose}
                width={860}
                contentClassName="p-0 max-h-[85vh] flex flex-col"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
                            <HiOutlineAcademicCap />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                {quizData?.title || initialTitle || t('quiz.manageQuizTitle', 'Manage Quiz & Questions')}
                            </h3>
                            <span className="text-xs text-gray-400">
                                {t('quiz.adminSubtitle', 'Configure questions, choices, and passing requirements')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {quizData && (
                            <Button
                                size="xs"
                                variant="solid"
                                icon={<HiOutlinePlus />}
                                onClick={handleOpenAddQuestion}
                                disabled={busyAction}
                            >
                                {t('quiz.addQuestion', 'Add Question')}
                            </Button>
                        )}
                        <Button size="xs" variant="plain" onClick={onClose}>
                            {t('common.close', 'Close')}
                        </Button>
                    </div>
                </div>

                {/* Notifications & Alert bars */}
                {errorMsg && (
                    <div className="p-4 pb-0">
                        <Alert type="danger" showIcon onClose={() => setErrorMsg('')}>
                            {errorMsg}
                        </Alert>
                    </div>
                )}
                {successMsg && (
                    <div className="p-4 pb-0">
                        <Alert type="success" showIcon onClose={() => setSuccessMsg('')}>
                            {successMsg}
                        </Alert>
                    </div>
                )}

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            <Spinner size={36} className="text-primary mb-3" />
                            <p className="text-sm text-gray-500">
                                {t('quiz.loadingDetails', 'Loading quiz details...')}
                            </p>
                        </div>
                    ) : errorMsg && !quizData ? (
                        <div className="py-12 px-6 text-center border border-dashed border-red-200 dark:border-red-800 rounded-2xl bg-red-50/30 dark:bg-red-950/20">
                            <HiOutlineExclamationTriangle className="text-5xl mx-auto text-red-500 mb-3" />
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {t('common.error', 'حدث خطأ')}
                            </h4>
                            <p className="text-sm text-red-600 dark:text-red-400 max-w-md mx-auto mb-4">
                                {errorMsg}
                            </p>
                            <Button
                                size="sm"
                                variant="default"
                                icon={<HiOutlineArrowPath />}
                                onClick={fetchQuizDetails}
                            >
                                {t('common.retry', 'إعادة المحاولة')}
                            </Button>
                        </div>
                    ) : quizNotFound ? (
                        <div className="py-12 px-6 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-850">
                            <HiOutlineAcademicCap className="text-5xl mx-auto text-amber-500 mb-3" />
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                                {t('quiz.headerNotCreated', 'Quiz Header Not Created')}
                            </h4>
                            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                                {t('quiz.headerNotCreatedDesc', 'Create the quiz header to begin adding assessment questions for this course content.')}
                            </p>
                            <div className="max-w-xs mx-auto space-y-3">
                                <div className="text-start">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('quiz.passingScoreLabel', 'Passing Score (%)')}
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={passingScoreInput}
                                        onChange={(e) => setPassingScoreInput(Number(e.target.value))}
                                    />
                                </div>
                                <Button
                                    variant="solid"
                                    size="sm"
                                    loading={busyAction}
                                    onClick={handleInitializeQuiz}
                                    className="w-full"
                                >
                                    {t('quiz.createQuizHeaderBtn', 'Create Quiz Header')}
                                </Button>
                            </div>
                        </div>
                    ) : quizData ? (
                        <>
                            {/* Quiz Header Info Card */}
                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                                            {t('quiz.passingRequirement', 'Passing Requirement')}
                                        </span>
                                        {isEditingHeader ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <Input
                                                    size="sm"
                                                    type="number"
                                                    min={1}
                                                    max={100}
                                                    className="w-24"
                                                    value={passingScoreInput}
                                                    onChange={(e) => setPassingScoreInput(Number(e.target.value))}
                                                />
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">%</span>
                                                <Button
                                                    size="xs"
                                                    variant="solid"
                                                    loading={busyAction}
                                                    onClick={handleSavePassingScore}
                                                >
                                                    {t('common.save', 'Save')}
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="plain"
                                                    onClick={() => {
                                                        setIsEditingHeader(false)
                                                        setPassingScoreInput(quizData.passingScore)
                                                    }}
                                                >
                                                    {t('common.cancel', 'Cancel')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                    {quizData.passingScore}%
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditingHeader(true)}
                                                    className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                                                    title={t('quiz.editScore', 'Edit passing score')}
                                                >
                                                    <HiOutlinePencil className="text-sm" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-s border-gray-100 dark:border-gray-700 ps-4">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                                            {t('quiz.totalQuestionsLabel', 'Total Questions')}
                                        </span>
                                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5 block">
                                            {quizData.questions.length}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<HiOutlineTrash className="text-red-500" />}
                                    onClick={() => setDeleteQuizDialogOpen(true)}
                                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                    {t('quiz.deleteEntireQuiz', 'Delete Quiz')}
                                </Button>
                            </div>

                            {/* Questions List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                        {t('quiz.questionsList', 'Questions & Choices')}
                                    </h4>
                                    <Button
                                        size="xs"
                                        variant="twoTone"
                                        icon={<HiOutlinePlus />}
                                        onClick={handleOpenAddQuestion}
                                        disabled={busyAction}
                                    >
                                        {t('quiz.addQuestion', 'Add Question')}
                                    </Button>
                                </div>

                                {quizData.questions.length === 0 ? (
                                    <div className="py-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-850">
                                        <p className="text-xs text-gray-500 mb-3">
                                            {t('quiz.noQuestionsInQuiz', 'No questions in this quiz yet.')}
                                        </p>
                                        <Button
                                            size="xs"
                                            variant="solid"
                                            icon={<HiOutlinePlus />}
                                            onClick={handleOpenAddQuestion}
                                        >
                                            {t('quiz.addFirstQuestion', 'Add First Question')}
                                        </Button>
                                    </div>
                                ) : (
                                    quizData.questions.map((question: AdminQuizQuestion, qIdx: number) => {
                                        const isEditingPrompt = editingQuestionId === question.id
                                        const isAddingOption = addingOptionQuestionId === question.id

                                        return (
                                            <div
                                                key={question.id}
                                                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-2xs space-y-3"
                                            >
                                                {/* Question Prompt Header */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                                            {qIdx + 1}
                                                        </span>

                                                        {isEditingPrompt ? (
                                                            <div className="flex-1 space-y-2">
                                                                <Input
                                                                    size="sm"
                                                                    value={editingQuestionText}
                                                                    onChange={(e) => setEditingQuestionText(e.target.value)}
                                                                />
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        size="xs"
                                                                        variant="solid"
                                                                        loading={busyAction}
                                                                        onClick={() => handleSaveQuestionText(question.id)}
                                                                    >
                                                                        {t('common.save', 'Save')}
                                                                    </Button>
                                                                    <Button
                                                                        size="xs"
                                                                        variant="plain"
                                                                        onClick={() => setEditingQuestionId(null)}
                                                                    >
                                                                        {t('common.cancel', 'Cancel')}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 pt-0.5">
                                                                {question.questionText}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {!isEditingPrompt && (
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Tooltip title={t('common.edit', 'Edit question')}>
                                                                <Button
                                                                    size="xs"
                                                                    variant="plain"
                                                                    icon={<HiOutlinePencil className="text-gray-400 hover:text-indigo-600" />}
                                                                    onClick={() => handleStartEditQuestion(question)}
                                                                />
                                                            </Tooltip>
                                                            <Tooltip title={t('common.delete', 'Delete question')}>
                                                                <Button
                                                                    size="xs"
                                                                    variant="plain"
                                                                    icon={<HiOutlineTrash className="text-gray-400 hover:text-red-600" />}
                                                                    onClick={() => setDeleteQuestionTarget(question)}
                                                                />
                                                            </Tooltip>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Options List */}
                                                <div className="ps-8 space-y-2">
                                                    {question.options.map((option: AdminQuizOption) => {
                                                        const isEditingThisOption = editingOptionId === option.id
                                                        const canDelete = question.options.length > 2 && !option.isCorrect

                                                        return (
                                                            <div
                                                                key={option.id}
                                                                className={classNames(
                                                                    'flex items-center justify-between gap-3 p-2.5 rounded-lg border text-xs transition-all',
                                                                    option.isCorrect
                                                                        ? 'border-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-950/30'
                                                                        : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850',
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                                    {/* Correct answer toggle radio */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={busyAction}
                                                                        onClick={() => {
                                                                            if (!option.isCorrect) {
                                                                                handleSetCorrectOption(question.id, option.id)
                                                                            }
                                                                        }}
                                                                        title={
                                                                            option.isCorrect
                                                                                ? t('quiz.designatedCorrect', 'Designated correct answer')
                                                                                : t('quiz.makeCorrect', 'Click to set as correct answer')
                                                                        }
                                                                        className={classNames(
                                                                            'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                                                                            option.isCorrect
                                                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                                : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500',
                                                                        )}
                                                                    >
                                                                        {option.isCorrect && <HiOutlineCheck className="text-[10px]" />}
                                                                    </button>

                                                                    {isEditingThisOption ? (
                                                                        <div className="flex items-center gap-2 flex-1">
                                                                            <Input
                                                                                size="sm"
                                                                                value={editingOptionText}
                                                                                onChange={(e) => setEditingOptionText(e.target.value)}
                                                                            />
                                                                            <Button
                                                                                size="xs"
                                                                                variant="solid"
                                                                                loading={busyAction}
                                                                                onClick={() => handleSaveOptionText(option, question.id)}
                                                                            >
                                                                                {t('common.save', 'Save')}
                                                                            </Button>
                                                                            <Button
                                                                                size="xs"
                                                                                variant="plain"
                                                                                onClick={() => setEditingOptionId(null)}
                                                                            >
                                                                                <HiOutlineXMark />
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <span
                                                                            className={classNames(
                                                                                'leading-snug break-words',
                                                                                option.isCorrect
                                                                                    ? 'font-bold text-emerald-800 dark:text-emerald-200'
                                                                                    : 'text-gray-700 dark:text-gray-300',
                                                                            )}
                                                                        >
                                                                            {option.optionText}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {!isEditingThisOption && (
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        {option.isCorrect && (
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                                                                {t('quiz.correctBadge', 'Correct Answer')}
                                                                            </span>
                                                                        )}

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setEditingOptionId(option.id)
                                                                                setEditingOptionText(option.optionText)
                                                                            }}
                                                                            className="text-gray-400 hover:text-indigo-600 p-1"
                                                                        >
                                                                            <HiOutlinePencil className="text-xs" />
                                                                        </button>

                                                                        <Tooltip
                                                                            title={
                                                                                question.options.length <= 2
                                                                                    ? t('quiz.minTwoOptionsTooltip', 'Cannot delete (min 2 options required)')
                                                                                    : option.isCorrect
                                                                                      ? t('quiz.cannotDeleteCorrectTooltip', 'Cannot delete the correct option')
                                                                                      : t('common.delete', 'Delete option')
                                                                            }
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                disabled={!canDelete || busyAction}
                                                                                onClick={() => handleDeleteOption(question.id, option, question.options.length)}
                                                                                className={classNames(
                                                                                    'p-1',
                                                                                    canDelete
                                                                                        ? 'text-gray-400 hover:text-red-600'
                                                                                        : 'opacity-30 cursor-not-allowed text-gray-400',
                                                                                )}
                                                                            >
                                                                                <HiOutlineTrash className="text-xs" />
                                                                            </button>
                                                                        </Tooltip>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}

                                                    {/* Inline Add Option Form */}
                                                    {isAddingOption ? (
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <Input
                                                                size="sm"
                                                                placeholder={t('quiz.newOptionPlaceholder', 'Enter choice text...')}
                                                                value={newOptionText}
                                                                onChange={(e) => setNewOptionText(e.target.value)}
                                                            />
                                                            <Button
                                                                size="xs"
                                                                variant="solid"
                                                                loading={busyAction}
                                                                onClick={() => handleAddOptionToQuestion(question.id)}
                                                            >
                                                                {t('common.add', 'Add')}
                                                            </Button>
                                                            <Button
                                                                size="xs"
                                                                variant="plain"
                                                                onClick={() => {
                                                                    setAddingOptionQuestionId(null)
                                                                    setNewOptionText('')
                                                                }}
                                                            >
                                                                {t('common.cancel', 'Cancel')}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="xs"
                                                            variant="plain"
                                                            icon={<HiOutlinePlus />}
                                                            onClick={() => {
                                                                setAddingOptionQuestionId(question.id)
                                                                setNewOptionText('')
                                                            }}
                                                            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 text-xs"
                                                        >
                                                            {t('quiz.addChoice', 'Add Choice')}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </Dialog>

            {/* Sub-Dialog: Add Question Form */}
            <Dialog
                isOpen={addQuestionModalOpen}
                onClose={() => setAddQuestionModalOpen(false)}
                width={600}
            >
                <div className="p-1 space-y-4">
                    <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {t('quiz.addQuestionTitle', 'Add Question')}
                    </h4>

                    {addQuestionError && (
                        <Alert type="danger" showIcon>
                            {addQuestionError}
                        </Alert>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {t('quiz.questionPrompt', 'Question Prompt')} <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder={t('quiz.questionPromptPlaceholder', 'e.g. What does CQRS stand for?')}
                            value={newQuestionText}
                            onChange={(e) => setNewQuestionText(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {t('quiz.optionsList', 'Choices (Select the correct one)')} <span className="text-red-500">*</span>
                            </label>
                            <Button
                                size="xs"
                                variant="plain"
                                icon={<HiOutlinePlus />}
                                onClick={handleAddOptionFieldInDraft}
                                className="text-indigo-600 text-xs"
                            >
                                {t('quiz.addOption', 'Add Choice')}
                            </Button>
                        </div>

                        {newQuestionOptions.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="correctOptionRadio"
                                    checked={opt.isCorrect}
                                    onChange={() => handleSelectDraftCorrectOption(idx)}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                    title={t('quiz.markCorrect', 'Mark as correct')}
                                />
                                <Input
                                    size="sm"
                                    placeholder={`${t('quiz.choice', 'Choice')} ${idx + 1}`}
                                    value={opt.optionText}
                                    onChange={(e) => {
                                        const text = e.target.value
                                        setNewQuestionOptions((prev) =>
                                            prev.map((o, i) => (i === idx ? { ...o, optionText: text } : o)),
                                        )
                                    }}
                                />
                                {newQuestionOptions.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOptionFieldInDraft(idx)}
                                        className="text-gray-400 hover:text-red-600 p-1"
                                    >
                                        <HiOutlineTrash className="text-base" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            size="sm"
                            variant="plain"
                            onClick={() => setAddQuestionModalOpen(false)}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            loading={busyAction}
                            onClick={handleSaveNewQuestion}
                        >
                            {t('quiz.saveQuestionBtn', 'Save Question')}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Confirm Delete Question Dialog */}
            <ConfirmDialog
                isOpen={Boolean(deleteQuestionTarget)}
                type="danger"
                title={t('quiz.confirmDeleteQuestionTitle', 'Delete Question?')}
                confirmText={t('common.delete', 'Delete')}
                cancelText={t('common.cancel', 'Cancel')}
                onConfirm={handleConfirmDeleteQuestion}
                onCancel={() => setDeleteQuestionTarget(null)}
            >
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t(
                        'quiz.confirmDeleteQuestionDesc',
                        'Are you sure you want to delete this question and all its choices? This action cannot be undone.',
                    )}
                </p>
            </ConfirmDialog>

            {/* Confirm Delete Quiz Dialog */}
            <ConfirmDialog
                isOpen={deleteQuizDialogOpen}
                type="danger"
                title={t('quiz.confirmDeleteQuizTitle', 'Delete Entire Quiz?')}
                confirmText={t('common.delete', 'Delete')}
                cancelText={t('common.cancel', 'Cancel')}
                onConfirm={handleConfirmDeleteQuiz}
                onCancel={() => setDeleteQuizDialogOpen(false)}
            >
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t(
                        'quiz.confirmDeleteQuizDesc',
                        'Are you sure you want to delete this quiz header and all associated questions? This action cannot be undone.',
                    )}
                </p>
            </ConfirmDialog>
        </>
    )
}

export default AdminQuizModal
