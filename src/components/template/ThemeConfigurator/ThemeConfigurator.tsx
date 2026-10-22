import ModeSwitcher from './ModeSwitcher'
import LayoutSwitcher from './LayoutSwitcher'
import ThemeSwitcher from './ThemeSwitcher'
import DirectionSwitcher from './DirectionSwitcher'
import CopyButton from './CopyButton'
import useTranslation from '@/utils/hooks/useTranslation'

export type ThemeConfiguratorProps = {
    callBackClose?: () => void
}

const ThemeConfigurator = ({ callBackClose }: ThemeConfiguratorProps) => {
    const { t } = useTranslation()

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="flex flex-col gap-y-10 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h6>{t('theme.darkMode', 'Dark Mode')}</h6>
                        <span>
                            {t(
                                'theme.switchDarkMode',
                                'Switch theme to dark mode',
                            )}
                        </span>
                    </div>
                    <ModeSwitcher />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h6>{t('theme.direction', 'Direction')}</h6>
                        <span>
                            {t('theme.selectDirection', 'Select a direction')}
                        </span>
                    </div>
                    <DirectionSwitcher callBackClose={callBackClose} />
                </div>
                <div>
                    <h6 className="mb-3">{t('theme.theme', 'Theme')}</h6>
                    <ThemeSwitcher />
                </div>
                <div>
                    <h6 className="mb-3">{t('theme.layout', 'Layout')}</h6>
                    <LayoutSwitcher />
                </div>
            </div>
            <CopyButton />
        </div>
    )
}

export default ThemeConfigurator
