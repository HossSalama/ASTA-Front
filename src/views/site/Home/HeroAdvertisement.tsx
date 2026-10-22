import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    TbArrowRight,
    TbArrowLeft,
    TbExternalLink,
    TbChevronRight,
    TbChevronLeft,
    TbBook,
} from 'react-icons/tb'
import classNames from 'classnames'
import { AdvertisementTargetType } from '@/@types/publicCatalog'
import type { HomeAdvertisement, PublicCourseSummary } from '@/@types/publicCatalog'
import CourseCard from '@/components/shared/catalog/CourseCard'

interface HeroAdvertisementProps {
    advertisements?: HomeAdvertisement[]
    fallbackCourse?: PublicCourseSummary | null
    isLoading?: boolean
}

const HeroAdvertisement = ({
    advertisements = [],
    fallbackCourse,
    isLoading = false,
}: HeroAdvertisementProps) => {
    const { t, i18n } = useTranslation()
    const isRtl = i18n.dir() === 'rtl'
    const Arrow = isRtl ? TbArrowLeft : TbArrowRight
    const PrevIcon = isRtl ? TbChevronRight : TbChevronLeft
    const NextIcon = isRtl ? TbChevronLeft : TbChevronRight

    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    const activeAds = advertisements.filter(
        (ad) => !ad.endAt || new Date(ad.endAt).getTime() > Date.now(),
    )

    const count = activeAds.length

    const handleNext = useCallback(() => {
        if (count > 0) {
            setCurrentIndex((prev) => (prev + 1) % count)
        }
    }, [count])

    const handlePrev = useCallback(() => {
        if (count > 0) {
            setCurrentIndex((prev) => (prev - 1 + count) % count)
        }
    }, [count])

    // Auto-advance slider every 6 seconds when not hovered
    useEffect(() => {
        if (count <= 1 || isHovered) return

        const timer = setInterval(() => {
            handleNext()
        }, 6000)

        return () => clearInterval(timer)
    }, [count, isHovered, handleNext])

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="aspect-video w-full animate-pulse rounded-2xl bg-surface-alt" />
        )
    }

    // If no advertisements exist, fallback to featured course preview
    if (count === 0) {
        if (!fallbackCourse) return null
        return (
            <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                    {t('home.startHere', 'Popular course')}
                </p>
                <CourseCard course={fallbackCourse} />
            </div>
        )
    }

    const currentAd = activeAds[currentIndex] || activeAds[0]
    const isCourseAd =
        currentAd.targetType === AdvertisementTargetType.Course &&
        Boolean(currentAd.courseId)
    const isExternalAd =
        currentAd.targetType === AdvertisementTargetType.ExternalUrl &&
        Boolean(currentAd.externalUrl)

    const adUrl = isCourseAd
        ? `/courses/${currentAd.courseId}`
        : isExternalAd
          ? currentAd.externalUrl || '#'
          : undefined

    const isExternal = isExternalAd

    return (
        <div
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-md transition-all duration-300 hover:shadow-xl"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Main Visual / Image */}
            <div className="relative aspect-video w-full overflow-hidden bg-surface-alt">
                {currentAd.imageUrl ? (
                    <img
                        key={currentAd.id}
                        src={currentAd.imageUrl}
                        alt={currentAd.courseName || t('home.sponsored', 'Advertisement')}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-surface to-secondary/10 p-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <TbBook className="text-4xl text-primary/60" />
                            <p className="text-sm font-semibold text-text-primary">
                                {currentAd.courseName || t('home.specialOffer', 'Special Offer')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Subtle dark gradient overlay at bottom for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Bottom title overlay if name exists */}
                {currentAd.courseName && (
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <p className="line-clamp-2 text-base font-bold drop-shadow-md">
                            {currentAd.courseName}
                        </p>
                    </div>
                )}

                {/* Overlay Prev / Next Buttons */}
                {count > 1 && (
                    <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <button
                            type="button"
                            onClick={handlePrev}
                            aria-label={t('common.previous', 'Previous')}
                            className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/70"
                        >
                            <PrevIcon className="text-base" />
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            aria-label={t('common.next', 'Next')}
                            className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/70"
                        >
                            <NextIcon className="text-base" />
                        </button>
                    </div>
                )}
            </div>

            {/* Footer / CTA Action */}
            <div className="flex items-center justify-between gap-4 border-t border-border/60 bg-surface p-3.5">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-text-secondary">
                        {isCourseAd
                            ? t('home.enrollNow', 'سارع بالتسجيل الآن')
                            : t('home.learnMore', 'اكتشف المزيد')}
                    </p>
                </div>

                {isCourseAd && adUrl ? (
                    <Link
                        to={adUrl}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-neutral transition-all hover:bg-primary-hover hover:gap-2 shadow-sm"
                    >
                        <span>{t('home.viewCourse', 'عرض الدورة')}</span>
                        <Arrow className="text-sm" />
                    </Link>
                ) : isExternal && adUrl ? (
                    <a
                        href={adUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-neutral transition-all hover:bg-primary-hover hover:gap-2 shadow-sm"
                    >
                        <span>{t('home.visitLink', 'زيارة الرابط')}</span>
                        <TbExternalLink className="text-sm" />
                    </a>
                ) : null}
            </div>

            {/* Pagination Dots */}
            {count > 1 && (
                <div className="flex justify-center gap-1.5 pb-2.5 bg-surface">
                    {activeAds.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentIndex(idx)}
                            aria-label={`Slide ${idx + 1}`}
                            className={classNames(
                                'h-1.5 rounded-full transition-all duration-300',
                                idx === currentIndex
                                    ? 'w-6 bg-primary'
                                    : 'w-1.5 bg-border hover:bg-text-muted',
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default HeroAdvertisement
