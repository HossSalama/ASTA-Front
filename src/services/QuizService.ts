import ApiService from './ApiService'
import type { ApiResponse } from '@/@types/api'
import type {
    StudentQuizResponse,
    SubmitQuizPayload,
    QuizEvaluationResponse,
    QuizAdminDetailsResponse,
    CreateQuizPayload,
    UpdateQuizPayload,
    CreateQuestionPayload,
    UpdateQuestionPayload,
    CreateOptionPayload,
    UpdateOptionPayload,
} from '@/@types/quiz'

/**
 * ==========================================
 * Student Quiz Endpoints
 * ==========================================
 */

/**
 * 1. Retrieves quiz details for an enrolled student.
 * Switches automatically between 'Take' mode and 'Review' mode based on student attempt.
 * GET /api/quizzes/content/{contentId}
 */
export async function apiGetStudentQuiz(contentId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<StudentQuizResponse>>({
        url: `/quizzes/content/${contentId}`,
        method: 'get',
    })
}

/**
 * 2. Submits answers for automated grading, updates course progress,
 * and triggers certificate generation if eligible.
 * POST /api/quizzes/content/{contentId}/submit
 */
export async function apiSubmitQuiz(
    contentId: number,
    payload: SubmitQuizPayload,
) {
    return ApiService.fetchDataWithAxios<
        ApiResponse<QuizEvaluationResponse>,
        SubmitQuizPayload
    >({
        url: `/quizzes/content/${contentId}/submit`,
        method: 'post',
        data: payload,
    })
}

/**
 * ==========================================
 * Admin Quiz Management Endpoints
 * ==========================================
 */

/**
 * 3. Retrieves complete quiz details (including all questions and correct answer flags).
 * GET /api/quizzes/{id}
 */
export async function apiGetAdminQuiz(quizId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<QuizAdminDetailsResponse>>({
        url: `/quizzes/${quizId}`,
        method: 'get',
    })
}

/**
 * 4. Creates a quiz header (with optional initial questions & options) for a content item.
 * POST /api/quizzes
 */
export async function apiCreateQuiz(payload: CreateQuizPayload) {
    return ApiService.fetchDataWithAxios<ApiResponse<number>, CreateQuizPayload>({
        url: '/quizzes',
        method: 'post',
        data: payload,
    })
}

/**
 * 5. Updates quiz header passing score percentage.
 * PUT /api/quizzes/{id}
 */
export async function apiUpdateQuiz(
    quizId: number,
    payload: UpdateQuizPayload,
) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>, UpdateQuizPayload>({
        url: `/quizzes/${quizId}`,
        method: 'put',
        data: payload,
    })
}

/**
 * 6. Soft-deletes a quiz and all associated questions/options.
 * DELETE /api/quizzes/{id}
 */
export async function apiDeleteQuiz(quizId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>>({
        url: `/quizzes/${quizId}`,
        method: 'delete',
    })
}

/**
 * 7. Adds a new question with its choices atomically.
 * POST /api/quizzes/{quizId}/questions
 */
export async function apiCreateQuestion(
    quizId: number,
    payload: CreateQuestionPayload,
) {
    return ApiService.fetchDataWithAxios<ApiResponse<number>, CreateQuestionPayload>({
        url: `/quizzes/${quizId}/questions`,
        method: 'post',
        data: payload,
    })
}

/**
 * 8. Updates question prompt text.
 * PUT /api/quizzes/questions/{questionId}
 */
export async function apiUpdateQuestion(
    questionId: number,
    payload: UpdateQuestionPayload,
) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>, UpdateQuestionPayload>({
        url: `/quizzes/questions/${questionId}`,
        method: 'put',
        data: payload,
    })
}

/**
 * 9. Soft-deletes a question and its options.
 * DELETE /api/quizzes/questions/{questionId}
 */
export async function apiDeleteQuestion(questionId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>>({
        url: `/quizzes/questions/${questionId}`,
        method: 'delete',
    })
}

/**
 * 10. Adds an option to an existing question.
 * POST /api/quizzes/questions/{questionId}/options
 */
export async function apiCreateOption(
    questionId: number,
    payload: CreateOptionPayload,
) {
    return ApiService.fetchDataWithAxios<ApiResponse<number>, CreateOptionPayload>({
        url: `/quizzes/questions/${questionId}/options`,
        method: 'post',
        data: payload,
    })
}

/**
 * 11. Updates option text and correctness flag.
 * PUT /api/quizzes/questions/options/{optionId}
 */
export async function apiUpdateOption(
    optionId: number,
    payload: UpdateOptionPayload,
) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>, UpdateOptionPayload>({
        url: `/quizzes/questions/options/${optionId}`,
        method: 'put',
        data: payload,
    })
}

/**
 * 12. Deletes an option (invariants: min 2 options, cannot delete the only correct option).
 * DELETE /api/quizzes/questions/options/{optionId}
 */
export async function apiDeleteOption(optionId: number) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>>({
        url: `/quizzes/questions/options/${optionId}`,
        method: 'delete',
    })
}

