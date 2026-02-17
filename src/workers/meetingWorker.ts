import puppeteer, { Browser, Page } from 'puppeteer';
import { redis } from '../config/redis';
import prisma from '../lib/prisma';
import { Constants } from '../lib/Constants';

interface MeetingJob {
    meetingId: string;
    meetLink: string;
    userId: string;
}

class MeetingWorker {
    private browser: Browser | null = null;
    private isRunning: boolean = true;

    public async start(): Promise<void> {
        console.log('Meeting Worker started and waiting for jobs...');

        process.on('SIGTERM', () => this.stop());
        process.on('SIGINT', () => this.stop());

        while (this.isRunning) {
            try {
                const jobData = await redis.lpop(Constants.REDIS_QUEUE_KEY);
                if (jobData) {
                    const job: MeetingJob = JSON.parse(jobData);

                    console.log(`Received job: ${job.meetingId}`);
                    await this.processMeeting(job);
                } else {
                    console.log('No jobs in queue, waiting 15 seconds...');
                    await this.sleep(Constants.REDIS_POLLING_INTERVAL);
                }
            } catch (error: any) {
                console.error('Worker error:', error.message);
                await this.sleep(Constants.REDIS_POLLING_INTERVAL);
            }
        }
    }

    private async processMeeting(job: MeetingJob): Promise<void> {
        const { meetingId, meetLink, userId } = job;
        
        console.log(`Processing meeting ${meetingId}: ${meetLink}`);

        try {
            await prisma.meeting.update({
                where: { id: meetingId },
                data: { status: Constants.MEETING_STATUS.JOINING },
            });

            if (!this.browser) {
                this.browser = await this.initializeBrowser();
            }

            await this.joinMeeting(meetLink, meetingId);

            await prisma.meeting.update({
                where: { id: meetingId },
                data: { status: Constants.MEETING_STATUS.IN_PROGRESS },
            });

            console.log(`Successfully joined meeting ${meetingId}`);
        } catch (error: any) {
            console.error(`Error processing meeting ${meetingId}:`, error.message);
            await prisma.meeting.update({
                where: { id: meetingId },
                data: { 
                    status: Constants.MEETING_STATUS.FAILED,
                },
            });
        }
    }

    private async initializeBrowser(): Promise<Browser> {
        console.log('Launching browser...');
        
        const browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
            ],
        });

        console.log('Browser launched successfully');
        return browser;
    }

    private async joinMeeting(meetLink: string, meetingId: string): Promise<void> {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        const page = await this.browser.newPage();

        try {
            await page.setUserAgent(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );

            const context = this.browser.defaultBrowserContext();
            await context.overridePermissions(meetLink, [
                'camera',
                'microphone',
                'notifications',
            ]);

            console.log(`Navigating to meeting: ${meetLink}`);
            
            await page.goto(meetLink, {
                waitUntil: 'networkidle2',
                timeout: 60000,
            });

            console.log(`Successfully navigated to meeting ${meetingId}`);
            
        } catch (error: any) {
            console.error(`Error joining meeting ${meetingId}:`, error.message);
            await page.close();
            throw error;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async stop(): Promise<void> {
        console.log('Stopping worker...');
        this.isRunning = false;
        
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
        
        await redis.quit();
        await prisma.$disconnect();
        
        console.log('Worker stopped');
    }
}

export default MeetingWorker;