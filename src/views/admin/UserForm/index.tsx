import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import Alert from '@/components/ui/Alert'
import Spinner from '@/components/ui/Spinner'
import PasswordInput from '@/components/shared/PasswordInput'
import { apiCreateUser, apiGetUserById, apiUpdateUser } from '@/services/UserService'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { HiOutlineArrowLeft, HiOutlineUser, HiOutlineEnvelope, HiOutlinePhone } from 'react-icons/hi2'
import useTranslation from '@/utils/hooks/useTranslation'

type UserFormSchemaType = {
    firstName: string
    lastName: string
    email?: string
    phoneNumber?: string
    password?: string
    roles: string[]
}

const UserForm = () => {
    const { t } = useTranslation()
    const { id } = useParams<{ id: string }>()
    const isEditMode = Boolean(id)
    const navigate = useNavigate()

    const [loadingUser, setLoadingUser] = useState<boolean>(isEditMode)
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    const schema = useMemo(() => {
        const base = {
            firstName: z.string().min(1, t('userManagement.firstNameRequired', 'First name is required')),
            lastName: z.string().min(1, t('userManagement.lastNameRequired', 'Last name is required')),
            email: z.string().email(t('userManagement.emailInvalid', 'Valid email is required')).optional().or(z.literal('')),
            phoneNumber: z.string().optional(),
            roles: z.array(z.string()).min(1, t('userManagement.roleRequired', 'At least one role must be selected')),
        }
        if (isEditMode) {
            return z.object(base)
        }
        return z.object({
            ...base,
            password: z.string().min(8, t('userManagement.passwordMinLength', 'Password must be at least 8 characters')),
        })
    }, [isEditMode, t])

    const {
        handleSubmit,
        control,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<UserFormSchemaType>({
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            password: '',
            roles: ['User'],
        },
        resolver: zodResolver(schema),
    })

    const selectedRoles = watch('roles') || []

    useEffect(() => {
        if (isEditMode && id) {
            setLoadingUser(true)
            apiGetUserById(id)
                .then((res) => {
                    if (res?.data) {
                        const u = res.data
                        reset({
                            firstName: u.firstName || '',
                            lastName: u.lastName || '',
                            email: u.email || '',
                            phoneNumber: u.phoneNumber || '',
                            roles: u.roles?.length ? u.roles : ['User'],
                        })
                    } else {
                        setErrorMsg(t('userManagement.failedLoadDetails', 'Failed to load user information.'))
                    }
                })
                .catch((err: unknown) => {
                    const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
                    setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.error', 'Error loading user.'))
                })
                .finally(() => {
                    setLoadingUser(false)
                })
        }
    }, [id, isEditMode, reset, t])

    const handleRoleToggle = (role: string) => {
        if (selectedRoles.includes(role)) {
            setValue(
                'roles',
                selectedRoles.filter((r) => r !== role),
                { shouldValidate: true }
            )
        } else {
            setValue('roles', [...selectedRoles, role], { shouldValidate: true })
        }
    }

    const onSubmit = async (data: UserFormSchemaType) => {
        setSubmitting(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            if (isEditMode && id) {
                const res = await apiUpdateUser(id, {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email || undefined,
                    phoneNumber: data.phoneNumber || undefined,
                    roles: data.roles,
                })
                if (res?.status) {
                    setSuccessMsg(t('userManagement.userUpdated', 'User updated successfully.'))
                    setTimeout(() => {
                        navigate('/admin/users')
                    }, 1500)
                } else {
                    setErrorMsg(res?.message || t('userManagement.failedUpdate', 'Failed to update user.'))
                }
            } else {
                const res = await apiCreateUser({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email || undefined,
                    password: data.password || 'SecureUserPassword123!',
                    phoneNumber: data.phoneNumber || undefined,
                    roles: data.roles,
                })
                if (res?.status) {
                    setSuccessMsg(t('userManagement.userCreated', 'User created successfully.'))
                    setTimeout(() => {
                        navigate('/admin/users')
                    }, 1500)
                } else {
                    setErrorMsg(res?.message || t('userManagement.failedCreate', 'Failed to create user.'))
                }
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.error', 'Action failed.'))
        } finally {
            setSubmitting(false)
        }
    }

    if (loadingUser) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="40px" />
            </div>
        )
    }

    return (
        <div className="w-full p-4 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link to="/admin/users">
                    <Button size="sm" variant="default" icon={<HiOutlineArrowLeft />} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {isEditMode
                            ? t('userManagement.editUser', 'Edit User')
                            : t('userManagement.createUser', 'Create New User')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                        {isEditMode
                            ? t('userManagement.editSubtitle', 'Update user account parameters and system roles.')
                            : t('userManagement.createSubtitle', 'Add a new user account directly via Admin console.')}
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
                {successMsg && <Alert type="success" className="mb-4">{successMsg}</Alert>}
                {errorMsg && <Alert type="danger" className="mb-4">{errorMsg}</Alert>}

                <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {t('userManagement.firstName', 'First Name')} *
                            </label>
                            <Controller
                                name="firstName"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder={t('userManagement.firstName', 'First Name')}
                                        prefix={<HiOutlineUser className="text-gray-400" />}
                                        {...field}
                                    />
                                )}
                            />
                            {errors.firstName && (
                                <span className="text-xs text-red-500 mt-1">{errors.firstName.message}</span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {t('userManagement.lastName', 'Last Name')} *
                            </label>
                            <Controller
                                name="lastName"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder={t('userManagement.lastName', 'Last Name')}
                                        prefix={<HiOutlineUser className="text-gray-400" />}
                                        {...field}
                                    />
                                )}
                            />
                            {errors.lastName && (
                                <span className="text-xs text-red-500 mt-1">{errors.lastName.message}</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {t('userManagement.email', 'Email Address')}
                            </label>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="email"
                                        placeholder="john.doe@example.com"
                                        prefix={<HiOutlineEnvelope className="text-gray-400" />}
                                        {...field}
                                    />
                                )}
                            />
                            {errors.email && (
                                <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {t('userManagement.phone', 'Phone Number')}
                            </label>
                            <Controller
                                name="phoneNumber"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder="+1234567890"
                                        prefix={<HiOutlinePhone className="text-gray-400" />}
                                        {...field}
                                    />
                                )}
                            />
                            {errors.phoneNumber && (
                                <span className="text-xs text-red-500 mt-1">{errors.phoneNumber.message}</span>
                            )}
                        </div>
                    </div>

                    {!isEditMode && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {t('userManagement.accountPassword', 'Account Password')} *
                            </label>
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <PasswordInput
                                        placeholder={t('userManagement.passwordPlaceholder', 'Initial password for account (min 8 chars)')}
                                        {...field}
                                    />
                                )}
                            />
                            {errors.password && (
                                <span className="text-xs text-red-500 mt-1">{errors.password.message}</span>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('userManagement.assignedRoles', 'Assigned System Roles')} *
                        </label>
                        <div className="flex flex-wrap items-center gap-4">
                            <Checkbox
                                checked={selectedRoles.includes('User')}
                                onChange={() => handleRoleToggle('User')}
                            >
                                {t('userManagement.normalUser', 'Normal User')} (`User`)
                            </Checkbox>
                            <Checkbox
                                checked={selectedRoles.includes('Admin')}
                                onChange={() => handleRoleToggle('Admin')}
                            >
                                {t('userManagement.administrator', 'Administrator')} (`Admin`)
                            </Checkbox>
                        </div>
                        {errors.roles && (
                            <span className="text-xs text-red-500 mt-1 block">{errors.roles.message}</span>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Link to="/admin/users">
                            <Button type="button" variant="default">
                                {t('common.cancel', 'Cancel')}
                            </Button>
                        </Link>
                        <Button type="submit" variant="solid" loading={submitting}>
                            {isEditMode
                                ? t('common.save', 'Update User')
                                : t('userManagement.createUser', 'Create User')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

export default UserForm
