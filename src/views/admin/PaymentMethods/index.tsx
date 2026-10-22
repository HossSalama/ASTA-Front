import { useEffect, useState, useCallback, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Tooltip from '@/components/ui/Tooltip'
import Switcher from '@/components/ui/Switcher'
import Spinner from '@/components/ui/Spinner'
import Tag from '@/components/ui/Tag'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    HiOutlinePlus,
    HiOutlineCreditCard,
    HiOutlinePencilSquare,
    HiOutlineArrowPath,
    HiOutlineInboxStack,
} from 'react-icons/hi2'
import {
    apiGetAdminPaymentMethods,
    apiTogglePaymentMethodStatus,
} from '@/services/PaymentService'
import type { PaymentMethodResponse } from '@/@types/payment'
import PaymentMethodDialog from './PaymentMethodDialog'

interface StatusOption {
    value: boolean | null
    label: string
}

const PaymentMethodsManagement = () => {
    const { t } = useTranslation()

    // Data States
    const [methods, setMethods] = useState<PaymentMethodResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Filters
    const [statusFilter, setStatusFilter] = useState<boolean | null>(null)

    // Modal State
    const [dialogOpen, setDialogOpen] = useState<boolean>(false)
    const [selectedMethod, setSelectedMethod] =
        useState<PaymentMethodResponse | null>(null)

    // Toggling Map
    const [togglingId, setTogglingId] = useState<number | null>(null)

    const statusOptions: StatusOption[] = useMemo(
        () => [
            {
                value: null,
                label: t('userPaymentRequests.allStatuses', 'All Statuses'),
            },
            {
                value: true,
                label: t('adminPaymentMethods.active', 'Active'),
            },
            {
                value: false,
                label: t('adminPaymentMethods.inactive', 'Inactive'),
            },
        ],
        [t],
    )

    const fetchMethods = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const params =
                statusFilter !== null ? { isActive: statusFilter } : undefined
            const res = await apiGetAdminPaymentMethods(params)
            if (res && res.data && Array.isArray(res.data)) {
                setMethods(res.data)
            } else {
                setMethods([])
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t(
                        'adminPaymentMethods.fetchFailed',
                        'Failed to fetch payment methods.',
                    ),
            )
            setMethods([])
        } finally {
            setLoading(false)
        }
    }, [statusFilter, t])

    useEffect(() => {
        fetchMethods()
    }, [fetchMethods])

    const handleToggleStatus = async (item: PaymentMethodResponse) => {
        setTogglingId(item.id)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            await apiTogglePaymentMethodStatus(item.id)
            setSuccessMsg(
                t(
                    'adminPaymentMethods.toggleSuccess',
                    'Payment method status toggled successfully.',
                ),
            )
            // Update local state immediately
            setMethods((prev) =>
                prev.map((m) =>
                    m.id === item.id ? { ...m, isActive: !m.isActive } : m,
                ),
            )
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t(
                        'adminPaymentMethods.failedToggle',
                        'Failed to toggle payment method status.',
                    ),
            )
        } finally {
            setTogglingId(null)
        }
    }

    const handleOpenCreate = () => {
        setSelectedMethod(null)
        setDialogOpen(true)
    }

    const handleOpenEdit = (method: PaymentMethodResponse) => {
        setSelectedMethod(method)
        setDialogOpen(true)
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
                        <HiOutlineCreditCard />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">
                            {t(
                                'adminPaymentMethods.title',
                                'Payment Methods Management',
                            )}
                        </h1>
                        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                            {t(
                                'adminPaymentMethods.description',
                                'Add and manage payment methods, account numbers, instructions, and toggle availability for students.',
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Tooltip title={t('common.retry', 'Refresh')}>
                        <Button
                            variant="default"
                            size="sm"
                            icon={<HiOutlineArrowPath />}
                            loading={loading}
                            onClick={() => fetchMethods()}
                        />
                    </Tooltip>
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiOutlinePlus />}
                        onClick={handleOpenCreate}
                    >
                        {t(
                            'adminPaymentMethods.addMethod',
                            'Add Payment Method',
                        )}
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="border border-border shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="w-full sm:w-64">
                        <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                            {t('adminPaymentMethods.isActive', 'Active Status')}
                        </label>
                        <Select<StatusOption>
                            options={statusOptions}
                            value={statusOptions.find(
                                (opt) => opt.value === statusFilter,
                            )}
                            onChange={(option) =>
                                setStatusFilter(option?.value ?? null)
                            }
                            placeholder={t(
                                'userPaymentRequests.allStatuses',
                                'All Statuses',
                            )}
                            isClearable={false}
                        />
                    </div>
                </div>
            </Card>

            {/* Alerts */}
            {errorMsg && (
                <Alert
                    type="danger"
                    showIcon
                    closable
                    onClose={() => setErrorMsg('')}
                >
                    {errorMsg}
                </Alert>
            )}

            {successMsg && (
                <Alert
                    type="success"
                    showIcon
                    closable
                    onClose={() => setSuccessMsg('')}
                >
                    {successMsg}
                </Alert>
            )}

            {/* Methods Table / List */}
            <Card className="border border-border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                        <Spinner size={36} />
                        <span className="text-xs text-text-secondary">
                            {t('common.loading', 'Loading...')}
                        </span>
                    </div>
                ) : methods.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-alt text-text-muted flex items-center justify-center text-3xl">
                            <HiOutlineInboxStack />
                        </div>
                        <h3 className="text-base font-bold text-text-primary">
                            {t(
                                'payment.noMethodsAvailable',
                                'No payment methods found.',
                            )}
                        </h3>
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiOutlinePlus />}
                            onClick={handleOpenCreate}
                        >
                            {t(
                                'adminPaymentMethods.addMethod',
                                'Add First Payment Method',
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-sm">
                            <thead className="bg-surface-alt/50 border-b border-border text-xs uppercase font-semibold text-text-secondary">
                                <tr>
                                    <th className="px-5 py-3.5 text-start">
                                        #
                                    </th>
                                    <th className="px-5 py-3.5 text-start">
                                        {t('adminPaymentMethods.logo', 'Logo')}
                                    </th>
                                    <th className="px-5 py-3.5 text-start">
                                        {t(
                                            'adminPaymentMethods.nameAr',
                                            'Arabic Name',
                                        )}{' '}
                                        /{' '}
                                        {t(
                                            'adminPaymentMethods.nameEn',
                                            'English Name',
                                        )}
                                    </th>
                                    <th className="px-5 py-3.5 text-start">
                                        {t(
                                            'adminPaymentMethods.accountNumber',
                                            'Account / Wallet',
                                        )}
                                    </th>
                                    <th className="px-5 py-3.5 text-start">
                                        {t(
                                            'adminPaymentMethods.instructionsAr',
                                            'Instructions',
                                        )}
                                    </th>
                                    <th className="px-5 py-3.5 text-center">
                                        {t(
                                            'adminPaymentMethods.isActive',
                                            'Status',
                                        )}
                                    </th>
                                    <th className="px-5 py-3.5 text-end">
                                        {t('common.actions', 'Actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {methods.map((method) => (
                                    <tr
                                        key={method.id}
                                        className="hover:bg-surface-alt/30 transition-colors"
                                    >
                                        <td className="px-5 py-4 font-mono text-xs text-text-muted">
                                            {method.id}
                                        </td>
                                        <td className="px-5 py-4">
                                            {method.logoUrl ? (
                                                <img
                                                    src={method.logoUrl}
                                                    alt={method.nameEn}
                                                    className="h-10 w-10 object-contain rounded border border-border bg-white"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded bg-surface-alt flex items-center justify-center text-lg text-text-muted">
                                                    <HiOutlineCreditCard />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="space-y-0.5">
                                                <span className="font-bold text-text-primary block">
                                                    {method.nameAr}
                                                </span>
                                                <span className="text-xs text-text-secondary block">
                                                    {method.nameEn}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-mono font-bold text-text-primary select-all text-xs sm:text-sm">
                                                {method.accountNumber}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 max-w-xs">
                                            <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                                                {method.instructionsAr ||
                                                    method.instructionsEn}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Switcher
                                                    checked={method.isActive}
                                                    disabled={
                                                        togglingId === method.id
                                                    }
                                                    onChange={() =>
                                                        handleToggleStatus(method)
                                                    }
                                                />
                                                <Tag
                                                    className={`text-[10px] py-0 px-1.5 font-semibold ${
                                                        method.isActive
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                                                    }`}
                                                >
                                                    {method.isActive
                                                        ? t(
                                                              'adminPaymentMethods.active',
                                                              'Active',
                                                          )
                                                        : t(
                                                              'adminPaymentMethods.inactive',
                                                              'Inactive',
                                                          )}
                                                </Tag>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-end">
                                            <Button
                                                size="xs"
                                                variant="default"
                                                icon={<HiOutlinePencilSquare />}
                                                onClick={() =>
                                                    handleOpenEdit(method)
                                                }
                                            >
                                                {t('common.edit', 'Edit')}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Create / Edit Dialog */}
            <PaymentMethodDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                paymentMethod={selectedMethod}
                onSuccess={() => {
                    fetchMethods()
                    setSuccessMsg(
                        selectedMethod
                            ? t(
                                  'adminPaymentMethods.updateSuccess',
                                  'Payment method updated successfully.',
                              )
                            : t(
                                  'adminPaymentMethods.createSuccess',
                                  'Payment method created successfully.',
                              ),
                    )
                }}
            />
        </div>
    )
}

export default PaymentMethodsManagement
