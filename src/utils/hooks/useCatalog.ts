import useSWR from 'swr'
import { useLocaleStore } from '@/store/localeStore'
import { useSessionUser } from '@/store/authStore'
import {
    apiGetHomePageData,
    apiGetPublicCourses,
    apiGetPublicCourseDetails,
    apiGetMyEnrolledCourses,
    apiGetPublicInstructors,
    apiGetCatalogCategories,
} from '@/services/CatalogService'
import { apiGetInstructorById } from '@/services/InstructorAdminService'
import type {
    CatalogCourse,
    CatalogSort,
} from '@/services/CatalogService'
import type {
    GetPublicCoursesQueryParams,
    GetPublicInstructorsQueryParams,
} from '@/@types/publicCatalog'
import type {
    EnrollmentFilter,
    EnrollmentFilterValue,
} from '@/@types/courseProgress'
import { isLiveCourse } from '@/@types/courseContent'

const swrOptions = {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    shouldRetryOnError: false,
}

// ==================== 1. Home Page Data ====================
export const useHomePageData = (pageNumber = 1, pageSize = 10) => {
    const locale = useLocaleStore((state) => state.currentLang)
    const { data, error, isLoading, mutate } = useSWR(
        ['catalog/home', pageNumber, pageSize, locale],
        () => apiGetHomePageData(pageNumber, pageSize),
        swrOptions,
    )

    return {
        popularCourses: data?.data?.popularCourses?.items ?? [],
        popularCoursesResult: data?.data?.popularCourses ?? null,
        advertisements: data?.data?.advertisements ?? [],
        totalPopularCount: data?.data?.popularCourses?.totalCount ?? 0,
        totalPages: data?.data?.popularCourses?.totalPages ?? 0,
        pageNumber: data?.data?.popularCourses?.pageNumber ?? pageNumber,
        pageSize: data?.data?.popularCourses?.pageSize ?? pageSize,
        hasPreviousPage: data?.data?.popularCourses?.hasPreviousPage ?? false,
        hasNextPage: data?.data?.popularCourses?.hasNextPage ?? false,
        isLoading,
        error,
        mutate,
    }
}

// ==================== 2. Public Courses Catalog ====================
export const useCatalogCourses = (
    params: GetPublicCoursesQueryParams = {},
) => {
    const locale = useLocaleStore((state) => state.currentLang)
    const { data, error, isLoading, mutate } = useSWR(
        ['catalog/courses', params, locale],
        ([, query]) =>
            apiGetPublicCourses(query as GetPublicCoursesQueryParams),
        swrOptions,
    )

    return {
        courses: data?.data?.items ?? [],
        totalCount: data?.data?.totalCount ?? 0,
        totalPages: data?.data?.totalPages ?? 0,
        pageNumber: data?.data?.pageNumber ?? 1,
        pageSize: data?.data?.pageSize ?? 10,
        hasPreviousPage: data?.data?.hasPreviousPage ?? false,
        hasNextPage: data?.data?.hasNextPage ?? false,
        isLoading,
        error,
        mutate,
    }
}

// ==================== 3. Public Course Details ====================
export const useCatalogCourse = (id?: number) => {
    const locale = useLocaleStore((state) => state.currentLang)
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const userId = useSessionUser((state) => state.user.id)
    const authKey = signedIn ? userId || 'auth' : 'guest'

    const { data, error, isLoading, mutate } = useSWR(
        id ? ['catalog/course', id, locale, authKey] : null,
        ([, courseId]) => apiGetPublicCourseDetails(courseId as number),
        swrOptions,
    )

    return {
        course: data?.data ?? null,
        isLoading,
        error,
        mutate,
    }
}

