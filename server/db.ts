import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set for MySQL database.",
  );
}

// Parse MySQL connection string and create pool
const connectionString = process.env.DATABASE_URL;
const url = new URL(connectionString);

const poolConfig: any = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: decodeURIComponent(url.password), // Decode URL-encoded password
  database: url.pathname.slice(1),
  connectTimeout: 10000,
  connectionLimit: 5
};

// Only add SSL if not explicitly disabled
if (url.searchParams.get('ssl') !== 'false') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = mysql.createPool(poolConfig);

export const db = drizzle(pool, { schema, mode: 'default' });