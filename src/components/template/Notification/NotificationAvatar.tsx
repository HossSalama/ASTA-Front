import {
    PiCreditCardFill,
    PiCertificateFill,
    PiGraduationCapFill,
    PiChalkboardTeacherFill,
    PiSealPercentFill,
    PiBellFill,
} from 'react-icons/pi'
import classNames from 'classnames'
import type { NotificationType } from '@/@types/notification'

export interface NotificationAvatarProps {
    type?: NotificationType | number | string
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

const NotificationAvatar = ({
    type,
    className,
    size = 'md',
}: NotificationAvatarProps) => {
    const sizeClasses = {
        sm: 'w-10 h-10 min-w-10 rounded-xl text-xl',
        md: 'w-12 h-12 min-w-12 rounded-2xl text-2xl',
        lg: 'w-14 h-14 min-w-14 rounded-2xl text-3xl',
    }[size]

    const getIcon = () => {
        switch (type) {
            case 'payment_request':
            case 'payment':
                return <PiCreditCardFill />

            case 'course_certificate':
            case 'certificate':
                return <PiCertificateFill />

            case 'course_content':
            case 'content':
            case 'material':
                return <PiGraduationCapFill />

            case 'offer':
            case 'promotion':
                return <PiSealPercentFill />

            case 'new_course':
            case 'course':
                return <PiChalkboardTeacherFill />

            default:
                return <PiBellFill />
        }
    }

    return (
        <div
            className={classNames(
                'flex items-center justify-center shrink-0 transition-transform duration-200',
                'bg-[#EAF1F8] text-[#215D8B] dark:bg-[#14232F] dark:text-[#6FAEDC]',
                sizeClasses,
                className,
            )}
        >
            {getIcon()}
        </div>
    )
}

export default NotificationAvatar
