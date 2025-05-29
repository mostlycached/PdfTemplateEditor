import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

if (!process.env.AZURE_MYSQL_CONNECTION_STRING) {
  throw new Error(
    "AZURE_MYSQL_CONNECTION_STRING must be set for Azure MySQL database.",
  );
}

// Parse Azure MySQL connection string and create pool with proper SSL config
const connectionString = process.env.AZURE_MYSQL_CONNECTION_STRING;
const url = new URL(connectionString);

// Extract SSL parameter from query string
const urlParams = new URLSearchParams(url.search);
const sslRequired = urlParams.get('ssl') === 'true' || urlParams.get('sslmode') === 'require';

export const pool = mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: sslRequired ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema, mode: 'default' });