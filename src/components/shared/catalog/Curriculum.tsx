import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import {
    TbChevronDown,
    TbPlayerPlay,
    TbFileText,
    TbCircleCheckFilled,
    TbLock,
    TbClock,
    TbClipboardCheck,
    TbVideo,
    TbExternalLink,
    TbMapPin,
    TbCalendar,
} from 'react-icons/tb'
import dayjs from 'dayjs'
import { formatDuration, formatVideoTimestamp } from '@/utils/catalog'
import {
    ContentType,
    isOnlineDeliveryMode,
    isLiveSessionItem,
} from '@/@types/courseContent'
import type {
    AdminCourseSectionDto,
    AdminCourseContentItemDto,
} from '@/@types/courseContent'
import type {
    CourseSection,
    CourseSectionItem,
} from '@/@types/publicCatalog'

type AnySection = CourseSection | AdminCourseSectionDto
type AnySectionItem = CourseSectionItem | AdminCourseContentItemDto

interface CurriculumProps {
    sections: AnySection[]
    /** Ids the learner has completed. */
    completedItemIds?: number[]
    activeItemId?: number
    /** When false, non-preview lessons are presented as locked. */
    unlocked?: boolean
    onSelectItem?: (item: AnySectionItem) => void
    className?: string
}

export const flattenItems = (sections: AnySection[] = []): AnySectionItem[] =>
    sections.flatMap((section) => (section.items || []) as AnySectionItem[])

export const sectionDuration = (section: AnySection) =>
    (section.items || []).reduce((total, item) => total + (item.duration || 0), 0)

/**
 * One curriculum implementation shared by the course landing page (read-only,
 * preview-gated) and the learning workspace (navigable, progress-aware).
 */
