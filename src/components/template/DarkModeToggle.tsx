import useDarkMode from '@/utils/hooks/useDarkMode'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2'
import classNames from 'classnames'
import type { CommonProps } from '@/@types/common'

const _DarkModeToggle = ({ className }: CommonProps) => {
    const [isDark, setIsDark] = useDarkMode()

    return (
        <div
            className={classNames(
                className,
                'flex items-center justify-center cursor-pointer text-xl text-gray-600 dark:text-gray-300',
            )}
            onClick={() => setIsDark(isDark ? 'light' : 'dark')}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
            {isDark ? (
                <HiOutlineSun className="text-amber-400 text-xl transition-transform hover:scale-110" />
            ) : (
                <HiOutlineMoon className="text-gray-600 dark:text-gray-300 text-xl transition-transform hover:scale-110" />
            )}
        </div>
    )
}

const DarkModeToggle = withHeaderItem(_DarkModeToggle)

export default DarkModeToggle