/**
 * 13. Designates an option as the only correct answer.
 * PUT /api/quizzes/questions/{questionId}/correct-option/{optionId}
 */
export async function apiSetCorrectOption(
    questionId: number,
    optionId: number,
) {
    return ApiService.fetchDataWithAxios<ApiResponse<null>>({
        url: `/quizzes/questions/${questionId}/correct-option/${optionId}`,
        method: 'put',
    })
}

/**
 * ==========================================
 * Quiz ID Mapping & Discovery Utilities
 * ==========================================
 */

const QUIZ_ID_MAP_KEY_PREFIX = 'iatc_quiz_id_for_content_'

export function saveQuizIdMapping(contentId: number, quizId: number) {
    if (typeof window === 'undefined' || !contentId || !quizId) return
    try {
        localStorage.setItem(`${QUIZ_ID_MAP_KEY_PREFIX}${contentId}`, String(quizId))
    } catch {
        // Ignore storage errors
    }
}

export function getQuizIdFromMapping(contentId: number): number | null {
    if (typeof window === 'undefined' || !contentId) return null
    try {
        const val = localStorage.getItem(`${QUIZ_ID_MAP_KEY_PREFIX}${contentId}`)
        return val ? Number(val) : null
    } catch {
        return null
    }
}

export function removeQuizIdMapping(contentId: number) {
    if (typeof window === 'undefined' || !contentId) return
    try {
        localStorage.removeItem(`${QUIZ_ID_MAP_KEY_PREFIX}${contentId}`)
    } catch {
        // Ignore storage errors
    }
}

/**
 * Resolves full admin quiz details for a given contentId, handling the ID gap
 * between course content item ID and internal quiz ID.
 */
export async function apiResolveAdminQuiz(
    contentId: number,
    preferredQuizId?: number | null,
): Promise<QuizAdminDetailsResponse | null> {
    // 1. If preferredQuizId is provided, try it first
    if (preferredQuizId && preferredQuizId > 0) {
        try {
            const res = await apiGetAdminQuiz(preferredQuizId)
            if (res && (res.status || (res as any).isSuccess) && res.data) {
                if (res.data.contentId === contentId || !res.data.contentId) {
                    saveQuizIdMapping(contentId, res.data.id)
                    return res.data
                }
            }
        } catch {
            // Continue fallback
        }
    }

    // 2. Check local storage mapping
    const cachedQuizId = getQuizIdFromMapping(contentId)
    if (cachedQuizId && cachedQuizId > 0 && cachedQuizId !== preferredQuizId) {
        try {
            const res = await apiGetAdminQuiz(cachedQuizId)
            if (res && (res.status || (res as any).isSuccess) && res.data) {
                if (res.data.contentId === contentId || !res.data.contentId) {
                    return res.data
                }
            }
        } catch {
            removeQuizIdMapping(contentId)
        }
    }

    // 3. Try contentId directly (in case quizId == contentId)
    if (contentId !== preferredQuizId && contentId !== cachedQuizId) {
        try {
            const res = await apiGetAdminQuiz(contentId)
            if (res && (res.status || (res as any).isSuccess) && res.data) {
                if (res.data.contentId === contentId || !res.data.contentId) {
                    saveQuizIdMapping(contentId, res.data.id)
                    return res.data
                }
            }
        } catch {
            // Continue fallback
        }
    }

    // 4. Try student endpoint fallback
    try {
        const studentRes = await apiGetStudentQuiz(contentId)
        if (
            studentRes &&
            (studentRes.status || (studentRes as any).isSuccess) &&
            studentRes.data?.quizId
        ) {
            const resolvedId = studentRes.data.quizId
            const res = await apiGetAdminQuiz(resolvedId)
            if (res && (res.status || (res as any).isSuccess) && res.data) {
                saveQuizIdMapping(contentId, res.data.id)
                return res.data
            }
        }
    } catch {
        // Continue fallback
    }

    // 5. Intelligent probe discovery:
    // If the quiz exists in the DB, its quiz.Id is an auto-increment integer in the database.
    // We probe IDs in small concurrent batches (e.g. 1..50, and around contentId).
    const candidateIds = new Set<number>()
    for (let i = 1; i <= 50; i++) candidateIds.add(i)
    for (let i = Math.max(1, contentId - 10); i <= contentId + 15; i++) candidateIds.add(i)

    if (preferredQuizId) candidateIds.delete(preferredQuizId)
    if (cachedQuizId) candidateIds.delete(cachedQuizId)
    candidateIds.delete(contentId)

    const idList = Array.from(candidateIds)
    const batchSize = 8
    for (let i = 0; i < idList.length; i += batchSize) {
        const batch = idList.slice(i, i + batchSize)
        const batchPromises = batch.map((id) =>
            apiGetAdminQuiz(id).catch(() => null),
        )
        const responses = await Promise.all(batchPromises)
        for (const res of responses) {
            if (
                res &&
                (res.status || (res as any).isSuccess) &&
                res.data &&
                res.data.contentId === contentId
            ) {
                saveQuizIdMapping(contentId, res.data.id)
                return res.data
            }
        }
    }

    return null
}

