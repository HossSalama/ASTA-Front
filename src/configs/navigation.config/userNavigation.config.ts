import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_ITEM,
} from '@/constants/navigation.constant'
import type { NavigationTree } from '@/@types/navigation'

const userNavigationConfig: NavigationTree[] = [
    {
        key: 'userMenu',
        path: '',
        title: 'User Menu',
        translateKey: 'nav.userMenu',
        icon: 'home',
        type: NAV_ITEM_TYPE_TITLE,
        authority: [],
        subMenu: [
            {
                key: 'user.schedule',
                path: '/my-schedule',
                title: 'My Schedule',
                translateKey: 'nav.mySchedule',
                icon: 'schedule',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [],
                subMenu: [],
            },
            {
                key: 'user.tickets',
                path: '/user/tickets',
                title: 'Support Tickets',
                translateKey: 'nav.myTickets',
                icon: 'myTickets',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [],
                subMenu: [],
            },
            {
                key: 'user.paymentRequests',
                path: '/user/payment-requests',
                title: 'My Payment Requests',
                translateKey: 'nav.myPaymentRequests',
                icon: 'paymentRequests',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [],
                subMenu: [],
            },
            {
                key: 'user.notifications',
                path: '/notifications',
                title: 'Notifications',
                translateKey: 'nav.notifications',
                icon: 'notifications',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [],
                subMenu: [],
            },
        ],
    },
]

export default userNavigationConfig
