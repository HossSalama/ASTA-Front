import { Link } from 'react-router-dom'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import StateView from '@/components/shared/catalog/StateView'
import CourseGridSkeleton from '@/components/shared/catalog/CourseGridSkeleton'
import { useCertificates } from '@/utils/hooks/useCertificates'
import useTranslation from '@/utils/hooks/useTranslation'
import { formatDate, formatDuration } from '@/utils/catalog'
import {
    HiOutlineAcademicCap,
    HiOutlineArrowTopRightOnSquare,
    HiOutlineBookOpen,
    HiOutlineClock,
    HiOutlineShieldCheck,
} from 'react-icons/hi2'
import type { StudentCertificateResponse } from '@/@types/courseProgress'

/**
 * Official Student Completion Certificates Page.
 * Calls GET /api/certificates/my to retrieve all verified certificates
 * automatically issued upon 100% course completion and passing score requirements.
 */
const Certificates = () => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const { certificates, isLoading, error, mutate } = useCertificates()

    return (
        <main className="py-8 md:py-12">
            <Container>
                <header className="mb-8 max-w-2xl">
                    <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
                        {t('site.certificates.title', 'Certificates')}
                    </h1>
                    <p className="mt-2 text-text-secondary">
                        {t(
                            'site.certificates.subtitle',
                            'Every course you have completed, with the date you finished it.',
                        )}
                    </p>
                </header>

                {error ? (
                    <StateView
                        tone="error"
                        title={t(
                            'site.certificates.errorTitle',
                            'We could not load your certificates',
                        )}
                        description={t(
                            'site.certificates.errorDesc',
                            'Please refresh the page or try again shortly.',
                        )}
                        action={
                            <Button size="sm" onClick={() => mutate()}>
                                {t('common.retry', 'Retry')}
                            </Button>
                        }
                    />
                ) : isLoading ? (
                    <CourseGridSkeleton count={3} />
                ) : certificates.length === 0 ? (
                    <StateView
                        tone="empty"
                        title={t(
                            'site.certificates.emptyTitle',
                            'No certificates yet',
                        )}
                        description={t(
                            'site.certificates.emptyDescription',
                            'Finish all lessons and required quizzes in a course to earn your verified certificate.',
                        )}
                        action={{
                            label: t(
                                'site.certificates.startLearning',
                                'Browse courses',
                            ),
                            to: '/courses',
                        }}
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {certificates.map(
                            (cert: StudentCertificateResponse) => (
                                <div
                                    key={cert.certificateId}
                                    className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md"
                                >
                                    <div>
                                        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border/70">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                <HiOutlineShieldCheck className="text-sm shrink-0" />
                                                {t(
                                                    'site.certificates.completed',
                                                    'Completed',
                                                )}
                                            </span>
                                            <span className="font-mono text-xs text-text-secondary">
                                                {cert.certificateNumber}
                                            </span>
                                        </div>

                                        <div className="mt-4">
                                            <h2 className="text-xl font-bold tracking-tight text-text-primary">
                                                {cert.courseName}
                                            </h2>
                                            {cert.studentName && (
                                                <p className="mt-1 text-sm text-text-secondary">
                                                    {cert.studentName}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                                            {cert.completionDate && (
                                                <span>
                                                    {t(
                                                        'site.certificates.issuedOn',
                                                        'Issued',
                                                    )}
                                                    :{' '}
                                                    <strong className="text-text-primary">
                                                        {formatDate(
                                                            cert.completionDate,
                                                            lang,
                                                        )}
                                                    </strong>
                                                </span>
                                            )}
                                            {Boolean(
                                                cert.courseDurationSeconds,
                                            ) && (
                                                <span className="flex items-center gap-1">
                                                    <HiOutlineClock className="text-sm" />
                                                    {formatDuration(
                                                        cert.courseDurationSeconds,
                                                        lang,
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
                                        {cert.verificationUrl && (
                                            <a
                                                href={cert.verificationUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 min-w-[140px]"
                                            >
                                                <Button
                                                    size="sm"
                                                    variant="solid"
                                                    className="w-full"
                                                    icon={
                                                        <HiOutlineArrowTopRightOnSquare />
                                                    }
                                                >
                                                    {t(
                                                        'site.certificates.verify',
                                                        'Verify Certificate',
                                                    )}
                                                </Button>
                                            </a>
                                        )}
                                        <Link
                                            to={`/learn/${cert.courseId}`}
                                            className="flex-1 min-w-[140px]"
                                        >
                                            <Button
                                                size="sm"
                                                variant="plain"
                                                className="w-full border border-border"
                                                icon={<HiOutlineBookOpen />}
                                            >
                                                {t(
                                                    'site.certificates.review',
                                                    'Review course',
                                                )}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                )}
            </Container>
        </main>
    )
}

export default Certificates
