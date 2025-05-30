import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

if (!process.env.AZURE_MYSQL_CONNECTION_STRING) {
  throw new Error(
    "AZURE_MYSQL_CONNECTION_STRING must be set for Azure MySQL database.",
  );
}

// Parse Azure MySQL connection string and create pool without SSL
const connectionString = process.env.AZURE_MYSQL_CONNECTION_STRING;
const url = new URL(connectionString);

export const pool = mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: decodeURIComponent(url.password), // Decode URL-encoded password
  database: url.pathname.slice(1),
  ssl: false,
  connectTimeout: 10000,
  connectionLimit: 5
});

export const db = drizzle(pool, { schema, mode: 'default' });