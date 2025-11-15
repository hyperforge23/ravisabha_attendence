# MongoDB Setup Guide

This guide explains how to configure MongoDB with separate databases for development and production using a single MongoDB Atlas free instance.

## Overview

You'll use **one MongoDB Atlas cluster** with **two different database names**:
- **Development**: `ravisabha_dev` (for local development)
- **Production**: `ravisabha_prod` (for Vercel production)

Both databases will be on the same cluster, but completely isolated from each other.

## Step 1: Get Your MongoDB Connection String

1. **Sign in to MongoDB Atlas**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign in or create a free account

2. **Create or Select a Cluster**
   - If you don't have a cluster, create a free M0 cluster
   - Wait for the cluster to finish provisioning

3. **Get Your Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It will look like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

4. **Create Database User** (if not done)
   - Go to "Database Access" in the left sidebar
   - Create a database user with username and password
   - Save the credentials securely

## Step 2: Configure Environment Variables

### For Local Development (.env.local)

Create a `.env.local` file in your project root (or copy from `.env.development`):

```env
# MongoDB Configuration - Development Database
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ravisabha_dev?retryWrites=true&w=majority
MONGODB_DB_NAME=ravisabha_dev

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_URL=http://localhost:3000/api

# App Configuration
NEXT_PUBLIC_APP_NAME=Ravi Sabha Attendance
NEXT_PUBLIC_APP_ENV=development
```

**Important Notes:**
- Replace `username` and `password` with your MongoDB Atlas database user credentials
- Replace `cluster0.xxxxx.mongodb.net` with your actual cluster address
- The database name `ravisabha_dev` will be created automatically when you first connect
- The `?retryWrites=true&w=majority` part is important for connection options

### For Production (Vercel Dashboard)

1. **Go to Vercel Project Settings**
   - Navigate to your project in Vercel dashboard
   - Go to **Settings** → **Environment Variables**

2. **Add MongoDB Variables**
   - Click "Add New"
   - **Name**: `MONGODB_URI`
   - **Value**: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ravisabha_prod?retryWrites=true&w=majority`
     - Use the **same connection string** but change the database name to `ravisabha_prod`
   - **Environments**: Select "Production", "Preview", and "Development" (or just "Production")
   - Click "Save"

   - Add another variable:
   - **Name**: `MONGODB_DB_NAME`
   - **Value**: `ravisabha_prod`
   - **Environments**: Select "Production"
   - Click "Save"

3. **Add Other Environment Variables**
   - Add all other variables from your `.env.production` file
   - Make sure to set `NEXT_PUBLIC_API_URL` to your actual Vercel domain

## Step 3: Configure MongoDB Network Access

1. **Allow IP Addresses**
   - In MongoDB Atlas, go to "Network Access"
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0) - this is safe for free tier
   - For production: Vercel uses dynamic IPs, so you'll need to allow 0.0.0.0/0 anyway
   - Click "Confirm"

## Step 4: Understanding Database Separation

### How It Works

- **Same Cluster**: Both databases use the same MongoDB Atlas cluster
- **Different Databases**: 
  - `ravisabha_dev` - All your development data
  - `ravisabha_prod` - All your production data
- **Complete Isolation**: Data in one database cannot access data in the other
- **Same Collections**: You can use the same collection names in both databases

### Example Structure

```
MongoDB Cluster
├── ravisabha_dev (Development)
│   ├── users
│   ├── attendance
│   └── sessions
└── ravisabha_prod (Production)
    ├── users
    ├── attendance
    └── sessions
```

## Step 5: Using MongoDB in Your Code

### Example Connection (using mongoose)

```typescript
// lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log(`Connected to MongoDB: ${MONGODB_DB_NAME}`);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
```

### Example Usage in API Route

```typescript
// app/api/attendance/route.ts
import connectDB from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    // Your database operations here
    // Collections will automatically use the database from MONGODB_URI
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
```

## Step 6: Testing Your Setup

### Test Local Connection

1. Update `.env.local` with your MongoDB connection string
2. Run your development server:
   ```bash
   npm run dev
   ```
3. Check the console for connection messages
4. Make a test API call to verify database connection

### Test Production Connection

1. Deploy to Vercel
2. Check Vercel function logs for connection errors
3. Test your API endpoints
4. Verify data is being saved to `ravisabha_prod` database

## Troubleshooting

### Connection Timeout
- **Issue**: Cannot connect to MongoDB
- **Solution**: 
  - Check Network Access in MongoDB Atlas (allow 0.0.0.0/0)
  - Verify connection string is correct
  - Check username/password are correct

### Authentication Failed
- **Issue**: Authentication error
- **Solution**:
  - Verify database user credentials
  - Ensure user has read/write permissions
  - Check if password has special characters (may need URL encoding)

### Database Not Found
- **Issue**: Database doesn't exist
- **Solution**: 
  - This is normal! MongoDB creates databases automatically on first write
  - Just start using your collections and the database will be created

### Wrong Database Being Used
- **Issue**: Production using dev database or vice versa
- **Solution**:
  - Double-check `MONGODB_URI` in Vercel dashboard includes `ravisabha_prod`
  - Verify `.env.local` includes `ravisabha_dev`
  - Restart your dev server after changing env variables

## Security Best Practices

1. ✅ **Never commit** `.env.local` or `.env.production` with real credentials
2. ✅ **Use Vercel Dashboard** for all production secrets
3. ✅ **Rotate passwords** regularly
4. ✅ **Use database users** with minimal required permissions
5. ✅ **Monitor** your MongoDB Atlas dashboard for unusual activity
6. ✅ **Backup** important data (MongoDB Atlas free tier includes backups)

## Free Tier Limitations

MongoDB Atlas Free Tier (M0) includes:
- 512 MB storage
- Shared RAM and vCPU
- Free backups
- Sufficient for development and small production apps

If you need more:
- Monitor your usage in MongoDB Atlas dashboard
- Upgrade when needed (pay-as-you-go available)

## Next Steps

1. ✅ Set up MongoDB Atlas cluster
2. ✅ Configure environment variables
3. ✅ Install MongoDB driver: `npm install mongoose` (or `mongodb`)
4. ✅ Create database connection utility
5. ✅ Test local connection
6. ✅ Deploy to Vercel and test production connection

---

**Need Help?**
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

