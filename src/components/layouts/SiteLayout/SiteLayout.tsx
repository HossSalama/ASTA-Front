import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'
import { LayoutProvider } from '../LayoutContext'
import LayoutBase from '@/components/template/LayoutBase'
import { LAYOUT_BLANK } from '@/constants/theme.constant'

import type { CommonProps } from '@/@types/common'

/**
 * Public/learner website shell. Deliberately separate from AdminLayout so the
 * dashboard's navigation patterns never leak into the student experience.
 */
const SiteLayout = ({ children }: CommonProps) => {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo({ top: 0 })
    }, [pathname])

    return (
        <LayoutProvider
            value={{
                homePath: '/',
                profilePath: '/user/profile',
                settingsPath: '/user/settings',
            }}
        >
            <LayoutBase
                type={LAYOUT_BLANK}
                className="flex min-h-dvh flex-col bg-background site-layout"
            >
                <SiteHeader />
                <main id="main-content" className="flex-1">
                    {children}
                </main>
                <SiteFooter />
            </LayoutBase>

        </LayoutProvider>
    )
}

export default SiteLayout
