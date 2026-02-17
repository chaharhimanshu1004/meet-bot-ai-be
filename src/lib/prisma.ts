import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma

prisma.$connect()
    .then(() => {
        console.log("Successfully connected to Database");
    })
    .catch((e: any) => {
        console.error("Failed to connect to Database:", e);
        process.exit(1);
    });

