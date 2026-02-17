import Redis from "ioredis";

const getRedisUrl = () => {
    if (process.env.REDIS_HOST) {
        return process.env.REDIS_HOST;
    }
    throw new Error("REDIS_URL is not defined");
};

export const redis = new Redis(getRedisUrl(), {
    maxRetriesPerRequest: null,
});

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
    process.exit(1);
});

redis.on("connect", () => {
    console.log("Successfully connected to Redis");
});

