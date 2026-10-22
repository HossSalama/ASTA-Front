import authRoute from '@/configs/routes.config/authRoute'
import { useLocation } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import LayoutBase from '@/components/template/LayoutBase'
import { LAYOUT_BLANK } from '@/constants/theme.constant'
import type { CommonProps } from '@/@types/common'


const PreLoginLayout = ({ children }: CommonProps) => {
    const location = useLocation()

    const { pathname } = location

    const isAuthPath = authRoute.some((route) => route.path === pathname)

    return (
        <LayoutBase
            type={LAYOUT_BLANK}
            className="flex flex-auto flex-col pre-login-layout"
        >
            {isAuthPath ? <AuthLayout>{children}</AuthLayout> : children}
        </LayoutBase>

    )
}

export default PreLoginLayout
