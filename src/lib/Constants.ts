export class Constants {
    static readonly REDIS_QUEUE_KEY = "meeting-jobs";
    static readonly MEETING_STATUS = {
        PENDING: "PENDING",
        JOINING: "JOINING",
        IN_PROGRESS: "IN_PROGRESS",
        PROCESSING: "PROCESSING",
        COMPLETED: "COMPLETED",
        FAILED: "FAILED",
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
}