import classNames from 'classnames'
import useTranslation from '@/utils/hooks/useTranslation'
import type { CommonProps } from '../@types/common'
import type { MouseEvent } from 'react'

interface PrevProps extends CommonProps {
    currentPage: number
    pagerClass: {
        default: string
        inactive: string
        active: string
        disabled: string
    }
    onPrev: (e: MouseEvent<HTMLSpanElement>) => void
}

const Prev = (props: PrevProps) => {
    const { currentPage, onPrev } = props
    const { t } = useTranslation()

    const disabled = currentPage <= 1

    const onPrevClick = (e: MouseEvent<HTMLSpanElement>) => {
        if (disabled) {
            return
        }
        onPrev(e)
    }

    const pagerPrevClass = classNames(
        'px-2 sm:px-3 py-1.5 text-xs font-semibold select-none transition-all cursor-pointer inline-flex items-center justify-center',
        disabled
            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed pointer-events-none'
            : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-mild',
    )

    return (
        <span
            className={pagerPrevClass}
            role="presentation"
            onClick={onPrevClick}
        >
            {t('common.prev', 'السابق')}
        </span>
    )
}

export default Prev
