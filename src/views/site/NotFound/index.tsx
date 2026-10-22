import Container from '@/components/shared/Container'
import StateView from '@/components/shared/catalog/StateView'
import useTranslation from '@/utils/hooks/useTranslation'

const NotFound = () => {
    const { t } = useTranslation()

    return (
        <main className="py-16">
            <Container>
                <p className="text-center text-sm font-semibold uppercase tracking-wide text-text-secondary">
                    {t('notFound.code', 'Error 404')}
                </p>
                <StateView
                    tone="noResults"
                    title={t('notFound.title', 'This page does not exist')}
                    description={t(
                        'notFound.description',
                        'The link may be outdated, or the page has moved. Try the catalogue instead.',
                    )}
                    action={{
                        label: t('notFound.action', 'Browse courses'),
                        to: '/courses',
                    }}
                />
            </Container>
        </main>
    )
}

export default NotFound
