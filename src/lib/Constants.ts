import { MeetingStatus } from "@prisma/client";

export class Constants {
    static readonly REDIS_QUEUE_KEY = "meeting-jobs";
    static readonly MEETING_STATUS = {
        PENDING: MeetingStatus.PENDING,
        JOINING: MeetingStatus.JOINING,
        IN_PROGRESS: MeetingStatus.IN_PROGRESS,
        PROCESSING: MeetingStatus.PROCESSING,
        COMPLETED: MeetingStatus.COMPLETED,
        FAILED: MeetingStatus.FAILED,
    };

    static readonly DISPLAY_MESSAGES = {
        PENDING: "Bot will join soon",
        JOINING: "Bot is joining",
        IN_PROGRESS: "Meeting in progress",
        PROCESSING: "Meeting currently being processed",
        FAILED: "Failed processing meeting",
    };

    static readonly SUMMARY_PLACEHOLDER = {
        UNAVAILABLE: "Summary unavailable.",
        WAITING: "Summary will appear here once the meeting is completed.",
    };

    static readonly REDIS_POLLING_INTERVAL = 15000;
}