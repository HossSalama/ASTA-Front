import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth'
import appConfig from '@/configs/app.config'
import type { ReactNode } from 'react'

const PublicRoute = ({ children }: { children: ReactNode }) => {
    const { authenticated, user } = useAuth()
    const { pathname } = useLocation()

    const roles = user?.roles || user?.authority || []
    const isAdmin = roles.some((r) => r.toLowerCase() === 'admin')
    const landingPath = isAdmin ? '/admin/users' : appConfig.authenticatedEntryPath

    // List of routes that should ALWAYS be public and NEVER redirect logged-in users away
    // These are part of the core website experience
    const staticPublicPaths = ['/', '/courses', '/instructors', '/about', '/support', '/faq']
    const isStaticPublicPath = staticPublicPaths.some(p => pathname === p || pathname.startsWith('/courses/'))

    if (isStaticPublicPath) {
        return <>{children}</>
    }

    // Auth pages (login, register, etc.) should redirect to landing if already authenticated
    const authPaths = [
        '/sign-in',
        '/login',
        '/sign-up',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/verify-reset-code',
    ]
    const isAuthPage = authPaths.includes(pathname)

    if (authenticated && isAuthPage) {
        return <Navigate replace to={landingPath} />
    }

    return <>{children}</>
}

export default PublicRoute
