import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

console.log("Testing connection with pg driver...");
console.log("URL:", process.env.DATABASE_URL ? "Found" : "Missing");

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function test() {
    try {
        await client.connect();
        console.log("Connected successfully with pg!");
        const res = await client.query('SELECT NOW()');
        console.log('Result:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error("PG Connection Error:", err);
    }
}

test();
