import classNames from 'classnames'
import useTranslation from '@/utils/hooks/useTranslation'
import type { CommonProps } from '../@types/common'
import type { MouseEvent } from 'react'

interface NextProps extends CommonProps {
    currentPage: number
    pageCount: number
    pagerClass: {
        default: string
        inactive: string
        active: string
        disabled: string
    }
    onNext: (e: MouseEvent<HTMLSpanElement>) => void
}

const Next = (props: NextProps) => {
    const { currentPage, pageCount, onNext } = props
    const { t } = useTranslation()

    const disabled = currentPage === pageCount || pageCount === 0

    const onNextClick = (e: MouseEvent<HTMLSpanElement>) => {
        e.preventDefault()
        if (disabled) {
            return
        }
        onNext(e)
    }

    const pagerNextClass = classNames(
        'px-2 sm:px-3 py-1.5 text-xs font-semibold select-none transition-all cursor-pointer inline-flex items-center justify-center',
        disabled
            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed pointer-events-none'
            : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-mild',
    )

    return (
        <span
            className={pagerNextClass}
            role="presentation"
            onClick={onNextClick}
        >
            {t('common.next', 'التالي')}
        </span>
    )
}

export default Next
