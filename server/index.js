import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const { Pool } = pg;
const app = express();
const PORT = 3000;
const SECRET_KEY = "your-secret-key-change-in-production";

// Use connection pool for better performance
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(cors());
app.use(bodyParser.json());

// Sign Up Endpoint
app.post('/api/signup', async (req, res) => {
    const { email, password, fullName } = req.body;

    try {
        // Check if user exists
        const checkRes = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
        if (checkRes.rows.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = randomUUID();
        const now = new Date();

        // Insert new user
        const insertRes = await pool.query(
            'INSERT INTO "User" (id, email, password, name, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name',
            [id, email, hashedPassword, fullName, now, now]
        );

        const user = insertRes.rows[0];
        res.json({ message: "User created successfully", user });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: "Login successful", token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
