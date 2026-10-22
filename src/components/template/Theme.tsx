import ConfigProvider from '@/components/ui/ConfigProvider'
import { themeConfig } from '@/configs/theme.config'
import useDarkMode from '@/utils/hooks/useDarkMode'
import useThemeSchema from '@/utils/hooks/useThemeSchema'
import useLocale from '@/utils/hooks/useLocale'
import useDirection from '@/utils/hooks/useDirection'
import { useThemeStore } from '@/store/themeStore'
import type { CommonProps } from '@/@types/common'

const Theme = (props: CommonProps) => {
    useThemeSchema()
    useDarkMode()
    const [direction] = useDirection()

    const { locale } = useLocale()
    const mode = useThemeStore((state) => state.mode)

    return (
        <ConfigProvider
            value={{
                ...themeConfig,
                locale: locale,
                direction: direction,
                mode: mode,
            }}
        >
            {props.children}
        </ConfigProvider>
    )
}

export default Theme
