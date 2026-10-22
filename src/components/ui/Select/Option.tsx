import classNames from 'classnames'
import { HiCheck } from 'react-icons/hi'
import type { ReactNode } from 'react'
import type { OptionProps as ReactSelectOptionProps } from 'react-select'

type DefaultOptionProps<T> = {
    customLabel?: (data: T, label: string) => ReactNode
}

const Option = <T,>(
    props: ReactSelectOptionProps<T> & DefaultOptionProps<T>,
) => {
    const { innerProps, label, isSelected, isDisabled, data, customLabel } =
        props

    return (
        <div
            className={classNames(
                'select-option text-gray-800 dark:text-gray-200',
                !isDisabled &&
                    !isSelected &&
                    'hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-gray-100',
                isSelected && 'text-primary dark:text-primary-mild bg-primary-subtle font-semibold',
                isDisabled && 'opacity-50 cursor-not-allowed',
            )}
            {...innerProps}
        >
            {customLabel ? (
                customLabel(data, label)
            ) : (
                <span className="ml-2">{label}</span>
            )}
            {isSelected && <HiCheck className="text-xl" />}
        </div>
    )
}

export default Option
