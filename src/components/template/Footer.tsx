export type FooterPageContainerType = 'gutterless' | 'contained'

type FooterProps = {
    pageContainerType?: FooterPageContainerType
    className?: string
}

export default function Footer(props: FooterProps) {
    const { pageContainerType, className } = props
    void pageContainerType
    void className
    return null
}
