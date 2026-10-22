import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useSessionUser } from '@/store/authStore'
import { Link } from 'react-router-dom'
import {
    HiOutlineUser,
    HiOutlineCog6Tooth,
    HiOutlineTicket,
    HiOutlineArrowRightOnRectangle,
    HiOutlineArrowLeftOnRectangle,
    HiOutlineSquares2X2,
    HiChevronDown,
    HiOutlineCalendarDays,
    HiOutlineBell,
} from 'react-icons/hi2'
import { useAuth } from '@/auth'
import useTranslation from '@/utils/hooks/useTranslation'
import { useLayoutContext } from '@/components/layouts/LayoutContext'
import type { JSX } from 'react'

type DropdownList = {
    label: string
    path: string
    icon: JSX.Element
}

export type UserProfileDropdownProps = {
    profilePath?: string
    settingsPath?: string
    className?: string
    hoverable?: boolean
}

const _UserDropdown = (props: UserProfileDropdownProps) => {
    const { avatar, userName, firstName, lastName, email, roles, authority } =
        useSessionUser((state) => state.user)

    const layoutContext = useLayoutContext()
    const targetProfilePath = props.profilePath || layoutContext.profilePath
    const targetSettingsPath = props.settingsPath || layoutContext.settingsPath

    const { signOut } = useAuth()
    const { t, i18n } = useTranslation()
    const currentLang =
        typeof i18n === 'object' && i18n?.language ? i18n.language : 'ar'
    const isRtl = currentLang === 'ar'
    const LogoutIcon = isRtl
        ? HiOutlineArrowLeftOnRectangle
        : HiOutlineArrowRightOnRectangle

    const handleSignOut = () => {
        signOut()
    }

    const avatarProps = {
        ...(avatar ? { src: avatar } : { icon: <HiOutlineUser /> }),
    }

    const displayName =
        userName ||
        `${firstName || ''} ${lastName || ''}`.trim() ||
        t('common.anonymous', 'Anonymous')
    const displayEmail = email || t('common.noEmail', 'No email available')

    const userRole = roles?.[0] || authority?.[0] || ''
    const getRoleTitle = (role: string) => {
        if (!role)
            return currentLang === 'ar' ? 'مستخدم المنصة' : 'Platform User'
        const lower = role.toLowerCase()
        if (lower.includes('superadmin') || lower.includes('super_admin')) {
            return currentLang === 'ar'
                ? 'المسؤول الأعلى للمنصة'
                : 'Super Admin'
        }
        if (lower.includes('admin')) {
            return currentLang === 'ar' ? 'مسؤول النظام' : 'Administrator'
        }
        return role
    }
    const displayRole = getRoleTitle(userRole)
    const isUserAdmin = (roles || authority || []).some(
        (r) => typeof r === 'string' && r.toLowerCase() === 'admin',
    )

    const dropdownItemList: DropdownList[] = [
        ...(isUserAdmin
            ? [
                  {
                      label:
                          currentLang === 'ar'
                              ? 'لوحة التحكم'
                              : t('nav.adminMenu', 'Admin Panel'),
                      path: '/admin',
                      icon: <HiOutlineSquares2X2 />,
                  },
              ]
            : []),
        {
            label: t('common.profile', 'الملف الشخصي'),
            path: targetProfilePath,
            icon: <HiOutlineUser />,
        },
        {
            label: t('nav.mySchedule', 'مواعيدي'),
            path: '/my-schedule',
            icon: <HiOutlineCalendarDays />,
        },
        {
            label: t('nav.myTickets', 'تذاكر الدعم'),
            path: '/user/tickets',
            icon: <HiOutlineTicket />,
        },
        {
            label: t('common.notifications', 'الإشعارات'),
            path: '/notifications',
            icon: <HiOutlineBell />,
        },
        {
            label: t('common.accountSettings', 'إعدادات الحساب'),
            path: targetSettingsPath,
            icon: <HiOutlineCog6Tooth />,
        },
    ]

    return (
        <Dropdown
            className="flex items-center"
            toggleClassName="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            renderTitle={
                <div className="flex items-center gap-2.5">
                    <Avatar size={36} shape="circle" {...avatarProps} />
                    <div className="hidden sm:flex flex-col text-start ltr:text-left rtl:text-right">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight">
                                {displayName}
                            </span>
                            <HiChevronDown className="text-xs text-gray-500" />
                        </div>
                        <span className="text-xs font-semibold text-primary dark:text-primary-mild leading-tight">
                            {displayRole}
                        </span>
                    </div>
                </div>
            }
            placement="bottom-end"
        >
            <Dropdown.Item variant="header">
                <div className="py-2 px-3 text-start ltr:text-left rtl:text-right">
                    <div className="font-bold text-gray-900 dark:text-gray-100 text-base">
                        {displayName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 dir-ltr">
                        {displayEmail}
                    </div>
                </div>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            {dropdownItemList.map((item) => (
                <Dropdown.Item
                    key={item.label}
                    eventKey={item.label}
                    variant="custom"
                >
                    <Link
                        className="flex items-center gap-3 w-full py-2 px-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                        to={item.path}
                    >
                        <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center text-lg shrink-0">
                            {item.icon}
                        </div>
                        <span className="font-bold text-sm">{item.label}</span>
                    </Link>
                </Dropdown.Item>
            ))}
            <Dropdown.Item
                eventKey="Sign Out"
                variant="custom"
                onClick={handleSignOut}
            >
                <div className="flex items-center gap-3 w-full py-2 px-3 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center text-lg shrink-0">
                        <LogoutIcon />
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                        {t('common.signOut', 'تسجيل الخروج')}
                    </span>
                </div>
            </Dropdown.Item>
        </Dropdown>
    )
}

const UserProfileDropdown = withHeaderItem(_UserDropdown)

export default UserProfileDropdown
