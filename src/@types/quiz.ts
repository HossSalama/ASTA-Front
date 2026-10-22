// ==========================================
// Student Interfaces
// ==========================================

export type QuizDisplayMode = 'Take' | 'Review'

export interface StudentQuizOption {
    id: number
    optionText: string
    /**
     * Only present in 'Review' mode.
     * In 'Take' mode, this field is strictly omitted/undefined for exam integrity.
     */
    isCorrect?: boolean
}

export interface StudentQuizQuestion {
    id: number
    questionText: string
    /** Present only in 'Review' mode (the option ID chosen by the student, or null if left blank) */
    selectedOptionId?: number | null
    /** Present only in 'Review' mode (the actual correct option ID) */
    correctOptionId?: number | null
    /** Present only in 'Review' mode (whether student's answer was correct) */
    isCorrect?: boolean | null
    options: StudentQuizOption[]
}

export interface StudentQuizEvaluationSummary {
    scorePercentage: number // e.g. 85.0 (0 to 100)
    correctAnswersCount: number // e.g. 17
    totalQuestionsCount: number // e.g. 20
    passed: boolean // true if scorePercentage >= passingScore
    submittedAt: string // ISO 8601 UTC timestamp
}

export interface StudentQuizResponse {
    mode: QuizDisplayMode // 'Take' if unsubmitted, 'Review' if submitted
    quizId: number
    contentId: number
    title: string // Derived from the course content item title
    passingScore: number // Required percentage to pass (e.g. 70)
    totalQuestions: number
    isCompleted: boolean // false in Take mode, true in Review mode
    courseProgressPercentage: number // Student's overall course progress (0.0 to 100.0)
    evaluation?: StudentQuizEvaluationSummary | null // null in Take mode, populated in Review mode
    questions: StudentQuizQuestion[]
}

export interface SubmittedAnswerItem {
    questionId: number
    selectedOptionId: number | null // null if student skips or leaves unanswered
}

export interface SubmitQuizPayload {
    answers: SubmittedAnswerItem[]
}

export interface QuestionBreakdownItem {
    questionId: number
    questionText: string
    selectedOptionId: number | null
    correctOptionId: number | null
    isCorrect: boolean
}

export interface QuizEvaluationResponse {
    scorePercentage: number
    correctAnswersCount: number
    totalQuestionsCount: number
    passed: boolean
    submittedAt: string
    breakdown: QuestionBreakdownItem[]
    isCompleted: boolean
    courseProgressPercentage: number
}

// ==========================================
// Admin Interfaces
// ==========================================

export interface CreateQuestionOptionPayload {
    optionText: string
    isCorrect: boolean
}

export interface CreateQuestionPayload {
    questionText: string
    options: CreateQuestionOptionPayload[]
}

export interface CreateQuizPayload {
    contentId: number
    passingScore: number
    questions?: CreateQuestionPayload[]
}

export interface UpdateQuizPayload {
    passingScore: number
}

export interface UpdateQuestionPayload {
    questionText: string
}

export interface CreateOptionPayload {
    optionText: string
    isCorrect: boolean
}

export interface UpdateOptionPayload {
    optionText: string
    isCorrect: boolean
}

export interface AdminQuizOption {
    id: number
    optionText: string
    isCorrect: boolean
}

export interface AdminQuizQuestion {
    id: number
    questionText: string
    options: AdminQuizOption[]
}

export interface QuizAdminDetailsResponse {
    id: number
    contentId: number
    title: string
    passingScore: number
    questions: AdminQuizQuestion[]
}
