import { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import appConfig from '@/configs/app.config'

const UserGuard = ({ children }: PropsWithChildren) => {
    const { authenticated } = useAuth()
    const location = useLocation()

    if (!authenticated) {
        return (
            <Navigate
                replace
                to={`${appConfig.unAuthenticatedEntryPath}?${REDIRECT_URL_KEY}=${location.pathname}`}
            />
        )
    }

    return <>{children}</>
}

export default UserGuard
