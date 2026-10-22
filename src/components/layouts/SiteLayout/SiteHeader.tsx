import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { TbMenu2, TbX, TbHeart, TbSearch } from 'react-icons/tb'
import Container from '@/components/shared/Container'
import Logo from '@/components/template/Logo'
import LanguageSelector from '@/components/template/LanguageSelector'
import DarkModeToggle from '@/components/template/DarkModeToggle'
import UserProfileDropdown from '@/components/template/UserProfileDropdown'
import Notification from '@/components/template/Notification'
import SiteSearch from './SiteSearch'
import { discoveryNav, learnerNav } from './siteNavigation'
import { useAuth } from '@/auth'
import { useWishlistStore } from '@/store/wishlistStore'
import { APP_NAME } from '@/constants/app.constant'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    classNames(
        'relative inline-flex h-16 items-center text-sm font-semibold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary after:transition-opacity',
        isActive
            ? 'text-primary after:opacity-100'
            : 'text-text-primary hover:text-primary after:opacity-0',
    )

const SiteHeader = () => {
    const { t } = useTranslation()
    const { authenticated } = useAuth()
    const location = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
    const savedCount = useWishlistStore((state) => state.courseIds.length)

    useEffect(() => {
        setMobileOpen(false)
        setMobileSearchOpen(false)
    }, [location.pathname, location.search])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMobileOpen(false)
            }
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [])

    const primaryNav = authenticated
        ? [
              ...discoveryNav,
              learnerNav.find((i) => i.key === 'myLearning')!,
              learnerNav.find((i) => i.key === 'schedule')!,
          ].filter(Boolean)
        : discoveryNav

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-neutral"
            >
                {t('site.skipToContent', 'Skip to content')}
            </a>
            <Container width="wide">
                <div className="flex h-16 items-center gap-4">
                    <Link
                        to="/"
                        aria-label={t('site.homeLink', {
                            defaultValue: '{{name}} home',
                            name: APP_NAME,
                        })}
                        className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                    >
                        <Logo imgClass="h-8 w-auto" logoWidth="auto" />
                    </Link>

                    <nav
                        aria-label={t('site.primaryNav', 'Primary')}
                        className="hidden lg:block"
                    >
                        <ul className="flex items-center gap-6">
                            {primaryNav.map((item) => (
                                <li key={item.key}>
                                    <NavLink
                                        to={item.to}
                                        className={navLinkClass}
                                    >
                                        {t(item.labelKey, item.fallback)}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <SiteSearch className="hidden min-w-0 flex-1 md:block lg:max-w-md" />

                    <div className="ms-auto flex items-center gap-1 md:gap-2">
                        <button
                            type="button"
                            aria-label={t('site.searchLabel', 'Search courses')}
                            aria-expanded={mobileSearchOpen}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
                            onClick={() => setMobileSearchOpen((open) => !open)}
                        >
                            <TbSearch className="text-xl" aria-hidden="true" />
                        </button>

                        <Link
                            to="/saved"
                            aria-label={t('site.savedCourses', {
                                defaultValue: 'Wishlist ({{count}})',
                                count: savedCount,
                            })}
                            className="relative hidden h-11 w-11 items-center justify-center rounded-md text-text-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex"
                        >
                            <TbHeart
                                className="text-xl"
                                aria-hidden="true"
                            />
                            {savedCount > 0 && (
                                <span className="absolute end-1.5 top-1.5 min-w-4 rounded-full bg-secondary px-1 text-[0.625rem] font-bold leading-4 text-neutral">
                                    {savedCount > 9 ? '9+' : savedCount}
                                </span>
                            )}
                        </Link>

                        <DarkModeToggle />
                        <LanguageSelector />

                        {authenticated ? (
                            <>
                                <Notification />
                                <UserProfileDropdown />
                            </>
                        ) : (
                            <div className="hidden items-center gap-2 sm:flex">
                                <Link
                                    to="/sign-in"
                                    className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-text-primary transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                >
                                    {t('site.signIn', 'Sign in')}
                                </Link>
                                <Link
                                    to="/sign-up"
                                    className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-neutral transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                >
                                    {t('site.createAccount', 'Create account')}
                                </Link>
                            </div>
                        )}

                        <button
                            type="button"
                            aria-label={
                                mobileOpen
                                    ? t('site.closeMenu', 'Close menu')
                                    : t('site.openMenu', 'Open menu')
                            }
                            aria-expanded={mobileOpen}
                            aria-controls="site-mobile-nav"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
                            onClick={() => setMobileOpen((open) => !open)}
                        >
                            {mobileOpen ? (
                                <TbX className="text-xl" aria-hidden="true" />
                            ) : (
                                <TbMenu2
                                    className="text-xl"
                                    aria-hidden="true"
                                />
                            )}
                        </button>
                    </div>
                </div>

                {mobileSearchOpen && (
                    <div className="pb-3 md:hidden">
                        <SiteSearch autoFocus />
                    </div>
                )}
            </Container>

            {mobileOpen && (
                <div
                    id="site-mobile-nav"
                    className="border-t border-border bg-surface lg:hidden"
                >
                    <Container width="wide" className="py-4">
                        <nav aria-label={t('site.primaryNav', 'Primary')}>
                            <ul className="space-y-1">
                                {discoveryNav.map((item) => (
                                    <li key={item.key}>
                                        <NavLink
                                            to={item.to}
                                            className={({ isActive }) =>
                                                classNames(
                                                    'flex min-h-11 items-center rounded-md px-3 text-sm font-semibold',
                                                    isActive
                                                        ? 'bg-primary-subtle text-primary'
                                                        : 'text-text-primary hover:bg-surface-alt',
                                                )
                                            }
                                        >
                                            {t(item.labelKey, item.fallback)}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        <hr className="my-3 border-border" />

                        <nav
                            aria-label={t('site.learningNav', 'Your learning')}
                        >
                            <ul className="space-y-1">
                                {(authenticated
                                    ? learnerNav
                                    : [learnerNav.find((i) => i.key === 'certificates')!]
                                ).map((item) => (
                                    <li key={item.key}>
                                        <NavLink
                                            to={item.to}
                                            className={({ isActive }) =>
                                                classNames(
                                                    'flex min-h-11 items-center rounded-md px-3 text-sm font-semibold',
                                                    isActive
                                                        ? 'bg-primary-subtle text-primary'
                                                        : 'text-text-primary hover:bg-surface-alt',
                                                )
                                            }
                                        >
                                            {t(item.labelKey, item.fallback)}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        {!authenticated && (
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <Link
                                    to="/sign-in"
                                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-border text-sm font-semibold text-text-primary"
                                >
                                    {t('site.signIn', 'Sign in')}
                                </Link>
                                <Link
                                    to="/sign-up"
                                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary text-sm font-semibold text-neutral"
                                >
                                    {t('site.createAccount', 'Create account')}
                                </Link>
                            </div>
                        )}
                    </Container>
                </div>
            )}
        </header>
    )
}

export default SiteHeader
