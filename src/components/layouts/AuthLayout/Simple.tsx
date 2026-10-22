import { cloneElement } from 'react'
import Container from '@/components/shared/Container'
import type { ReactNode, ReactElement } from 'react'
import type { CommonProps } from '@/@types/common'

interface SimpleProps extends CommonProps {
    content?: ReactNode
}

const Simple = ({ children, content, ...rest }: SimpleProps) => {
    return (
        <div className="flex flex-col justify-center py-10 sm:py-14 px-4 sm:px-8 md:px-12 lg:px-16">
            <Container className="flex flex-col flex-auto items-center justify-center min-w-0 w-full my-auto">
                <div className="w-full">
                    {content}
                    {children
                        ? cloneElement(children as ReactElement, {
                              ...rest,
                          })
                        : null}
                </div>
            </Container>
        </div>
    )
}

export default Simple


