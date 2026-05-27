# ComRigX MongoDB Deployment Guide

## Overview
ComRigX now uses a hybrid database system:
- **Development**: File-based JSON (automatic)
- **Production**: MongoDB with automatic fallback to file-based if MongoDB unavailable

## Deployment Workflow

### Phase 1: Local MongoDB Testing (Optional but Recommended)

#### Option A: Docker (Easiest)
```powershell
# Start MongoDB container
docker run -d -p 27017:27017 --name comrigx-mongo mongo:latest

# Test connection
npm start  # Server will auto-detect MONGODB_URI if set

# Stop when done
docker stop comrigx-mongo
docker rm comrigx-mongo
```

#### Option B: MongoDB Community Edition
1. Download from https://www.mongodb.com/try/download/community
2. Install locally
3. MongoDB runs on localhost:27017 by default

### Phase 2: MongoDB Atlas Setup (Recommended for Production)

#### Step 1: Create Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create organization and project

#### Step 2: Create Cluster
1. Click "Build a Database"
2. Select "M0 Sandbox" (free tier, 512MB storage)
3. Choose cloud provider (AWS/GCP/Azure)
4. Select region closest to users
5. Create cluster

#### Step 3: Get Connection String
1. Click "Connect"
2. Select "Drivers" → "Node.js"
3. Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/comrigx`
4. **Keep this secret!** Add to `.env` or platform secrets, never commit to git

#### Step 4: Configure Network Access
1. Click "Network Access"
2. Add IP addresses that will connect (or 0.0.0.0/0 for development only)
3. For production: Add specific IP addresses only

#### Step 5: Create Database User
1. Click "Database Access"
2. Add Database User
3. Set username/password
4. Note these for connection string

### Phase 3: Choose Deployment Platform

#### Option 1: Railway (⭐ Recommended - Easiest)

**Railway Setup:**
1. Go to https://railway.app
2. Sign up (connect GitHub)
3. Create new project
4. Select "Deploy from GitHub"
5. Connect your ComRigX repository

**Configure Environment:**
1. Go to Project Settings
2. Add environment variables:
   ```
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/comrigx
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```
3. Set build command: (leave default)
4. Set start command: `node server/index.js`

**Deploy:**
1. Push to GitHub main branch
2. Railway auto-deploys
3. Visit provided URL

#### Option 2: Docker (Any Cloud Provider)

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Run migration (first time only)
docker-compose exec server node migrate-to-mongodb.js

# View logs
docker-compose logs -f server
```

#### Option 3: VPS Manual (AWS/DigitalOcean/Linode)

1. Rent VPS (Ubuntu 22.04 recommended)
2. SSH into server
3. Install Node.js, npm
4. Clone repository
5. Install dependencies: `npm install` (both client and server)
6. Build client: `cd client && npm run build`
7. Set environment variables in `.env`
8. Start server: `npm start`
9. Use Nginx as reverse proxy (see nginx.conf)

### Phase 4: Data Migration

#### Run Migration Script (First Time Only)
```bash
# If using Railway, run via Railway CLI:
railway run node server/migrate-to-mongodb.js

# If local or VPS:
cd server
node migrate-to-mongodb.js
```

**What the script does:**
- Reads `server/data/users.json`
- Reads `server/data/messages.json`
- Reads `server/data/conversations.json`
- Reads `server/data/unread.json`
- Creates MongoDB documents
- Verifies migration count
- Reports success/failure

**Output example:**
```
✅ MongoDB Migration Complete
📊 Summary:
   Users migrated: 10
   Messages migrated: 24
   Conversations migrated: 3
   Unread counts migrated: 6
```

### Phase 5: Test Deployment

#### Checklist
- [ ] MongoDB connection string is correct
- [ ] Environment variables are set
- [ ] ALLOWED_ORIGINS includes your domain
- [ ] Migration script ran successfully
- [ ] Server logs show "✅ MongoDB connected"
- [ ] Can create new user account
- [ ] Can login to existing account
- [ ] Can send messages
- [ ] Messages persist after server restart
- [ ] Online user list updates in real-time

#### Manual Testing
```bash
# Check server is running
curl https://yourdomain.com/api/health

# Signup test
curl -X POST https://yourdomain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"5551234567","username":"testuser","password":"Test123!","displayName":"Test User"}'

# Login test
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"5551234567","password":"Test123!"}'
```

### Phase 6: Monitor & Scale

#### Performance Metrics
- MongoDB Atlas shows:
  - Request count
  - Network I/O
  - Storage usage
  - Connection count

#### Scaling
- **M0 Free Tier**: ~1000 users, good for MVP
- **M2 Shared**: ~10K users, $9/month
- **M10 Dedicated**: ~100K users, $57/month

#### Backup
- MongoDB Atlas auto-backups daily
- Configure retention: 7-90 days

### Troubleshooting

#### Server won't start
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: MongoDB not running or wrong connection string
- Verify MONGODB_URI is set
- Test: `mongoose.connect(MONGODB_URI)`
- Falls back to file-based automatically if MongoDB unavailable

#### Messages not persisting
**Solution**: Likely using file-based mode
- Check environment logs for "Using file-based persistence"
- Set MONGODB_URI in environment
- Restart server

#### Connection timeout from client
**Solution**: ALLOWED_ORIGINS misconfigured
- Add your domain to ALLOWED_ORIGINS
- Restart server
- Check CORS headers in browser DevTools

#### High MongoDB latency
**Solution**: Cluster far from users
- Move cluster to closer region
- Check connection pooling settings
- Monitor Atlas dashboard

### Security Checklist

- [ ] MongoDB password is strong (20+ characters, mixed case, numbers, symbols)
- [ ] Connection string stored in environment variables only
- [ ] `.env` file in .gitignore (never commit secrets)
- [ ] ALLOWED_ORIGINS lists only your domain(s)
- [ ] MongoDB Atlas IP whitelist is restrictive
- [ ] SSL/TLS enabled (Railway/cloud providers handle this)
- [ ] Session tokens expire after 30 days
- [ ] Passwords hashed with PBKDF2 (100,000 iterations)

### Rollback Plan

If issues occur:
1. Check server logs: `npm start` in development mode
2. Verify MONGODB_URI connection string
3. If persistent: Temporarily remove MONGODB_URI to use file-based fallback
4. Users can still access with existing sessions
5. New data saves to file-based system
6. Fix MongoDB issue
7. Add MONGODB_URI back and restart
8. Run migration script again if needed

### Support Resources

- **Mongoose Docs**: https://mongoosejs.com
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Railway Docs**: https://docs.railway.app
- **Docker Docs**: https://docs.docker.com
- **ComRigX Project**: Review DEPLOYMENT_READINESS.md

### Next: API Monitoring & Analytics

After deployment, consider:
1. Error tracking: Sentry, LogRocket
2. Analytics: Plausible, Mixpanel
3. Uptime monitoring: UptimeRobot, Healthchecks.io
4. Real-time database GUI: MongoDB Compass

---

**Status**: ✅ Ready to Deploy  
**Last Updated**: 2026-05-27  
**MongoDB Version**: 7.0+  
**Node.js Version**: 18.0+
