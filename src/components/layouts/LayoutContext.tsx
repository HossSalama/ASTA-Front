import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { NavigationTree } from '@/@types/navigation'
import appConfig from '@/configs/app.config'

export type LayoutContextProps = {
    navigationTree?: NavigationTree[]
    homePath?: string
    profilePath?: string
    settingsPath?: string
}

const LayoutContext = createContext<LayoutContextProps>({})

export const LayoutProvider = ({
    children,
    value,
}: {
    children: ReactNode
    value: LayoutContextProps
}) => {
    return (
        <LayoutContext.Provider value={value}>
            {children}
        </LayoutContext.Provider>
    )
}

export const useLayoutContext = (): Required<LayoutContextProps> => {
    const context = useContext(LayoutContext)
    return {
        navigationTree: context.navigationTree || [],
        homePath: context.homePath || appConfig.authenticatedEntryPath || '/courses',
        profilePath: context.profilePath || '/user/profile',
        settingsPath: context.settingsPath || '/user/settings',
    }
}

export default LayoutContext
