# Neon PostgreSQL Setup Guide

This project has been configured to use Neon PostgreSQL instead of Cloudflare D1. Follow these steps to complete the setup:

## 1. Create a Neon Account
1. Sign up at https://neon.tech
2. Create a new project/database

## 2. Get Your Connection String
1. In the Neon dashboard, go to your project
2. Find the connection string (it should look like: `postgresql://user:password@host.neon.tech/neondb?sslmode=require`)
3. **Important**: Use the **pooled connection string** for better performance in serverless environments

## 3. Configure Environment Variables

### For Local Development:
1. Copy `.dev.vars.example` to `.dev.vars`:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
2. Update `.dev.vars` with your Neon connection string:
   ```
   DATABASE_URL=postgresql://user:password@host.neon.tech/neondb?sslmode=require
   ```

### For Production:
1. Add the connection string as a Cloudflare secret:
   ```bash
   wrangler secret put DATABASE_URL
   ```
2. Paste your Neon connection string when prompted

## 4. Create Database Schema
Execute the PostgreSQL schema:
```bash
psql $DATABASE_URL -f ./setup-neon-db.sql
```

Or if you don't have psql installed, you can run the SQL directly in the Neon dashboard SQL editor.

## 5. Test Your Setup
1. Start the development server:
   ```bash
   pnpm dev
   ```
2. Test the API endpoints:
   - GET `/api/contacts` - List all contacts
   - POST `/api/contacts` - Create a new contact
   - GET `/api/contacts/:id` - Get a specific contact
   - PATCH `/api/contacts/:id` - Update a contact
   - DELETE `/api/contacts/:id` - Delete a contact

## What's Changed from D1

- **Database**: SQLite (D1) → PostgreSQL (Neon)
- **Driver**: Drizzle D1 adapter → Neon serverless driver
- **Schema**: Updated to use PostgreSQL types (serial, timestamp with timezone)
- **Connection**: Direct D1 binding → DATABASE_URL environment variable

## Troubleshooting

- Make sure you're using the **pooled** connection string from Neon
- Ensure `.dev.vars` is not committed to git (it's already in .gitignore)
- If you see connection errors, verify your DATABASE_URL is correctly set
- Check that your Neon database is active (free tier databases may sleep after inactivity)