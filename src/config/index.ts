import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const config = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT as string, 10) || 6379,
    },
    
};

export default config;