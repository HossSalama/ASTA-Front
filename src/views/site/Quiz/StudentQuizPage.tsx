import { useParams, useNavigate, Link } from 'react-router-dom'
import Container from '@/components/shared/Container'
import QuizPlayer from '@/components/shared/course/QuizPlayer'
import Button from '@/components/ui/Button'
import useTranslation from '@/utils/hooks/useTranslation'
import { useEnrollmentStore } from '@/store/enrollmentStore'
import classNames from 'classnames'
import {
    HiOutlineArrowLeft,
    HiOutlineBookOpen,
} from 'react-icons/hi2'

const StudentQuizPage = () => {
    const { courseId, contentId } = useParams<{ courseId: string; contentId: string }>()
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'

    const numericCourseId = Number(courseId)
    const numericContentId = Number(contentId)
    const markItemComplete = useEnrollmentStore((state) => state.markItemComplete)

    if (!numericContentId) {
        return (
            <Container className="py-12 text-center">
                <p className="text-neutral-400">
                    {t('quiz.invalidContent', 'Invalid quiz identifier.')}
                </p>
                <Link to={numericCourseId ? `/courses/${numericCourseId}` : '/courses'}>
                    <Button variant="solid" size="sm" className="mt-4">
                        {t('learning.backToCourse', 'Back to course')}
                    </Button>
                </Link>
            </Container>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white pb-16">
            {/* Top Navigation Bar */}
            <header className="border-b border-white/10 bg-neutral-900 px-4 py-3.5 sm:px-6">
                <Container className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            to={numericCourseId ? `/learn/${numericCourseId}?item=${numericContentId}` : `/courses/${numericCourseId}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                            aria-label={t('learning.backToCourse', 'Back to course')}
                        >
                            <HiOutlineArrowLeft className={classNames('text-lg', isRtl && 'rotate-180')} />
                        </Link>
                        <div>
                            <span className="text-xs text-white/50 block">
                                {t('quiz.assessment', 'Assessment Quiz')}
                            </span>
                            <span className="text-sm font-semibold text-white">
                                {t('quiz.courseQuizHeader', 'Course Quiz')}
                            </span>
                        </div>
                    </div>

                    {numericCourseId ? (
                        <Link to={`/learn/${numericCourseId}?item=${numericContentId}`}>
                            <Button
                                size="xs"
                                variant="plain"
                                icon={<HiOutlineBookOpen />}
                                className="text-white/80 hover:text-white border border-white/10 bg-white/5"
                            >
                                {t('quiz.openInCoursePlayer', 'Open in Course Player')}
                            </Button>
                        </Link>
                    ) : null}
                </Container>
            </header>

            {/* Main Quiz Content */}
            <main className="py-6">
                <QuizPlayer
                    contentId={numericContentId}
                    courseId={numericCourseId}
                    onQuizCompleted={() => {
                        if (numericCourseId && numericContentId) {
                            markItemComplete(numericCourseId, numericContentId)
                        }
                    }}
                    onNextLesson={() => {
                        if (numericCourseId) {
                            navigate(`/learn/${numericCourseId}`)
                        }
                    }}
                    hasNextLesson={Boolean(numericCourseId)}
                />
            </main>
        </div>
    )
}

export default StudentQuizPage
