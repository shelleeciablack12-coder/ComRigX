# Railway Deployment - Manual Setup

## ✅ Completed
- ✅ Railway CLI installed
- ✅ Logged in as: shelleeciablack12@gmail.com
- ✅ Code pushed to GitHub

## 📋 Manual Setup via Railway Dashboard

Since the CLI init had issues, let's use the web dashboard for faster setup:

### Step 1: Create Project on Railway Dashboard
1. Go to https://railway.app/dashboard
2. Click "Create New Project"
3. Give it name: **ComRigX**
4. Select "Deploy from GitHub repo"
5. Connect your account and select: **ComRigX**

### Step 2: Configure Build & Start Commands
In Railway project settings:
- **Build Command**: (leave default or `npm install`)
- **Start Command**: `node server/index.js`
- **Root Directory**: (leave blank)

### Step 3: Add Environment Variables
Click "Variables" and add:

```
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://yourdomain.com
VITE_BACKEND_URL=https://yourdomain.com
```

**⚠️ IMPORTANT - MongoDB Connection:**

Before adding MONGODB_URI, you need to:
1. Create MongoDB Atlas account: https://www.mongodb.com/cloud/atlas
2. Create a free cluster (M0)
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/comrigx`
4. Add to Railway variables as: `MONGODB_URI`

### Step 4: Add MongoDB Service (Optional but Recommended)
In Railway dashboard:
1. Click "Add Service"
2. Select "MongoDB"
3. Railway will provision a MongoDB instance automatically
4. Copy the connection string from MongoDB service

### Step 5: Deploy
1. Click "Deploy" button in Railway
2. Watch build logs in real-time
3. Deployment completes when green checkmark appears

### Step 6: Run Migration (One-time only)
After deployment succeeds:

```bash
railway run node server/migrate-to-mongodb.js
```

This converts your JSON data to MongoDB.

### Step 7: Add Domain (Optional)
1. In Railway project settings → Domains
2. Add custom domain
3. Configure DNS records
4. SSL certificate auto-generates

---

## 🚀 Direct Link to Railroad Dashboard
**Create project here**: https://railway.app/dashboard

---

## 📊 What Railway Does Automatically
✅ Detects Node.js app  
✅ Installs npm dependencies  
✅ Builds frontend (Vite)  
✅ Starts server on PORT 3001  
✅ Assigns temporary domain  
✅ Sets up SSL/TLS  
✅ Provides logs & monitoring  
✅ Auto-deploys on GitHub push  

---

## 📱 After Deployment

Your app will be live at:
- **Railway Domain**: `comrigx.up.railway.app` (auto-assigned)
- **Custom Domain**: `yourdomain.com` (after setup)

Test with:
1. Open the URL in browser
2. Sign up a new account
3. Send messages
4. Verify data persists

---

## 🆘 If Issues Occur

**Build failed**: Check logs in Railway dashboard  
**MongoDB not connecting**: Verify MONGODB_URI variable  
**Deployment stuck**: Kill and restart in Railway dashboard  
**Domain not working**: Wait 10 minutes for DNS propagation  

---

## 📞 Resources
- **Railway Docs**: https://docs.railway.app
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **ComRigX Guides**: See MONGODB_DEPLOYMENT_GUIDE.md

---

**Status**: Ready for manual dashboard setup ✅  
**Time to production**: 10-15 minutes  
**Next**: Go to https://railway.app/dashboard and create your project!
