import type { ElementType, ReactNode } from 'react'
import classNames from 'classnames'

interface ContainerProps {
    as?: ElementType
    width?: 'default' | 'narrow' | 'wide'
    className?: string
    children: ReactNode
}

const widths = {
    narrow: 'max-w-3xl',
    default: 'max-w-[1240px]',
    wide: 'max-w-[1440px]',
}

/** Single horizontal rhythm for the whole product. */
const Container = ({
    as: Tag = 'div',
    width = 'default',
    className,
    children,
}: ContainerProps) => (
    <Tag
        className={classNames(
            'mx-auto w-full px-4 sm:px-6 lg:px-8',
            widths[width],
            className,
        )}
    >
        {children}
    </Tag>
)

export default Container
