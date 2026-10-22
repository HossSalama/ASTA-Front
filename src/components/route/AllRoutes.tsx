import AdminGuard from './AdminGuard'
import UserGuard from './UserGuard'
import PublicRoute from './PublicRoute'
import AuthorityGuard from './AuthorityGuard'
import AppRoute from './AppRoute'
import PageContainer from '@/components/template/PageContainer'
import AdminLayout from '@/components/layouts/AdminLayout'
import UserLayout from '@/components/layouts/UserLayout'
import SiteLayout from '@/components/layouts/SiteLayout'
import PreLoginLayout from '@/components/layouts/PreLoginLayout'
import { adminRoutes, userRoutes, siteRoutes, publicRoutes } from '@/configs/routes.config'
import othersRoute from '@/configs/routes.config/othersRoute'

import { useAuth } from '@/auth'
import { Routes, Route as RouterRoute } from 'react-router-dom'
import type { LayoutType } from '@/@types/theme'
import type { Route as AppRouteType } from '@/@types/routes'

interface ViewsProps {
    pageContainerType?: 'default' | 'gutterless' | 'contained'
    layout?: LayoutType
}

type AllRoutesProps = ViewsProps

const AllRoutes = (props: AllRoutesProps) => {
    const { user } = useAuth()

    return (
        <Routes>
            {/* 1. Public Website Routes (Home, Courses, etc.) - Must be first for path matching */}
            {siteRoutes.map((route: AppRouteType, index: number) => {
                /* The learning player owns the whole viewport — no site chrome. */
                const isImmersive = route.key === 'site.learning'
                const page = (
                    <AppRoute
                        routeKey={route.key}
                        component={route.component}
                        {...route.meta}
                    />
                )

                return (
                <RouterRoute
                    key={route.key + index}
                    path={route.path}
                    element={
                        isImmersive ? (
                            <PublicRoute>{page}</PublicRoute>
                        ) : (
                        <PublicRoute>
                            <SiteLayout>
                                <PageContainer {...props} {...route.meta}>
                                    {page}
                                </PageContainer>
                            </SiteLayout>
                        </PublicRoute>
                        )
                    }
                />
                )
            })}

            {/* 2. Public Auth Routes (Sign-in, etc.) */}
            {publicRoutes.map((route: AppRouteType) => (
                <RouterRoute
                    key={route.path}
                    path={route.path}
                    element={
                        <PublicRoute>
                            <SiteLayout>
                                <PreLoginLayout>
                                    <AppRoute
                                        routeKey={route.key}
                                        component={route.component}
                                        {...route.meta}
                                    />
                                </PreLoginLayout>
                            </SiteLayout>
                        </PublicRoute>
                    }
                />
            ))}


            {/* 3. Admin Dashboard Application Area */}
            {adminRoutes.map((route: AppRouteType, index: number) => (
                <RouterRoute
                    key={route.key + index}
                    path={route.path}
                    element={
                        <AdminGuard>
                            <AdminLayout>
                                <AuthorityGuard
                                    userAuthority={user.authority}
                                    authority={route.authority}
                                >
                                    <PageContainer {...props} {...route.meta}>
                                        <AppRoute
                                            routeKey={route.key}
                                            component={route.component}
                                            {...route.meta}
                                        />
                                    </PageContainer>
                                </AuthorityGuard>
                            </AdminLayout>
                        </AdminGuard>
                    }
                />
            ))}

            {/* 4. User Dashboard Application Area */}
            {userRoutes.map((route: AppRouteType, index: number) => (
                <RouterRoute
                    key={route.key + index}
                    path={route.path}
                    element={
                        <UserGuard>
                            <UserLayout>
                                <AuthorityGuard
                                    userAuthority={user.authority}
                                    authority={route.authority}
                                >
                                    <PageContainer {...props} {...route.meta}>
                                        <AppRoute
                                            routeKey={route.key}
                                            component={route.component}
                                            {...route.meta}
                                        />
                                    </PageContainer>
                                </AuthorityGuard>
                            </UserLayout>
                        </UserGuard>
                    }
                />
            ))}

            {/* 5. Other System Routes */}
            {othersRoute.map((route: AppRouteType, index: number) => (
                <RouterRoute
                    key={route.key + index}
                    path={route.path}
                    element={
                        <UserGuard>
                            <PreLoginLayout>
                                <PageContainer {...props} {...route.meta}>
                                    <AppRoute
                                        routeKey={route.key}
                                        component={route.component}
                                        {...route.meta}
                                    />
                                </PageContainer>
                            </PreLoginLayout>
                        </UserGuard>
                    }
                />
            ))}

            {/* 6. Catch-all fallback — handled by the site 404 route above */}
        </Routes>
    )
}

export default AllRoutes