// ==================== 4. My Enrolled Courses ====================
export const useMyEnrollments = (
    status?: EnrollmentFilter | EnrollmentFilterValue,
) => {
    const locale = useLocaleStore((state) => state.currentLang)
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const userId = useSessionUser((state) => state.user.id)
    const authKey = signedIn ? userId || 'auth' : null

    const { data, error, isLoading, mutate } = useSWR(
        authKey ? ['student/enrollments', status, locale, authKey] : null,
        () => apiGetMyEnrolledCourses(status),
        swrOptions,
    )

    return {
        enrollments: data?.data ?? [],
        isLoading,
        error,
        mutate,
    }
}

// ==================== 5. Public Categories ====================
export const useCatalogCategories = () => {
    const locale = useLocaleStore((state) => state.currentLang)
    const { data, error, isLoading, mutate } = useSWR(
        ['catalog/categories', locale],
        () => apiGetCatalogCategories(),
        swrOptions,
    )

    return {
        categories: data?.data ?? [],
        isLoading,
        error,
        mutate,
    }
}

// ==================== 6. Public Instructors ====================
export const useCatalogInstructors = (
    params: GetPublicInstructorsQueryParams = {},
) => {
    const locale = useLocaleStore((state) => state.currentLang)
    const { data, error, isLoading, mutate } = useSWR(
        ['catalog/instructors', params, locale],
        ([, query]) => apiGetPublicInstructors(query as GetPublicInstructorsQueryParams),
        swrOptions,
    )

    return {
        instructors: data?.data?.items ?? [],
        totalCount: data?.data?.totalCount ?? 0,
        totalPages: data?.data?.totalPages ?? 0,
        isLoading,
        error,
        mutate,
    }
}

export const useCatalogInstructor = (id?: number) => {
    const locale = useLocaleStore((state) => state.currentLang)
    const { data, error, isLoading, mutate } = useSWR(
        id ? ['catalog/instructor', id, locale] : null,
        async ([, instructorId]) => {
            try {
                return await apiGetInstructorById(instructorId as number)
            } catch {
                // If admin endpoint fails for anonymous user, fallback to finding in public instructors list
                const publicRes = await apiGetPublicInstructors({ pageSize: 50 })
                const found = publicRes?.data?.items?.find((i) => i.id === instructorId)
                return {
                    status: Boolean(found),
                    message: '',
                    data: found
                        ? {
                              ...found,
                              isActive: true,
                              createdAt: '',
                              courses: [],
                              isDeleted: false,
                          }
                        : null,
                }
            }
        },
        swrOptions,
    )

    return {
        instructor: data?.data ?? null,
        isLoading,
        error,
        mutate,
    }
}

// ==================== Client-Side Refinement Helper ====================
export const refineCourses = (
    courses: CatalogCourse[],
    options: {
        language?: string
        priceBucket?: 'free' | 'paid'
        minRating?: number
        deliveryType?: 'recorded' | 'live'
        sort?: CatalogSort
    },
) => {
    const { language, priceBucket, minRating, deliveryType, sort } = options

    let result = [...courses]

    if (deliveryType === 'live') {
        result = result.filter((course) => isLiveCourse(course.deliveryType))
    } else if (deliveryType === 'recorded') {
        result = result.filter((course) => !isLiveCourse(course.deliveryType))
    }

    if (language) {
        result = result.filter(
            (course) =>
                (course.language || '').toLowerCase() === language.toLowerCase(),
        )
    }

    if (priceBucket === 'free') {
        result = result.filter((course) => !course.price || course.price <= 0)
    }

    if (priceBucket === 'paid') {
        result = result.filter((course) => (course.price || 0) > 0)
    }

    if (minRating) {
        result = result.filter(
            (course) => (course.averageRating || 0) >= minRating,
        )
    }

    switch (sort) {
        case 'rating':
            result.sort(
                (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
            )
            break
        case 'priceAsc':
            result.sort((a, b) => (a.price || 0) - (b.price || 0))
            break
        case 'priceDesc':
            result.sort((a, b) => (b.price || 0) - (a.price || 0))
            break
        case 'newest':
        default:
            result.sort(
                (a, b) =>
                    new Date(b.createdAt || 0).getTime() -
                    new Date(a.createdAt || 0).getTime(),
            )
    }

    return result
}