const Curriculum = ({
    sections,
    completedItemIds = [],
    activeItemId,
    unlocked = false,
    onSelectItem,
    className,
}: CurriculumProps) => {
    const { t, i18n } = useTranslation()
    const [openIds, setOpenIds] = useState<number[]>(() =>
        sections.length ? [sections[0].id] : [],
    )

    const toggle = (id: number) =>
        setOpenIds((state) =>
            state.includes(id)
                ? state.filter((item) => item !== id)
                : [...state, id],
        )

    return (
        <div
            className={classNames(
                'divide-y divide-border rounded-lg border border-border bg-surface',
                className,
            )}
        >
            {sections.map((section, index) => {
                const items = section.items || []
                const open = openIds.includes(section.id)
                const done = items.filter((item) =>
                    completedItemIds.includes(item.id),
                ).length

                return (
                    <section key={section.id}>
                        <h3>
                            <button
                                type="button"
                                aria-expanded={open}
                                aria-controls={`section-${section.id}`}
                                className="flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-surface-alt focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                                onClick={() => toggle(section.id)}
                            >
                                <TbChevronDown
                                    className={classNames(
                                        'shrink-0 text-text-muted transition-transform',
                                        open && 'rotate-180',
                                    )}
                                    aria-hidden="true"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-text-primary">
                                        {index + 1}. {section.title}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-text-secondary">
                                        {t('curriculum.lessonCount', {
                                            defaultValue: '{{count}} lessons',
                                            count: items.length,
                                        })}
                                        {' · '}
                                        {formatDuration(
                                            sectionDuration(section),
                                            i18n.language,
                                        )}
                                        {completedItemIds.length > 0 && (
                                            <>
                                                {' · '}
                                                {t('curriculum.doneOf', {
                                                    defaultValue:
                                                        '{{done}}/{{total}} done',
                                                    done,
                                                    total: items.length,
                                                })}
                                            </>
                                        )}
                                    </span>
                                </span>
                            </button>
                        </h3>

                        {open && (
                            <ul
                                id={`section-${section.id}`}
                                className="divide-y divide-border border-t border-border bg-surface-alt/30 p-2 space-y-1"
                            >
                                {items.length === 0 && (
                                    <li className="px-4 py-3 text-sm text-text-muted">
                                        {t(
                                            'curriculum.emptySection',
                                            'No lessons published in this section yet.',
                                        )}
                                    </li>
                                )}
                                {items.map((item, itemIdx) => {
                                    const complete = completedItemIds.includes(
                                        item.id,
                                    )
                                    const accessible =
                                        unlocked || item.isPreview
                                    const active = activeItemId === item.id
                                    const isLive = isLiveSessionItem(item.type)
                                    const isVideo =
                                        !isLive &&
                                        (item.type === ContentType.Video ||
                                            item.type === 'Video' ||
                                            String(item.type) === '1')
                                    const isQuiz =
                                        !isLive &&
                                        (item.type === ContentType.Quiz ||
                                            item.type === 'Quiz' ||
                                            String(item.type) === '3')

                                    const iconBgClass = complete
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                        : !accessible
                                          ? 'bg-surface-alt text-text-muted'
                                          : isLive
                                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                            : isQuiz
                                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                                              : isVideo
                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                                                : 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'

                                    const Icon = complete
                                        ? TbCircleCheckFilled
                                        : !accessible
                                          ? TbLock
                                          : isLive
                                            ? TbVideo
                                            : isQuiz
                                              ? TbClipboardCheck
                                              : isVideo
                                                ? TbPlayerPlay
                                                : TbFileText

                                    const content = (
                                        <div className="flex w-full items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={classNames(
                                                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                                                        iconBgClass,
                                                    )}
                                                >
                                                    <Icon
                                                        className="text-lg"
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <h5 className="text-sm font-semibold text-text-primary truncate">
                                                            {item.title}
                                                        </h5>
                                                        <span className="text-xs text-text-muted font-semibold">
                                                            .{itemIdx + 1}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-text-secondary flex-wrap">
                                                        {isLive ? (
                                                            <div className="flex items-center gap-2 flex-wrap text-xs">
                                                                <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                                                                    <span className="relative flex h-1.5 w-1.5">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                                                    </span>
                                                                    {t('liveSessions.liveSession', 'جلسة مباشرة')}
                                                                </span>
                                                                {item.liveSession?.scheduledStartTime && (
                                                                    <span className="text-text-muted text-[11px] flex items-center gap-1">
                                                                        <TbCalendar className="text-xs" />
                                                                        {dayjs(item.liveSession.scheduledStartTime).format('DD/MM/YYYY hh:mm A')}
                                                                    </span>
                                                                )}
                                                                {item.liveSession?.deliveryMode !== undefined && (
                                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-alt text-text-secondary">
                                                                        {isOnlineDeliveryMode(item.liveSession.deliveryMode)
                                                                            ? t('liveSessions.online', 'أونلاين')
                                                                            : t('liveSessions.offline', 'حضوري')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : Boolean(item.duration) ? (
                                                            <span className="flex items-center gap-1 dir-ltr text-text-muted font-mono text-[12px]">
                                                                <TbClock
                                                                    className="text-xs"
                                                                    aria-hidden="true"
                                                                />
                                                                {formatVideoTimestamp(
                                                                    item.duration,
                                                                )}
                                                            </span>
                                                        ) : isQuiz ? (
                                                            <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                                                                {t(
                                                                    'quiz.assessment',
                                                                    'Assessment Quiz',
                                                                )}
                                                            </span>
                                                        ) : !isVideo ? (
                                                            <span className="text-purple-600 dark:text-purple-400 font-medium text-[11px]">
                                                                {t(
                                                                    'courseManagement.downloadableResource',
                                                                    'Downloadable resource',
                                                                )}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {isLive && accessible && (
                                                    item.liveSession?.meetingUrl ? (
                                                        <a
                                                            href={item.liveSession.meetingUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 transition-colors"
                                                        >
                                                            <TbExternalLink className="text-sm" />
                                                            <span>{t('liveSessions.joinSession', 'انضم للجلسة')}</span>
                                                        </a>
                                                    ) : item.liveSession?.locationUrl ? (
                                                        <a
                                                            href={item.liveSession.locationUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 transition-colors"
                                                        >
                                                            <TbMapPin className="text-sm" />
                                                            <span>{t('liveSessions.viewLocation', 'موقع الحضور')}</span>
                                                        </a>
                                                    ) : null
                                                )}
                                                {item.isPreview && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        {t(
                                                            'curriculum.preview',
                                                            'Preview',
                                                        )}
                                                    </span>
                                                )}
                                                {!accessible && (
                                                    <span className="text-text-muted p-1">
                                                        <TbLock
                                                            className="text-sm"
                                                            aria-hidden="true"
                                                        />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )

                                    const base =
                                        'flex w-full items-center p-2.5 rounded-lg text-start transition-colors bg-surface hover:bg-surface-alt border border-border/60'

                                    return (
                                        <li key={item.id} className="list-none">
                                            {onSelectItem ? (
                                                <button
                                                    type="button"
                                                    aria-current={
                                                        active
                                                            ? 'true'
                                                            : undefined
                                                    }
                                                    className={classNames(
                                                        base,
                                                        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
                                                        active
                                                            ? 'border-primary bg-primary-subtle/30 font-semibold'
                                                            : '',
                                                        !accessible && 'opacity-85 hover:border-border',
                                                    )}
                                                    onClick={() =>
                                                        onSelectItem(item)
                                                    }
                                                >
                                                    {content}
                                                </button>
                                            ) : (
                                                <div
                                                    className={classNames(
                                                        base,
                                                        !accessible &&
                                                            'opacity-80',
                                                    )}
                                                >
                                                    {content}
                                                </div>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </section>
                )
            })}
        </div>
    )
}

export default Curriculum
