import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Container from '@/components/shared/Container'

const Unauthorized = () => {
    const { t } = useTranslation()

    return (
        <main className="py-20">
            <Container>
                <div className="max-w-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                        {t('site.unauthorized.code')}
                    </p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                        {t('site.unauthorized.title')}
                    </h1>
                    <p className="mt-3 text-lg text-text-secondary">
                        {t('site.unauthorized.description')}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            to="/courses"
                            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-neutral transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            {t('site.nav.courses', 'Courses')}
                        </Link>
                        <Link
                            to="/sign-in"
                            className="inline-flex min-h-11 items-center rounded-md border border-border px-5 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            {t('site.nav.signIn', 'Sign in')}
                        </Link>
                    </div>
                </div>
            </Container>
        </main>
    )
}

export default Unauthorized
