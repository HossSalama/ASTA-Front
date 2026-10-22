import PostLoginLayout from '../PostLoginLayout'
import { LayoutProvider } from '../LayoutContext'
import { userNavigationConfig } from '@/configs/navigation.config'
import { useThemeStore } from '@/store/themeStore'
import type { CommonProps } from '@/@types/common'
import type { LayoutType } from '@/@types/theme'

export interface UserLayoutProps extends CommonProps {
    layoutType?: LayoutType
}

const UserLayout = ({ children, layoutType }: UserLayoutProps) => {
    const currentLayoutType = useThemeStore((state) => state.layout.type)
    const activeLayoutType = layoutType || currentLayoutType

    return (
        <LayoutProvider
            value={{
                navigationTree: userNavigationConfig,
                homePath: '/courses',
                profilePath: '/user/profile',
                settingsPath: '/user/settings',
            }}
        >
            <div className="user-app-layout flex flex-auto flex-col h-full min-h-screen">
                <PostLoginLayout layoutType={activeLayoutType}>
                    {children}
                </PostLoginLayout>
            </div>
        </LayoutProvider>
    )
}

export default UserLayout
