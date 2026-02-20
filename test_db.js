import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

console.log("Starting DB connection test - Robust Version");

async function main() {
    let prisma;
    try {
        console.log("Attempting to instantiate PrismaClient...");
        prisma = new PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
            datasources: {
                db: {
                    url: process.env.DATABASE_URL
                }
            }
        });
        console.log("PrismaClient instantiation SUCCESS.");

        console.log("Connecting...");
        await prisma.$connect();
        console.log("Connected successfully!");

        // Try a simple query
        const count = await prisma.user.count();
        console.log(`User count: ${count}`);

    } catch (e) {
        console.log("--- CONNECTION ERROR ---");
        console.log("Message:", e.message);
        console.log("Stack:", e.stack);
    } finally {
        if (prisma) {
            try {
                await prisma.$disconnect();
            } catch (err) {
                console.error("Disconnect error", err);
            }
        }
    }
}

main();
