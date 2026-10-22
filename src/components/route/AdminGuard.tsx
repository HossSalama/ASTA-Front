import { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import appConfig from '@/configs/app.config'

const AdminGuard = ({ children }: PropsWithChildren) => {
    const { authenticated, user } = useAuth()
    const location = useLocation()

    if (!authenticated) {
        return (
            <Navigate
                replace
                to={`${appConfig.unAuthenticatedEntryPath}?${REDIRECT_URL_KEY}=${location.pathname}`}
            />
        )
    }

    const roles = user?.roles || user?.authority || []
    const isAdmin = roles.some((r) => r.toLowerCase() === 'admin')

    if (!isAdmin) {
        return <Navigate replace to="/access-denied" />
    }

    return <>{children}</>
}

export default AdminGuard
