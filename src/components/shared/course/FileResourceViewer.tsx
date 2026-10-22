import { useState, useEffect, useRef } from 'react'
import {
    TbFileText,
    TbDownload,
    TbExternalLink,
    TbFileTypePdf,
    TbFileTypeZip,
    TbEye,
    TbFile,
} from 'react-icons/tb'
import classNames from 'classnames'
import Button from '@/components/ui/Button'
import Loading from '@/components/shared/Loading'
import useTranslation from '@/utils/hooks/useTranslation'
import { useContentAccess } from '@/utils/hooks/useContentAccess'
import ContentAccessGate from './ContentAccessGate'

interface FileResourceViewerProps {
    contentId: number
    title?: string
    courseId?: number
    className?: string
    hideTitle?: boolean
    onFileCompleted?: (contentId: number, courseProgressPercentage?: number) => void
}

export const FileResourceViewer = ({
    contentId,
    title,
    courseId,
    className,
    hideTitle = false,
    onFileCompleted,
}: FileResourceViewerProps) => {
    const { t } = useTranslation()
    const {
        signedUrl,
        isLoading,
        error,
        errorCode,
        data: accessData,
        refetch,
    } = useContentAccess(contentId)

    const [showInlineViewer, setShowInlineViewer] = useState<boolean>(false)

    // Stable ref so the effect never re-runs just because the parent
    // recreated the inline callback (which happens on every re-render).
    const onFileCompletedRef = useRef(onFileCompleted)
    useEffect(() => {
        onFileCompletedRef.current = onFileCompleted
    })

    // Track whether we already reported this access grant so we call
    // onFileCompleted exactly once per contentId, even if the parent
    // re-renders and provides a new callback reference.
    const reportedRef = useRef(false)
    useEffect(() => {
        // Reset guard when the content item changes
        reportedRef.current = false
    }, [contentId])

    // Notify completion when file access is granted — fires only once
    useEffect(() => {
        if (accessData?.accessGranted && !reportedRef.current) {
            reportedRef.current = true
            onFileCompletedRef.current?.(contentId, accessData.courseProgressPercentage)
        }
    }, [accessData, contentId])


    // Trigger direct file download from signed R2 URL per doc Section 7.1
    const handleDownload = () => {
        if (!signedUrl) return
        const link = document.createElement('a')
        link.href = signedUrl
        link.setAttribute('download', title || 'resource')
        link.setAttribute('target', '_blank')
        link.setAttribute('rel', 'noopener noreferrer')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleOpenInNewTab = () => {
        if (!signedUrl) return
        window.open(signedUrl, '_blank', 'noopener,noreferrer')
    }

    const isPdf =
        title?.toLowerCase().endsWith('.pdf') ||
        signedUrl?.toLowerCase().includes('.pdf')

    if (isLoading) {
        return (
            <div
                className={classNames(
                    'flex min-h-[380px] w-full flex-col items-center justify-center bg-surface/50 p-8 text-text-primary',
                    className,
                )}
            >
                <Loading loading={true} />
                <p className="mt-3 text-xs text-text-secondary">
                    {t('learning.loadingResource', 'Preparing downloadable resource…')}
                </p>
            </div>
        )
    }

    if (error && !signedUrl) {
        return (
            <div
                className={classNames(
                    'flex min-h-[380px] w-full items-center justify-center bg-surface p-8 text-text-primary',
                    className,
                )}
            >
                <ContentAccessGate
                    errorCode={errorCode}
                    errorMessage={error}
                    courseId={courseId}
                    onRetry={refetch}
                />
            </div>
        )
    }

    return (
        <div
            className={classNames(
                'flex flex-col w-full overflow-hidden rounded-xl border border-border bg-surface shadow-sm',
                className,
            )}
        >
            {/* Main Header & Download Box */}
            <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-5 border border-purple-500/20 shadow-xs">
                    {isPdf ? (
                        <TbFileTypePdf className="text-5xl" />
                    ) : title?.toLowerCase().endsWith('.zip') ? (
                        <TbFileTypeZip className="text-5xl" />
                    ) : (
                        <TbFileText className="text-5xl" />
                    )}
                </div>

                {!hideTitle && (
                    <>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25 mb-3">
                            {t('learning.downloadableResource', 'Downloadable Resource')}
                        </span>

                        <h2 className="text-xl sm:text-2xl font-bold text-text-primary max-w-xl mb-3">
                            {title || t('learning.courseResource', 'Course Resource File')}
                        </h2>
                    </>
                )}

                <p className="text-xs sm:text-sm text-text-secondary max-w-md mb-8 leading-relaxed">
                    {t(
                        'learning.resourceDownloadDesc',
                        'This lesson provides a downloadable reference material, workbook, or source code file.',
                    )}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                        variant="solid"
                        size="md"
                        icon={<TbDownload />}
                        onClick={handleDownload}
                        className="shadow-md hover:shadow-primary/20"
                    >
                        {t('learning.downloadFile', 'Download File')}
                    </Button>

                    <Button
                        variant="plain"
                        size="md"
                        icon={<TbExternalLink />}
                        onClick={handleOpenInNewTab}
                        className="border border-border bg-surface hover:bg-surface-alt text-text-primary"
                    >
                        {t('learning.openInNewTab', 'Open in New Tab')}
                    </Button>

                    {isPdf && (
                        <Button
                            variant="plain"
                            size="md"
                            icon={<TbEye />}
                            onClick={() => setShowInlineViewer((prev) => !prev)}
                            className="border border-border bg-surface hover:bg-surface-alt text-text-primary"
                        >
                            {showInlineViewer
                                ? t('learning.hideInlineViewer', 'Hide Preview')
                                : t('learning.showInlineViewer', 'Preview Inline')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Optional Embedded PDF Viewer */}
            {isPdf && showInlineViewer && signedUrl && (
                <div className="border-t border-border bg-background-secondary p-4">
                    <div className="h-[650px] w-full overflow-hidden rounded-lg bg-surface border border-border">
                        <iframe
                            src={signedUrl}
                            title={title || 'Document Preview'}
                            className="h-full w-full border-0"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default FileResourceViewer
