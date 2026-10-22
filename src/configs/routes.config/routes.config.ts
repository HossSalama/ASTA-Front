import authRoute from './authRoute'
import othersRoute from './othersRoute'
import adminRoute from './adminRoute'
import userRoute from './userRoute'
import siteRoute from './siteRoute'
import type { Routes } from '@/@types/routes'


export const publicRoutes: Routes = [...authRoute]

export const adminRoutes: Routes = [...adminRoute]

export const userRoutes: Routes = [...userRoute]

export const protectedRoutes: Routes = [
    ...adminRoute,
    ...userRoute,
    ...othersRoute,
]

export const siteRoutes: Routes = [...siteRoute]

const routesConfig = {
    publicRoutes,
    siteRoutes,
    adminRoutes,
    userRoutes,
    protectedRoutes,
}

export default routesConfig

