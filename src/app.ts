import express from "express";
import dotenv from "dotenv";
dotenv.config();
import MeetingWorker from "./workers/meetingWorker";
import { redis } from "./config/redis";
import prisma from "./lib/prisma";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});

const startServer = async () => {
    try {
        await redis.ping();
        console.log("Successfully connected to Redis");

        await prisma.$connect();
        console.log("Successfully connected to Database");

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        const worker = new MeetingWorker();
        await worker.start();

    } catch (error) {
        console.error("Failed to start application:", error);
        await redis.quit();
        await prisma.$disconnect();
        process.exit(1);
    }
};

startServer();