import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

const userRoute: Routes = [
    {
        key: 'user.schedule',
        path: '/user/schedule',
        component: lazy(() => import('@/views/site/MySchedule')),
        authority: [],
    },
    {
        key: 'user.profile',
        path: '/user/profile',
        component: lazy(() => import('@/views/user/UserProfile')),
        authority: [],
    },
    {
        key: 'user.settings',
        path: '/user/settings',
        component: lazy(() => import('@/views/user/UserSettings')),
        authority: [],
    },
    {
        key: 'user.changePassword',
        path: '/user/change-password',
        component: lazy(() => import('@/views/user/UserSettings')),
        authority: [],
    },
    {
        key: 'user.changeAvatar',
        path: '/user/change-avatar',
        component: lazy(() => import('@/views/user/UserProfile')),
        authority: [],
    },
    {
        key: 'user.tickets',
        path: '/user/tickets',
        component: lazy(() => import('@/views/user/Tickets')),
        authority: [],
    },
    {
        key: 'user.tickets.details',
        path: '/user/tickets/:id',
        component: lazy(() => import('@/views/user/Tickets/TicketDetails')),
        authority: [],
    },
    {
        key: 'user.paymentRequests',
        path: '/user/payment-requests',
        component: lazy(() => import('@/views/user/PaymentRequests')),
        authority: [],
    },
    {
        key: 'user.studentPaymentRequests',
        path: '/student/payment-requests',
        component: lazy(() => import('@/views/user/PaymentRequests')),
        authority: [],
    },
    {
        key: 'user.paymentRequests.details',
        path: '/user/payment-requests/:id',
        component: lazy(
            () => import('@/views/user/PaymentRequests/PaymentRequestDetails'),
        ),
        authority: [],
    },
]

export default userRoute
