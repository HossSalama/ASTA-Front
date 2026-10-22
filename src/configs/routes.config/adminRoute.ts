import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

const adminRoute: Routes = [
    {
        key: 'admin.users',
        path: '/admin',
        component: lazy(() => import('@/views/admin/UsersList')),
        authority: ['Admin'],
    },
    {
        key: 'admin.users',
        path: '/admin/users',
        component: lazy(() => import('@/views/admin/UsersList')),
        authority: ['Admin'],
    },
    {
        key: 'admin.courseCategories',
        path: '/admin/course-categories',
        component: lazy(() => import('@/views/admin/CourseCategories')),
        authority: ['Admin'],
    },
    {
        key: 'admin.courseCategories.details',
        path: '/admin/course-categories/:id',
        component: lazy(() => import('@/views/admin/CourseCategoryDetails')),
        authority: ['Admin'],
    },
    {
        key: 'admin.instructors',
        path: '/admin/instructors',
        component: lazy(() => import('@/views/admin/Instructors')),
        authority: ['Admin'],
    },
    {
        key: 'admin.instructors.details',
        path: '/admin/instructors/:id',
        component: lazy(
            () => import('@/views/admin/Instructors/InstructorDetails'),
        ),
        authority: ['Admin'],
    },
    {
        key: 'admin.courses',
        path: '/admin/courses',
        component: lazy(() => import('@/views/admin/Courses')),
        authority: ['Admin'],
    },
    {
        key: 'admin.courses.create',
        path: '/admin/courses/create',
        component: lazy(() => import('@/views/admin/Courses/CourseForm')),
        authority: ['Admin'],
    },
    {
        key: 'admin.courses.edit',
        path: '/admin/courses/:id/edit',
        component: lazy(() => import('@/views/admin/Courses/CourseForm')),
        authority: ['Admin'],
    },
    {
        key: 'admin.courses.details',
        path: '/admin/courses/:id',
        component: lazy(() => import('@/views/admin/Courses/CourseDetails')),
        authority: ['Admin'],
    },
    {
        key: 'admin.advertisements',
        path: '/admin/advertisements',
        component: lazy(() => import('@/views/admin/Advertisements')),
        authority: ['Admin'],
    },
    {
        key: 'admin.faqs',
        path: '/admin/faqs',
        component: lazy(() => import('@/views/admin/Faqs')),
        authority: ['Admin'],
    },
    {
        key: 'admin.faqs.details',
        path: '/admin/faqs/:id',
        component: lazy(() => import('@/views/admin/Faqs/FaqDetails')),
        authority: ['Admin'],
    },
    {
        key: 'admin.tickets',
        path: '/admin/tickets',
        component: lazy(() => import('@/views/admin/Tickets')),
        authority: ['Admin'],
    },
    {
        key: 'admin.tickets.details',
        path: '/admin/tickets/:id',
        component: lazy(() => import('@/views/admin/Tickets/TicketDetails')),
        authority: ['Admin'],
    },
    {
        key: 'admin.ticketTypes',
        path: '/admin/ticket-types',
        component: lazy(() => import('@/views/admin/TicketTypes')),
        authority: ['Admin'],
    },
    {
        key: 'admin.ticketTypes.details',
        path: '/admin/ticket-types/:id',
        component: lazy(
            () => import('@/views/admin/TicketTypes/TicketTypeDetails'),
        ),
        authority: ['Admin'],
    },
    {
        key: 'admin.paymentMethods',
        path: '/admin/payment-methods',
        component: lazy(() => import('@/views/admin/PaymentMethods')),
        authority: ['Admin'],
    },
    {
        key: 'admin.paymentRequests',
        path: '/admin/payment-requests',
        component: lazy(() => import('@/views/admin/PaymentRequests')),
        authority: ['Admin'],
    },
    {
        key: 'admin.paymentRequests.details',
        path: '/admin/payment-requests/:id',
        component: lazy(
            () => import('@/views/admin/PaymentRequests/PaymentRequestDetails'),
        ),
        authority: ['Admin'],
    },
    {
        key: 'admin.users.create',
        path: '/admin/users/create',
        component: lazy(() => import('@/views/admin/UserForm')),
        authority: ['Admin'],
    },
    {
        key: 'admin.users.edit',
        path: '/admin/users/:id/edit',
        component: lazy(() => import('@/views/admin/UserForm')),
        authority: ['Admin'],
    },
    {
        key: 'admin.users.details',
        path: '/admin/users/:id',
        component: lazy(() => import('@/views/admin/UserDetails')),
        authority: ['Admin'],
    },
    {
        key: 'admin.profile',
        path: '/admin/profile',
        component: lazy(() => import('@/views/user/UserProfile')),
        authority: ['Admin'],
    },
    {
        key: 'admin.settings',
        path: '/admin/settings',
        component: lazy(() => import('@/views/user/UserSettings')),
        authority: ['Admin'],
    },
    {
        key: 'admin.changePassword',
        path: '/admin/change-password',
        component: lazy(() => import('@/views/user/UserSettings')),
        authority: ['Admin'],
    },
    {
        key: 'admin.changeAvatar',
        path: '/admin/change-avatar',
        component: lazy(() => import('@/views/user/UserProfile')),
        authority: ['Admin'],
    },
]

export default adminRoute
