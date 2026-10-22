import adminNavigationConfig from './adminNavigation.config'
import userNavigationConfig from './userNavigation.config'
import type { NavigationTree } from '@/@types/navigation'

export { adminNavigationConfig, userNavigationConfig }

export const getNavigationConfig = (
    pathname: string,
    authority: string[] = [],
): NavigationTree[] => {
    if (pathname.startsWith('/admin')) {
        return adminNavigationConfig
    }
    if (pathname.startsWith('/user')) {
        return userNavigationConfig
    }
    if (authority.some((r) => r.toLowerCase() === 'admin')) {
        return adminNavigationConfig
    }
    return userNavigationConfig
}

const navigationConfig: NavigationTree[] = [
    ...userNavigationConfig,
    ...adminNavigationConfig,
]

export default navigationConfig
