import express from "express";
import dotenv from "dotenv";
import MeetingWorker from "./workers/meetingWorker";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});

const startServer = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        const worker = new MeetingWorker();
        await worker.start();

    } catch (error) {
        console.error("Failed to start application:", error);
        process.exit(1);
    }
};

startServer();
