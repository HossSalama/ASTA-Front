import PostLoginLayout from '../PostLoginLayout'
import { LayoutProvider } from '../LayoutContext'
import { adminNavigationConfig } from '@/configs/navigation.config'
import { useThemeStore } from '@/store/themeStore'
import type { CommonProps } from '@/@types/common'
import type { LayoutType } from '@/@types/theme'

export interface AdminLayoutProps extends CommonProps {
    layoutType?: LayoutType
}

const AdminLayout = ({ children, layoutType }: AdminLayoutProps) => {
    const currentLayoutType = useThemeStore((state) => state.layout.type)
    const activeLayoutType = layoutType || currentLayoutType

    return (
        <LayoutProvider
            value={{
                navigationTree: adminNavigationConfig,
                homePath: '/admin/users',
                profilePath: '/admin/profile',
                settingsPath: '/admin/settings',
            }}
        >
            <div className="admin-app-layout flex flex-auto flex-col h-full min-h-screen">
                <PostLoginLayout layoutType={activeLayoutType}>
                    {children}
                </PostLoginLayout>
            </div>
        </LayoutProvider>
    )
}

export default AdminLayout
