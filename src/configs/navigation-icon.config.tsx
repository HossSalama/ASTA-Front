import {
    PiHouseLineDuotone,
    PiUsersDuotone,
    PiFolderSimpleDuotone,
    PiChalkboardTeacherDuotone,
    PiGraduationCapDuotone,
    PiMegaphoneDuotone,
    PiQuestionDuotone,
    PiTicketDuotone,
    PiFoldersDuotone,
    PiHeadsetDuotone,
    PiArrowsInDuotone,
    PiBookOpenUserDuotone,
    PiBookBookmarkDuotone,
    PiAcornDuotone,
    PiBagSimpleDuotone,
    PiCreditCardDuotone,
    PiReceiptDuotone,
    PiCalendarDotsDuotone,
    PiBellDuotone,
} from 'react-icons/pi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <PiHouseLineDuotone />,
    users: <PiUsersDuotone />,
    courseCategories: <PiFolderSimpleDuotone />,
    instructors: <PiChalkboardTeacherDuotone />,
    courses: <PiGraduationCapDuotone />,
    advertisements: <PiMegaphoneDuotone />,
    faqs: <PiQuestionDuotone />,
    tickets: <PiTicketDuotone />,
    ticketTypes: <PiFoldersDuotone />,
    myTickets: <PiHeadsetDuotone />,
    paymentMethods: <PiCreditCardDuotone />,
    paymentRequests: <PiReceiptDuotone />,
    schedule: <PiCalendarDotsDuotone />,
    notifications: <PiBellDuotone />,

    // Fallbacks
    singleMenu: <PiAcornDuotone />,
    collapseMenu: <PiArrowsInDuotone />,
    groupSingleMenu: <PiBookOpenUserDuotone />,
    groupCollapseMenu: <PiBookBookmarkDuotone />,
    groupMenu: <PiBagSimpleDuotone />,
}

export default navigationIcon
