export type LiveSessionDeliveryMode = 'Online' | 'Offline'

export interface MyScheduleItem {
    liveSessionId: number
    contentId: number
    courseId: number
    courseName: string
    title: string
    scheduledStartTime: string // ISO 8601 format e.g. "2026-09-03T18:00:00+03:00"
    deliveryMode: LiveSessionDeliveryMode | string
    meetingUrl: string | null
    location: string | null
    locationUrl: string | null
}

export type MyScheduleItemResponse = MyScheduleItem
