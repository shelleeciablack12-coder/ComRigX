# Railway Deployment Checklist for ComRigX

## Status: Connected ✅
- GitHub Repository: `shelleeciablack12-coder/ComRigX` (synced)
- Railway Project: `impartial-love`
- Backend Service: `backend` (created)
- Local Link: ✅ Done (`railway link -p impartial-love`)

---

## Next Steps (Complete via Web Dashboard)

### 1. Add MongoDB Service ⏳
**Navigate to:** https://railway.app/dashboard → Projects → `impartial-love`

Steps:
1. Click **+ New** button
2. Select **Database**
3. Choose **MongoDB**
4. Wait for provisioning (2-3 minutes)
5. MongoDB_URL will auto-populate in environment variables

### 2. Connect GitHub Repository ⏳
**In Railway Dashboard:**
1. Click **Settings** tab
2. Scroll to **Source Repository**
3. Click **Connect GitHub**
4. Select `shelleeciablack12-coder/ComRigX`
5. Enable auto-deploy on push

### 3. Configure Environment Variables ⏳
**In backend service settings:**

Add these variables:
```
NODE_ENV = production
ALLOWED_ORIGINS = *
VITE_BACKEND_URL = <your-railway-domain>
```

**MongoDB connection:**
- MongoDB automatically provides `MONGODB_URI` when database is added
- No manual configuration needed

### 4. Deploy ⏳
Once MongoDB is provisioned and GitHub connected:
1. Click **Deploy** button
2. Monitor deployment logs
3. Wait for status: **Running ✓**

---

## Deployment Details

### Backend Service Configuration
```
Start Command: node server/index.js
Port: 3001
Environment: production
```

### What Railway Auto-Provides
- **MONGODB_URI**: Connection string (auto-generated)
- **MONGODB_PASSWORD**: Database password
- **RAILWAY_ENVIRONMENT_ID**: Internal identifier

### Expected Logs on Successful Deploy
```
✅ MongoDB connected (or 📁 Using file-based persistence as fallback)
🚀 Server running on port 3001
Socket.IO server initialized
```

---

## Post-Deployment Tasks

### 1. Run Data Migration (One-time) ⏳
After first deploy, run in Railway:
```bash
railway run node server/migrate-to-mongodb.js
```

### 2. Test Deployment ⏳
1. Open your Railway domain (yourdomain.up.railway.app)
2. Create a test account
3. Send test messages
4. Verify messages persist by reloading

### 3. Optional: Custom Domain ⏳
**In Railway Settings:**
1. Go to **Domains** tab
2. Add custom domain
3. Configure DNS at domain registrar
4. Wait for SSL certificate

---

## Troubleshooting

### If Deploy Fails
- Check logs: Railway Dashboard → Logs tab
- Common issues:
  - Missing `package.json` at root (ComRigX has server/package.json)
  - Port not 3001 (Railway auto-detects from Procfile)
  - Environment variables not set

### If MongoDB Connection Fails
- Railway auto-creates MONGODB_URI
- Fallback to file-based persistence kicks in automatically
- Check logs for "Using file-based persistence" message

### Check Service Status
```bash
railway status
railway logs -f  # Follow logs in real-time
```

---

## Account Credentials (For Testing)

**Alice Smith:**
- Phone: 5551234567
- Username: alice_test
- ID: 626506472200
- Password: SecurePassword123!

**Bob Jones:**
- Phone: 5559876543
- Username: bob_test
- ID: 951902677964
- Password: BobPassword456!

---

## Important Notes

1. **Auto-fallback**: If MongoDB unavailable, app switches to file-based JSON persistence
2. **Zero downtime**: Hot-reload not needed, Railway handles restarts
3. **Cost**: MongoDB free tier + backend + traffic = ~$5-10/month
4. **Scaling**: App auto-scales on Railway with increased traffic

---

## Quick Links

- **Railway Dashboard**: https://railway.app/dashboard
- **GitHub Repo**: https://github.com/shelleeciablack12-coder/ComRigX
- **Railroad CLI Docs**: https://docs.railway.app/cli/commands
- **MongoDB Atlas Docs**: https://docs.mongodb.com/manual/

---

**Timeline**: 10-15 minutes to fully deploy once you complete web dashboard steps
