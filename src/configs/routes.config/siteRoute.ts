import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

const siteRoutes: Routes = [
    {
        key: 'site.home',
        path: '/',
        component: lazy(() => import('@/views/site/Home')),
        authority: [],
    },
    {
        key: 'site.courses',
        path: '/courses',
        component: lazy(() => import('@/views/site/Courses')),
        authority: [],
    },
    {
        key: 'site.courseDetails',
        path: '/courses/:courseId',
        component: lazy(() => import('@/views/site/CourseDetails')),
        authority: [],
    },
    {
        key: 'site.categories',
        path: '/categories',
        component: lazy(() => import('@/views/site/Categories')),
        authority: [],
    },
    {
        key: 'site.instructors',
        path: '/instructors',
        component: lazy(() => import('@/views/site/Instructors')),
        authority: [],
    },
    {
        key: 'site.instructorDetails',
        path: '/instructors/:instructorId',
        component: lazy(() => import('@/views/site/InstructorDetails')),
        authority: [],
    },
    {
        key: 'site.search',
        path: '/search',
        component: lazy(() => import('@/views/site/Search')),
        authority: [],
    },
    {
        key: 'site.myLearning',
        path: '/my-learning',
        component: lazy(() => import('@/views/site/MyLearning')),
        authority: [],
    },
    {
        key: 'site.mySchedule',
        path: '/my-schedule',
        component: lazy(() => import('@/views/site/MySchedule')),
        authority: [],
    },
    {
        key: 'site.saved',
        path: '/saved',
        component: lazy(() => import('@/views/site/Saved')),
        authority: [],
    },
    {
        key: 'site.certificates',
        path: '/certificates',
        component: lazy(() => import('@/views/site/Certificates')),
        authority: [],
    },
    {
        key: 'site.certificatesCourse',
        path: '/certificates/course/:id',
        component: lazy(() => import('@/views/site/Certificates')),
        authority: [],
    },
    {
        key: 'site.about',
        path: '/about',
        component: lazy(() => import('@/views/site/About')),
        authority: [],
    },
    {
        key: 'site.support',
        path: '/support',
        component: lazy(() => import('@/views/site/Support')),
        authority: [],
    },
    {
        key: 'site.faq',
        path: '/faq',
        component: lazy(() => import('@/views/site/Legal/FAQ')),
        authority: [],
    },
    {
        key: 'site.terms',
        path: '/terms',
        component: lazy(() => import('@/views/site/Legal/Terms')),
        authority: [],
    },
    {
        key: 'site.privacy',
        path: '/privacy',
        component: lazy(() => import('@/views/site/Legal/Privacy')),
        authority: [],
    },
    {
        key: 'site.learning',
        path: '/learn/:id',
        component: lazy(() => import('@/views/site/LearningPlayer/LearningPlayer')),
        authority: [],
    },
    {
        key: 'site.quiz',
        path: '/courses/:courseId/quiz/:contentId',
        component: lazy(() => import('@/views/site/Quiz/StudentQuizPage')),
        authority: [],
    },
    {
        key: 'site.notifications',
        path: '/notifications',
        component: lazy(() => import('@/views/site/Notifications')),
        authority: [],
    },
    {
        key: 'site.unauthorized',
        path: '/unauthorized',
        component: lazy(() => import('@/views/site/Unauthorized')),
        authority: [],
    },
    {
        key: 'site.notFound',
        path: '*',
        component: lazy(() => import('@/views/site/NotFound')),
        authority: [],
    },
]

export default siteRoutes
