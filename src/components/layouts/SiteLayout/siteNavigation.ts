export interface SiteNavItem {
    key: string
    /** i18n key. */
    labelKey: string
    fallback: string
    to: string
}

/** Discovery links — visible to everyone, guest or signed in. */
export const discoveryNav: SiteNavItem[] = [
    {
        key: 'courses',
        labelKey: 'site.nav.courses',
        fallback: 'Courses',
        to: '/courses',
    },
    {
        key: 'categories',
        labelKey: 'site.nav.categories',
        fallback: 'Categories',
        to: '/categories',
    },
    {
        key: 'instructors',
        labelKey: 'site.nav.instructors',
        fallback: 'Instructors',
        to: '/instructors',
    },
]

/** Learning links — only meaningful once signed in. */
export const learnerNav: SiteNavItem[] = [
    {
        key: 'myLearning',
        labelKey: 'site.nav.myLearning',
        fallback: 'My Learning',
        to: '/my-learning',
    },
    {
        key: 'schedule',
        labelKey: 'site.nav.schedule',
        fallback: 'My Schedule',
        to: '/my-schedule',
    },
    {
        key: 'saved',
        labelKey: 'site.nav.saved',
        fallback: 'Wishlist',
        to: '/saved',
    },
    {
        key: 'certificates',
        labelKey: 'site.nav.certificates',
        fallback: 'Certificates',
        to: '/certificates',
    },
    {
        key: 'notifications',
        labelKey: 'site.nav.notifications',
        fallback: 'Notifications',
        to: '/notifications',
    },
]

export const supportNav: SiteNavItem[] = [
    {
        key: 'about',
        labelKey: 'site.nav.about',
        fallback: 'About',
        to: '/about',
    },
    {
        key: 'support',
        labelKey: 'site.nav.support',
        fallback: 'Support',
        to: '/support',
    },
    { key: 'faq', labelKey: 'site.nav.faq', fallback: 'Help & FAQ', to: '/faq' },
]

export const legalNav: SiteNavItem[] = [
    {
        key: 'terms',
        labelKey: 'site.nav.terms',
        fallback: 'Terms of Use',
        to: '/terms',
    },
    {
        key: 'privacy',
        labelKey: 'site.nav.privacy',
        fallback: 'Privacy Policy',
        to: '/privacy',
    },
]
