# 🚀 Railway Deployment Setup - Quick Start

## ✅ Prerequisites Completed
- ✅ Railway CLI installed globally
- ✅ Code committed to GitHub
- ✅ MongoDB integration complete
- ✅ All configuration files ready

## 🎯 Next Steps (Follow in Order)

### Step 1: Login to Railway
```bash
railway login
```
**What to do:**
1. Command will open your browser
2. Click "Authorize" on the Railway login page
3. Browser will show a token
4. Paste the token back in your terminal (or it auto-completes)

### Step 2: Create Railway Project
```bash
railway init
```
**What to do:**
1. Choose "Create a new project"
2. Give it a name (e.g., "ComRigX")
3. Answer prompts about your project setup

### Step 3: Set Environment Variables
After project creation, go to Railway Dashboard:
1. Go to https://railway.app/dashboard
2. Select your ComRigX project
3. Go to "Variables" section
4. Add these variables:

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/comrigx
ALLOWED_ORIGINS=https://yourdomain.com
VITE_BACKEND_URL=https://yourdomain.com
```

> **Important**: Get your MONGODB_URI from MongoDB Atlas first!

### Step 4: Deploy
```bash
railway up
```
**What to do:**
1. Select backend service
2. Watch deployment logs in terminal
3. Deployment completes when you see "✅ Service deployed"

### Step 5: Run Migration Script (One-Time)
```bash
railway run node server/migrate-to-mongodb.js
```
**What to do:**
1. This converts your existing JSON data to MongoDB
2. Only run once
3. Verify it says "✅ MongoDB Migration Complete"

### Step 6: Connect Your Domain
1. In Railway Dashboard → Settings
2. Add custom domain (e.g., yourdomain.com)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (auto-generated)

---

## 📋 MongoDB Atlas Setup (If Not Done)

### Get Your MongoDB Connection String:
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account or login
3. Create a cluster (M0 free tier)
4. Click "Connect"
5. Select "Drivers" → "Node.js"
6. Copy connection string
7. Replace username and password
8. Add to Railway environment variables as MONGODB_URI

---

## 🔧 Railway CLI Quick Commands

```bash
# Login to Railway
railway login

# Initialize project in current directory
railway init

# Deploy (push code and run build)
railway up

# View logs in real-time
railway logs

# Connect to postgres/mysql
railway connect

# Run a command in Railway environment
railway run <command>

# Check current project
railway status
```

---

## 📊 Expected Timeline

| Step | Time | Notes |
|------|------|-------|
| Login | 2 min | Browser-based auth |
| Init | 1 min | Name your project |
| Env Vars | 3 min | Add 5 variables |
| Deploy | 3-5 min | Automatic build & deploy |
| Migration | 1 min | Data conversion |
| **Total** | **10-15 min** | ⚡ Fast! |

---

## ✨ What Railway Does Automatically

✅ Reads your `package.json`  
✅ Installs dependencies  
✅ Builds your frontend  
✅ Starts your server  
✅ Assigns domain (youproject.up.railway.app)  
✅ Manages SSL/TLS certificates  
✅ Scales automatically  
✅ Provides logs and monitoring  

---

## 🎁 After Deployment

Your app will be available at:
- **Temporary**: `yourproject.up.railway.app` (auto-assigned)
- **Custom**: `yourdomain.com` (after domain setup)

You can then:
- ✅ Sign up and create accounts
- ✅ Send messages in real-time
- ✅ Have persistent data in MongoDB
- ✅ Access from anywhere
- ✅ Monitor via Railway dashboard

---

## 🆘 Troubleshooting

### "railway command not found"
```bash
npm install -g @railway/cli
```

### "Unauthorized" on login
- Log out: `railway logout`
- Log back in: `railway login`

### "Build failed"
- Check logs: `railway logs`
- Verify node_modules: `npm install`
- Check for syntax errors

### "Cannot connect to MongoDB"
- Verify MONGODB_URI is correct
- Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for dev)
- Verify credentials in connection string

### "Domain not working"
- Wait 5-10 minutes for DNS propagation
- Check Railway dashboard for SSL status
- Clear browser cache

---

## 📞 Helpful Links

- **Railway Docs**: https://docs.railway.app
- **Railway Dashboard**: https://railway.app/dashboard
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **ComRigX Guides**: See MONGODB_DEPLOYMENT_GUIDE.md

---

## 🚀 Ready to Deploy?

Run this now:
```bash
railway login
```

Then come back and I'll help with the next steps!

---

**Status**: All prerequisites complete ✅  
**Ready to deploy**: YES ✅  
**Estimated time**: 10-15 minutes ⚡
