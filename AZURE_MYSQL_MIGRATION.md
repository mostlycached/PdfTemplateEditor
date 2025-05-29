# Azure Database for MySQL Migration

This project has been migrated from Neon Database (PostgreSQL) to Azure Database for MySQL.

## Changes Made

### 1. Dependencies Updated
- Removed: `@neondatabase/serverless`
- Added: `mysql2` (MySQL driver)
- Updated: `drizzle-orm` to use MySQL dialect

### 2. Database Configuration (`server/db.ts`)
- Changed from Neon's serverless connection to MySQL2 connection pool
- Uses `mysql.createPool()` for better performance with connection pooling

### 3. Schema Changes (`shared/schema.ts`)
- Migrated from PostgreSQL syntax to MySQL syntax:
  - `pgTable` → `mysqlTable`
  - `serial` → `int().primaryKey().autoincrement()`
  - `integer` → `int`
  - `jsonb` → `json`
  - Imported from `drizzle-orm/mysql-core` instead of `drizzle-orm/pg-core`

### 4. Storage Layer (`server/storage.ts`)
- Removed `.returning()` calls (not supported in MySQL)
- Updated insert operations to query for newly created records
- All CRUD operations now MySQL-compatible

### 5. Drizzle Configuration (`drizzle.config.ts`)
- Changed dialect from `postgresql` to `mysql`

## Azure Database for MySQL Setup

### 1. Create Azure Database for MySQL
```bash
# Create resource group
az group create --name myResourceGroup --location eastus

# Create Azure Database for MySQL server
az mysql server create \
  --resource-group myResourceGroup \
  --name mydemoserver \
  --location eastus \
  --admin-user myadmin \
  --admin-password mypassword \
  --sku-name GP_Gen5_2 \
  --version 8.0
```

### 2. Configure Firewall Rules
```bash
# Allow Azure services
az mysql server firewall-rule create \
  --resource-group myResourceGroup \
  --server mydemoserver \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your IP (optional, for development)
az mysql server firewall-rule create \
  --resource-group myResourceGroup \
  --server mydemoserver \
  --name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

### 3. Create Database
```bash
az mysql db create \
  --resource-group myResourceGroup \
  --server-name mydemoserver \
  --name pdf_template_editor
```

### 4. Environment Variables
Create a `.env` file with your Azure MySQL connection string:

```env
DATABASE_URL=mysql://myadmin@mydemoserver:mypassword@mydemoserver.mysql.database.azure.com:3306/pdf_template_editor?ssl=true
NODE_ENV=development
```

**Connection String Format:**
```
mysql://username:password@hostname:port/database_name?ssl=true
```

**Important Notes:**
- Always use SSL (`?ssl=true`) for Azure Database for MySQL
- Username format: `username@servername` for Azure MySQL
- Port is typically `3306`

### 5. Run Migrations
```bash
# Generate migrations (already done)
npm run db:generate

# Push schema to database
npm run db:push
```

### 6. Seed Initial Data
The application will automatically seed template data when started.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Generate new migrations after schema changes
npx drizzle-kit generate

# Push schema changes to database
npx drizzle-kit push

# View database studio (optional)
npx drizzle-kit studio
```

## Troubleshooting

### Connection Issues
1. Check firewall rules in Azure portal
2. Verify SSL is enabled in connection string
3. Ensure correct username format: `username@servername`

### Migration Issues
1. Ensure DATABASE_URL is set correctly
2. Check database exists and is accessible
3. Verify user has proper permissions

### SSL Certificate Issues
```bash
# Download Azure MySQL SSL certificate
wget https://www.digicert.com/CACerts/BaltimoreCyberTrustRoot.crt.pem
```

Add to connection string:
```
mysql://user:pass@host:3306/db?ssl=true&sslca=/path/to/BaltimoreCyberTrustRoot.crt.pem
```
