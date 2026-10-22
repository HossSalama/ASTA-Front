import { Link, useNavigate } from 'react-router-dom'
import {
    TbLock,
    TbLogin,
    TbSchool,
    TbAlertTriangle,
    TbRefresh,
} from 'react-icons/tb'
import Button from '@/components/ui/Button'
import useTranslation from '@/utils/hooks/useTranslation'
import type { ContentAccessErrorCode } from '@/utils/hooks/useContentAccess'

interface ContentAccessGateProps {
    errorCode: ContentAccessErrorCode | null
    errorMessage?: string | null
    courseId?: number
    onRetry?: () => void
}

export const ContentAccessGate = ({
    errorCode,
    errorMessage,
    courseId,
    onRetry,
}: ContentAccessGateProps) => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    if (errorCode === 'UNAUTHORIZED') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                    <TbLock className="text-3xl" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                    {t('learning.loginRequiredTitle', 'Login Required')}
                </h3>
                <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                    {errorMessage ||
                        t(
                            'learning.loginRequiredDesc',
                            'Please sign in to access this course and your enrolled lessons.',
                        )}
                </p>
                <div className="flex items-center gap-3">
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<TbLogin />}
                        onClick={() =>
                            navigate(
                                `/sign-in?redirectUrl=${encodeURIComponent(
                                    courseId
                                        ? `/learn/${courseId}`
                                        : window.location.pathname,
                                )}`,
                            )
                        }
                    >
                        {t('auth.signIn', 'Sign In')}
                    </Button>
                    {courseId && (
                        <Link to={`/courses/${courseId}`}>
                            <Button
                                variant="plain"
                                size="sm"
                                className="border border-border bg-surface hover:bg-surface-alt text-text-primary"
                            >
                                {t('learning.viewCourse', 'View Course')}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        )
    }

    if (errorCode === 'FORBIDDEN') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-4">
                    <TbSchool className="text-3xl" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                    {t('learning.enrollmentRequiredTitle', 'Enrollment Required')}
                </h3>
                <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                    {errorMessage ||
                        t(
                            'learning.enrollmentRequiredDesc',
                            'You must be enrolled in this course to access this lesson.',
                        )}
                </p>
                <div className="flex items-center gap-3">
                    {courseId ? (
                        <Link to={`/courses/${courseId}`}>
                            <Button
                                variant="solid"
                                size="sm"
                                icon={<TbSchool />}
                            >
                                {t('course.enroll', 'Enrol in Course')}
                            </Button>
                        </Link>
                    ) : (
                        <Link to="/courses">
                            <Button variant="solid" size="sm">
                                {t('learning.browse', 'Browse Courses')}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        )
    }

    if (errorCode === 'NOT_PUBLISHED') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-surface-alt text-text-muted flex items-center justify-center mb-4 border border-border">
                    <TbAlertTriangle className="text-3xl" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                    {t('learning.lessonNotAvailable', 'Lesson Not Available')}
                </h3>
                <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                    {errorMessage ||
                        t(
                            'learning.lessonNotAvailableDesc',
                            'This lesson is currently in draft or archived state and cannot be accessed.',
                        )}
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <TbAlertTriangle className="text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
                {t('learning.contentAccessFailed', 'Content Unavailable')}
            </h3>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                {errorMessage ||
                    t(
                        'learning.contentAccessFailedDesc',
                        'Unable to authorize content delivery at this moment.',
                    )}
            </p>
            {onRetry && (
                <Button
                    variant="plain"
                    size="sm"
                    icon={<TbRefresh />}
                    className="border border-border bg-surface hover:bg-surface-alt text-text-primary"
                    onClick={onRetry}
                >
                    {t('common.retry', 'Retry')}
                </Button>
            )}
        </div>
    )
}

export default ContentAccessGate
