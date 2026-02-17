import Redis from "ioredis";

const getRedisConfig = () => {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;

    if (!host) {
        throw new Error("REDIS_HOST is not defined");
    }

    return { host, port };
};

const config = getRedisConfig();

export const redis = new Redis({
    host: config.host,
    port: config.port,
    maxRetriesPerRequest: null,
});

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});