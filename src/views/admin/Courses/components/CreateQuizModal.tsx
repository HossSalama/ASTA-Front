import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import Tooltip from '@/components/ui/Tooltip'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    HiOutlineAcademicCap,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineCheckCircle,
    HiOutlineLockClosed,
    HiOutlineEye,
    HiOutlineXMark,
    HiOutlineQuestionMarkCircle,
} from 'react-icons/hi2'
import { apiCreateCourseContent } from '@/services/CourseContentService'
import { apiCreateQuiz, saveQuizIdMapping } from '@/services/QuizService'
import { ContentType, ContentItemStatus } from '@/@types/courseContent'
import type { CreateQuestionPayload } from '@/@types/quiz'

interface CreateQuizModalProps {
    isOpen: boolean
    onClose: () => void
    sectionId: number
    onSuccess: (message?: string) => void
}

interface LocalOption {
    id: string
    optionText: string
    isCorrect: boolean
}

interface LocalQuestion {
    id: string
    questionText: string
    options: LocalOption[]
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const createInitialQuestion = (index: number): LocalQuestion => ({
    id: generateId(),
    questionText: '',
    options: [
        { id: generateId(), optionText: '', isCorrect: true },
        { id: generateId(), optionText: '', isCorrect: false },
    ],
})

export const CreateQuizModal = ({
    isOpen,
    onClose,
    sectionId,
    onSuccess,
}: CreateQuizModalProps) => {
    const { t } = useTranslation()

    // Header & Quiz Settings
    const [title, setTitle] = useState<string>('')
    const [passingScore, setPassingScore] = useState<number>(75)
    const [status, setStatus] = useState<ContentItemStatus>(ContentItemStatus.Published)
    const [isPreview, setIsPreview] = useState<boolean>(false)

    // Interactive Questions Builder
    const [questions, setQuestions] = useState<LocalQuestion[]>([])

    // Loading & Feedback
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')

    useEffect(() => {
        if (isOpen) {
            setTitle('')
            setPassingScore(75)
            setStatus(ContentItemStatus.Published)
            setIsPreview(false)
            setQuestions([])
            setErrorMsg('')
            setSubmitting(false)
        }
    }, [isOpen])

    // ==========================================
    // Question Builder Actions
    // ==========================================

    const handleAddQuestion = () => {
        setQuestions((prev) => [...prev, createInitialQuestion(prev.length + 1)])
    }

    const handleRemoveQuestion = (questionId: string) => {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId))
    }

    const handleQuestionTextChange = (questionId: string, text: string) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === questionId ? { ...q, questionText: text } : q)),
        )
    }

    const handleAddOption = (questionId: string) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== questionId) return q
                if (q.options.length >= 6) return q
                return {
                    ...q,
                    options: [
                        ...q.options,
                        { id: generateId(), optionText: '', isCorrect: false },
                    ],
                }
            }),
        )
    }

    const handleRemoveOption = (questionId: string, optionId: string) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== questionId) return q
                if (q.options.length <= 2) return q
                const remaining = q.options.filter((o) => o.id !== optionId)
                // If deleted option was the correct one, make the first remaining option correct
                if (!remaining.some((o) => o.isCorrect) && remaining.length > 0) {
                    remaining[0].isCorrect = true
                }
                return { ...q, options: remaining }
            }),
        )
    }

    const handleOptionTextChange = (
        questionId: string,
        optionId: string,
        text: string,
    ) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== questionId) return q
                return {
                    ...q,
                    options: q.options.map((opt) =>
                        opt.id === optionId ? { ...opt, optionText: text } : opt,
                    ),
                }
            }),
        )
    }

    const handleSetCorrectOption = (questionId: string, optionId: string) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== questionId) return q
                return {
                    ...q,
                    options: q.options.map((opt) => ({
                        ...opt,
                        isCorrect: opt.id === optionId,
                    })),
                }
            }),
        )
    }

    // ==========================================
    // Submit Handler (Bulk Creation)
    // ==========================================

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg('')

        const trimmedTitle = title.trim()
        if (!trimmedTitle) {
            setErrorMsg(t('quiz.titleRequired', 'عنوان الاختبار مطلوب.'))
            return
        }

        const scoreNum = Number(passingScore)
        if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 100) {
            setErrorMsg(t('quiz.invalidPassingScore', 'يرجى إدخال درجة نجاح صالحة بين 1 و 100.'))
            return
        }

        // Validate questions if any were added
        const formattedQuestions: CreateQuestionPayload[] = []
        if (questions.length > 0) {
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i]
                const qText = q.questionText.trim()
                if (!qText) {
                    setErrorMsg(
                        t(
                            'quiz.questionTextRequiredIndex',
                            `يرجى كتابة نص السؤال رقم ${i + 1}.`,
                        ),
                    )
                    return
                }

                if (q.options.length < 2) {
                    setErrorMsg(
                        t(
                            'quiz.minOptionsRequiredIndex',
                            `يجب أن يحتوي السؤال رقم ${i + 1} على خيارين على الأقل.`,
                        ),
                    )
                    return
                }

                const correctCount = q.options.filter((o) => o.isCorrect).length
                if (correctCount !== 1) {
                    setErrorMsg(
                        t(
                            'quiz.singleCorrectOptionRequiredIndex',
                            `يرجى تحديد إجابة صحيحة واحدة للسؤال رقم ${i + 1}.`,
                        ),
                    )
                    return
                }

                for (let j = 0; j < q.options.length; j++) {
                    const optText = q.options[j].optionText.trim()
                    if (!optText) {
                        setErrorMsg(
                            t(
                                'quiz.optionTextRequiredIndex',
                                `يرجى كتابة نص الخيار رقم ${j + 1} في السؤال رقم ${i + 1}.`,
                            ),
                        )
                        return
                    }
                }

                formattedQuestions.push({
                    questionText: qText,
                    options: q.options.map((opt) => ({
                        optionText: opt.optionText.trim(),
                        isCorrect: opt.isCorrect,
                    })),
                })
            }
        }

        setSubmitting(true)

        try {
            // Step 1: Create CourseContentItem of type Quiz
            const contentRes = await apiCreateCourseContent({
                sectionId,
                title: trimmedTitle,
                type: ContentType.Quiz,
                fileId: null,
                duration: null,
                isPreview,
                status,
            })

            if (!contentRes || (!contentRes.status && !contentRes.isSuccess) || !contentRes.data) {
                setErrorMsg(contentRes?.message || t('quiz.createFailed', 'فشل إنشاء الاختبار.'))
                setSubmitting(false)
                return
            }

            const contentId = contentRes.data

            // Step 2: Create Quiz header with optional questions atomically
            const quizRes = await apiCreateQuiz({
                contentId,
                passingScore: scoreNum,
                questions: formattedQuestions.length > 0 ? formattedQuestions : [],
            })

            if (quizRes?.status || quizRes?.isSuccess) {
                if (quizRes.data) {
                    saveQuizIdMapping(contentId, quizRes.data)
                }
                onSuccess(
                    formattedQuestions.length > 0
                        ? t(
                              'quiz.createWithQuestionsSuccess',
                              `تم إنشاء الاختبار مع ${formattedQuestions.length} سؤال بنجاح!`,
                          )
                        : t('quiz.createSuccess', 'تم إنشاء الاختبار بنجاح! يمكنك إضافة الأسئلة لاحقاً.'),
                )
                onClose()
            } else {
                setErrorMsg(quizRes?.message || t('quiz.createFailed', 'فشل إنشاء الاختبار.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj?.message ||
                    t('common.operationFailed', 'فشلت العملية.'),
            )
        } finally {
            setSubmitting(false)
        }
    }

    const isFormDisabled = !title.trim() || !passingScore || passingScore < 1 || passingScore > 100

    return (
        <Dialog isOpen={isOpen} onClose={onClose} width={720}>
            <div className="p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center gap-3 mb-5 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
                        <HiOutlineAcademicCap className="text-2xl" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {t('quiz.createNewQuizTitle', 'إضافة اختبار وتقييم جديد')}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t(
                                'quiz.createNewQuizSubtitle',
                                'حدد عنوان الاختبار ودرجة النجاح، ويمكنك إضافة أسئلته فوراً أو لاحقاً من المنهاج.',
                            )}
                        </p>
                    </div>
                </div>

                {errorMsg && (
                    <Alert type="danger" className="mb-4">
                        {errorMsg}
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Basic Quiz Settings */}
                    <div className="space-y-4 bg-gray-50/60 dark:bg-gray-850/50 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800">
                        {/* Title Input */}
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                                {t('quiz.quizTitleLabel', 'عنوان الاختبار والتقييم')}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder={t(
                                    'quiz.quizTitlePlaceholder',
                                    'مثال: اختبار نهاية الوحدة الأولى (Module 1 Assessment)',
                                )}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={500}
                                disabled={submitting}
                            />
                        </div>

                        {/* Passing Score Input */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                                    {t('quiz.passingScoreLabel', 'درجة النجاح المطلوبة (%)')}{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={passingScore}
                                    onChange={(e) => setPassingScore(Number(e.target.value))}
                                    placeholder="75"
                                    disabled={submitting}
                                />
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                                    {t(
                                        'quiz.passingScoreHelp',
                                        'النسبة المئوية المطلوبة لاجتياز الاختبار (مثال: 75%)',
                                    )}
                                </span>
                            </div>

                            {/* Status & Preview Selector */}
                            <div className="space-y-2 pt-2 sm:pt-0">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {t('courseManagement.statusAndAccess', 'حالة النشر وصلاحية الوصول')}
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                                            status === ContentItemStatus.Published
                                                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                        onClick={() =>
                                            setStatus(
                                                status === ContentItemStatus.Published
                                                    ? ContentItemStatus.Draft
                                                    : ContentItemStatus.Published,
                                            )
                                        }
                                    >
                                        {status === ContentItemStatus.Published
                                            ? t('courseManagement.published', 'منشور')
                                            : t('courseManagement.draft', 'مسودة')}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={submitting}
                                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${
                                            !isPreview
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                                                : 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                        }`}
                                        onClick={() => setIsPreview(!isPreview)}
                                    >
                                        {!isPreview ? (
                                            <>
                                                <HiOutlineLockClosed className="text-xs shrink-0" />
                                                <span>{t('courseManagement.previewEnrolledOnly', 'مشتركين')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <HiOutlineEye className="text-xs shrink-0" />
                                                <span>{t('courseManagement.freePreviewBadge', 'مجاني')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ========================================== */}
                    {/* Interactive Questions Builder Section */}
                    {/* ========================================== */}
                    <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                    {t('quiz.quizQuestionsSection', 'أسئلة الاختبار')}
                                </h4>
                                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                    {questions.length}{' '}
                                    {questions.length === 1
                                        ? t('quiz.singleQuestion', 'سؤال')
                                        : t('quiz.pluralQuestions', 'أسئلة')}
                                </span>
                            </div>

                            <Button
                                type="button"
                                size="xs"
                                variant="twoTone"
                                icon={<HiOutlinePlus />}
                                disabled={submitting}
                                onClick={handleAddQuestion}
                            >
                                {t('quiz.addQuestionBtn', 'إضافة سؤال')}
                            </Button>
                        </div>

                        {questions.length === 0 ? (
                            <div className="py-6 px-4 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/40 dark:bg-gray-850/30">
                                <HiOutlineQuestionMarkCircle className="text-3xl text-gray-400 mx-auto mb-2" />
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {t('quiz.noQuestionsYetPrompt', 'لم تقم بإضافة أسئلة بعد (اختياري)')}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                                    {t(
                                        'quiz.noQuestionsYetHelp',
                                        'يمكنك إضافة الأسئلة الآن بالضغط على الزر أعلاه، أو حفظ الاختبار وإضافة الأسئلة لاحقاً من واجهة المنهاج.',
                                    )}
                                </p>
                                <Button
                                    type="button"
                                    size="xs"
                                    variant="plain"
                                    className="mt-3 text-indigo-600 hover:text-indigo-700"
                                    icon={<HiOutlinePlus />}
                                    onClick={handleAddQuestion}
                                >
                                    {t('quiz.addFirstQuestionNow', 'إضافة أول سؤال الآن')}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((q, qIndex) => (
                                    <div
                                        key={q.id}
                                        className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800/80 shadow-2xs space-y-3 transition-all"
                                    >
                                        {/* Question Header & Prompt */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                                    {qIndex + 1}
                                                </span>
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    {t('quiz.questionLabel', 'السؤال')}
                                                </span>
                                            </div>

                                            <Tooltip title={t('quiz.deleteQuestionTooltip', 'حذف هذا السؤال')}>
                                                <button
                                                    type="button"
                                                    disabled={submitting}
                                                    onClick={() => handleRemoveQuestion(q.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <HiOutlineTrash className="text-base" />
                                                </button>
                                            </Tooltip>
                                        </div>

                                        <Input
                                            type="text"
                                            placeholder={t(
                                                'quiz.questionPromptPlaceholder',
                                                'اكتب نص السؤال هنا...',
                                            )}
                                            value={q.questionText}
                                            onChange={(e) =>
                                                handleQuestionTextChange(q.id, e.target.value)
                                            }
                                            maxLength={2000}
                                            disabled={submitting}
                                        />

                                        {/* Options List */}
                                        <div className="space-y-2 pt-1">
                                            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
                                                <span>{t('quiz.optionsAndCorrectAnswer', 'خيارات الإجابة (اختر الإجابة الصحيحة):')}</span>
                                                {q.options.length < 6 && (
                                                    <button
                                                        type="button"
                                                        disabled={submitting}
                                                        onClick={() => handleAddOption(q.id)}
                                                        className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                                                    >
                                                        <HiOutlinePlus className="text-xs" />
                                                        <span>{t('quiz.addOptionBtn', 'إضافة خيار')}</span>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                {q.options.map((opt, optIndex) => (
                                                    <div
                                                        key={opt.id}
                                                        className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                                                            opt.isCorrect
                                                                ? 'border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30'
                                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/40'
                                                        }`}
                                                    >
                                                        {/* Radio to mark correct */}
                                                        <Tooltip
                                                            title={
                                                                opt.isCorrect
                                                                    ? t('quiz.isCorrectAnswerBadge', 'هذه هي الإجابة الصحيحة')
                                                                    : t('quiz.setAsCorrectTooltip', 'اضغط لتعيينها كإجابة صحيحة')
                                                            }
                                                        >
                                                            <button
                                                                type="button"
                                                                disabled={submitting}
                                                                onClick={() =>
                                                                    handleSetCorrectOption(q.id, opt.id)
                                                                }
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                                                                    opt.isCorrect
                                                                        ? 'bg-emerald-600 text-white shadow-xs'
                                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                                                }`}
                                                            >
                                                                <HiOutlineCheckCircle className="text-base" />
                                                            </button>
                                                        </Tooltip>

                                                        {/* Option Text Input */}
                                                        <input
                                                            type="text"
                                                            placeholder={`${t('quiz.optionPlaceholder', 'الخيار')} ${optIndex + 1}...`}
                                                            value={opt.optionText}
                                                            onChange={(e) =>
                                                                handleOptionTextChange(
                                                                    q.id,
                                                                    opt.id,
                                                                    e.target.value,
                                                                )
                                                            }
                                                            maxLength={1000}
                                                            disabled={submitting}
                                                            className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden px-1"
                                                        />

                                                        {/* Delete Option Button */}
                                                        {q.options.length > 2 && (
                                                            <button
                                                                type="button"
                                                                disabled={submitting}
                                                                onClick={() =>
                                                                    handleRemoveOption(q.id, opt.id)
                                                                }
                                                                className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                                            >
                                                                <HiOutlineXMark className="text-base" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={submitting}
                            disabled={submitting || isFormDisabled}
                        >
                            {questions.length > 0
                                ? t('quiz.createQuizWithCountBtn', `حفظ وإنشاء الاختبار (${questions.length} أسئلة)`)
                                : t('quiz.createQuizHeaderOnlyBtn', 'إنشاء الاختبار')}
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    )
}

export default CreateQuizModal
