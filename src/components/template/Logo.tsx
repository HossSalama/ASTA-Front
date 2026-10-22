import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'
import { useThemeStore } from '@/store/themeStore'
import type { CommonProps } from '@/@types/common'

interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    logoWidth?: number | string
}

const LOGO_SRC_PATH = '/img/logo/'

const Logo = (props: LogoProps) => {
    const themeMode = useThemeStore((state) => state.mode)
    const {
        type = 'full',
        mode = themeMode || 'light',
        className,
        imgClass,
        style,
        logoWidth = 'auto',
    } = props

    const logoSrc =
        type === 'streamline'
            ? `${LOGO_SRC_PATH}icon.svg`
            : `${LOGO_SRC_PATH}logo-${mode}.svg`

    return (
        <div
            className={classNames('logo', className)}
            style={{
                ...style,
                ...{ width: logoWidth },
            }}
        >
            <img className={imgClass} src={logoSrc} alt={`${APP_NAME} logo`} />
        </div>
    )
}

export default Logo
