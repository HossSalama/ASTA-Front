import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Container from '@/components/shared/Container'
import { APP_NAME } from '@/constants/app.constant'

interface Principle {
    h: string
    p: string
}

const About = () => {
    const { t } = useTranslation()

    const principles = t('site.about.principles', {
        returnObjects: true,
        defaultValue: [],
    }) as Principle[]

    return (
        <main className="pb-20">
            <section className="border-b border-border py-14 md:py-20">
                <Container>
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                                {t('site.about.eyebrow', 'About us')}
                            </p>
                            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
                                {t(
                                    'site.about.heroTitle',
                                    'We help people learn skills that hold up at work',
                                )}
                            </h1>
                        </div>
                        <p className="text-lg leading-relaxed text-text-secondary">
                            {t('site.about.heroText', {
                                defaultValue:
                                    '{{name}} is a learning platform built around finished, structured courses taught by named instructors.',
                                name: APP_NAME,
                            })}
                        </p>
                    </div>
                </Container>
            </section>

            <section className="py-14 md:py-20">
                <Container>
                    <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                        {t('site.about.principlesTitle')}
                    </h2>
                    <dl className="mt-8 grid gap-x-12 gap-y-8 border-t border-border pt-8 sm:grid-cols-2">
                        {principles.map((item, index) => (
                            <div key={item.h} className="flex gap-4">
                                <span
                                    aria-hidden="true"
                                    className="mt-0.5 text-sm font-semibold tabular-nums text-text-muted"
                                >
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div>
                                    <dt className="text-base font-semibold text-text-primary">
                                        {item.h}
                                    </dt>
                                    <dd className="mt-1.5 leading-relaxed text-text-secondary">
                                        {item.p}
                                    </dd>
                                </div>
                            </div>
                        ))}
                    </dl>
                </Container>
            </section>

            <section className="pb-4">
                <Container>
                    <div className="flex flex-col gap-5 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-xl">
                            <h2 className="text-xl font-semibold text-text-primary">
                                {t('site.about.ctaTitle')}
                            </h2>
                            <p className="mt-1.5 text-text-secondary">
                                {t('site.about.ctaBody')}
                            </p>
                        </div>
                        <Link
                            to="/courses"
                            className="inline-flex min-h-11 shrink-0 items-center rounded-md bg-primary px-5 text-sm font-semibold text-neutral transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            {t('site.about.ctaAction')}
                        </Link>
                    </div>
                </Container>
            </section>
        </main>
    )
}

export default About
