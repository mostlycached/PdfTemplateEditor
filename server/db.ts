import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

// Use Azure MySQL connection string if available, otherwise fall back to DATABASE_URL
const connectionString = process.env.AZURE_MYSQL_CONNECTION_STRING || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or AZURE_MYSQL_CONNECTION_STRING must be set. Did you forget to provision a database?",
  );
}

// Parse connection string and create MySQL connection pool
const url = new URL(connectionString);

export const pool = mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
  connectTimeout: 30000,
  connectionLimit: 10,
  acquireTimeout: 30000,
  timeout: 30000
});

export const db = drizzle(pool, { schema, mode: 'default' });