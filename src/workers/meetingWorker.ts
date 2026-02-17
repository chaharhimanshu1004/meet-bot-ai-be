import { chromium, BrowserContext, Page } from 'playwright';
import { redis } from '../config/redis';
import prisma from '../lib/prisma';
import { Constants } from '../lib/Constants';
import path from 'path';
import fs from 'fs';

interface MeetingJob {
    meetingId: string;
    meetLink: string;
    userId: string;
}

class MeetingWorker {
    private context: BrowserContext | null = null;
    private isRunning: boolean = true;
    private userDataDir: string = path.join(process.cwd(), 'user_data');

    public async start(): Promise<void> {
        console.log('Meeting Worker initialized successfully');

        process.on('SIGTERM', () => this.stop());
        process.on('SIGINT', () => this.stop());

        while (this.isRunning) {
            try {
                const jobData = await redis.lpop(Constants.REDIS_QUEUE_KEY);
                if (jobData) {
                    const job: MeetingJob = JSON.parse(jobData);
                    console.log('\n[JOB RECEIVED]');
                    console.log('Meeting ID:', job.meetingId);
                    console.log('Meeting Link:', job.meetLink);
                    console.log('-'.repeat(60));
                    await this.processMeeting(job);
                } else {
                    await this.sleep(Constants.REDIS_POLLING_INTERVAL);
                }
            } catch (error: any) {
                console.error('[WORKER ERROR]', error.message);
                await this.sleep(Constants.REDIS_POLLING_INTERVAL);
            }
        }
    }

    private async processMeeting(job: MeetingJob): Promise<void> {
        const { meetingId, meetLink } = job;

        try {
            console.log(`[STATUS UPDATE] Updating meeting ${meetingId} to JOINING...`);
            await prisma.meeting.update({
                where: { id: meetingId },
                data: { status: Constants.MEETING_STATUS.JOINING },
            });

            if (!this.context) await this.initializeBrowser();
            const page = await this.joinMeeting(meetLink, meetingId);

            console.log(`[WAITING] In lobby/knock state. Waiting for host to admit...`);

            let admitted = false;
            const startTime = Date.now();
            const timeout = 15 * 60 * 1000; // 15 minutes max wait

            while (!admitted && (Date.now() - startTime < timeout)) {
                // 1. More robust detection: Look for the "Chat" or "People" buttons which ONLY appear in-call
                // We use multiple common selectors to be safe
                const inCallUI = page.locator('[aria-label*="Show everyone"], [aria-label*="Chat with everyone"], button[data-tooltip*="Details"]').first();

                // 2. Also check if the "Asking to join" message has disappeared
                const askingToJoin = page.getByText(/Asking to join|Waiting for host/i);

                const isInside = await inCallUI.isVisible().catch(() => false);
                const isStillAsking = await askingToJoin.isVisible().catch(() => false);

                if (isInside && !isStillAsking) {
                    admitted = true;
                    break;
                }

                const denied = page.getByText(/Someone in the meeting wouldn't let you in/i);
                if (await denied.isVisible().catch(() => false)) {
                    throw new Error("Admission rejected by host.");
                }

                await this.sleep(3000); // Check every 3 seconds
            }

            if (admitted) {
                console.log(`[STATUS UPDATE] Admitted! Updating meeting ${meetingId} to IN_PROGRESS...`);
                await prisma.meeting.update({
                    where: { id: meetingId },
                    data: { status: Constants.MEETING_STATUS.IN_PROGRESS },
                });
            } else {
                throw new Error("Admission timeout.");
            }

        } catch (error: any) {
            console.error(`[PROCESS ERROR] Failed:`, error.message);
            await prisma.meeting.update({
                where: { id: meetingId },
                data: { status: Constants.MEETING_STATUS.FAILED },
            });
        }
    }

    private async initializeBrowser(): Promise<void> {
        if (!fs.existsSync(this.userDataDir)) fs.mkdirSync(this.userDataDir);

        console.log('Launching Stealth Browser...');
        this.context = await chromium.launchPersistentContext(this.userDataDir, {
            headless: false,
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            viewport: { width: 1280, height: 720 },
            permissions: ['camera', 'microphone', 'notifications'],
            ignoreDefaultArgs: ['--enable-automation'],
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-infobars',
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                '--mute-audio', // Removes "green" indicators/sounds
                '--disable-notifications',
                '--start-maximized',
            ],
        });

        await this.context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });
    }

    private async joinMeeting(meetLink: string, meetingId: string): Promise<Page> {
        if (!this.context) throw new Error("Browser not initialized");
        const page = await this.context.newPage();

        try {
            await page.goto(meetLink, { waitUntil: 'networkidle', timeout: 60000 });
            await this.sleep(5000);

            // Handle hardware permission/dismiss popups
            const dismiss = page.getByRole('button', { name: /got it|dismiss/i });
            if (await dismiss.isVisible()) await dismiss.click();

            // MUTE IMMEDIATELY (Shortcuts are most reliable)
            const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
            await page.keyboard.down(mod);
            await page.keyboard.press('d');
            await page.keyboard.press('e');
            await page.keyboard.up(mod);

            const nameInput = page.locator('input[type="text"]').first();
            if (await nameInput.isVisible()) {
                await nameInput.fill('Meeting Bot');
                await this.sleep(1000);
            }

            // Click the join button
            const joinBtn = page.locator('button span').filter({ hasText: /Join now|Ask to join/i }).first();
            if (await joinBtn.isVisible()) {
                await joinBtn.click();
            }

            return page;
        } catch (e: any) {
            throw e;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async stop(): Promise<void> {
        this.isRunning = false;
        if (this.context) await this.context.close();
        await redis.quit();
        await prisma.$disconnect();
    }
}

export default MeetingWorker;