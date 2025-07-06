# Official Render Deployment Guide

Based on the [Render Blueprint YAML Reference](https://render.com/docs/blueprint-spec), this guide provides the correct approach for deploying your social marketplace project.

## 🎯 Key Findings from Official Documentation

### PostgreSQL Database Configuration
- **PostgreSQL databases are defined in the `databases` section, NOT in `services`**
- **No `startCommand` required** for PostgreSQL databases
- **No `runtime` field** for PostgreSQL databases
- **Valid plans**: `free`, `basic-256mb`, `basic-1gb`, `basic-4gb`, `pro-*`, `accelerated-*`

### Service Configuration
- **Web services** go in the `services` section
- **Static sites** use `runtime: static`
- **Node.js services** use `runtime: node`

## 📁 Available Configuration Files

### 1. `render-corrected-final.yaml` (RECOMMENDED)
```bash
node switch-render-version.js corrected-final
```

**Features:**
- ✅ Correct PostgreSQL database definition
- ✅ Proper service structure
- ✅ Environment variable linking
- ✅ Secret management with `sync: false`

### 2. `render-no-db.yaml` (Manual Database)
```bash
node switch-render-version.js no-db
```

**Features:**
- ✅ Services only (no database)
- ✅ Manual database creation required
- ✅ Good for testing

### 3. Other Versions
```bash
node switch-render-version.js correct    # Has runtime: postgresql (incorrect)
node switch-render-version.js working    # Removed problematic fields
node switch-render-version.js final      # Uses runtime: postgresql (incorrect)
```

## 🚀 Deployment Steps

### Option 1: Full Blueprint Deployment (Recommended)

1. **Switch to corrected configuration:**
   ```bash
   node switch-render-version.js corrected-final
   ```

2. **Commit and push:**
   ```bash
   git add render.yaml
   git commit -m "Use corrected render.yaml with proper PostgreSQL configuration"
   git push
   ```

3. **Deploy on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Create new Blueprint
   - Connect your GitHub repository
   - Render will automatically create:
     - PostgreSQL database (`social-marketplace-db`)
     - Backend API service (`social-marketplace-api`)
     - Frontend static site (`social-marketplace-frontend`)

4. **Configure secrets:**
   - During Blueprint creation, you'll be prompted for:
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - `TELEGRAM_BOT_TOKEN`

### Option 2: Manual Database Creation

1. **Switch to no-db configuration:**
   ```bash
   node switch-render-version.js no-db
   ```

2. **Create database manually:**
   - Go to Render Dashboard
   - Create new PostgreSQL database
   - Note the connection details

3. **Deploy services:**
   - Create Blueprint with the no-db configuration
   - Manually add `DATABASE_URL` environment variable to backend service

## 🔧 Configuration Details

### Correct PostgreSQL Definition
```yaml
databases:
  - name: social-marketplace-db
    plan: basic-256mb
    databaseName: social_marketplace
    user: app_user
```

### Correct Service Definition
```yaml
services:
  - type: web
    name: social-marketplace-api
    runtime: node
    buildCommand: npm install
    startCommand: npm start
```

### Environment Variable Linking
```yaml
envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: social-marketplace-db
      property: connectionString
```

## 🐛 Common Issues & Solutions

### Issue: "invalid runtime postgresql"
**Solution:** PostgreSQL databases don't use `runtime` field. Use the `databases` section instead.

### Issue: "non-docker, non-static, non-image runtime postgresql must have startCommand"
**Solution:** PostgreSQL databases don't need `startCommand`. This field is only for services.

### Issue: Database connection fails
**Solution:** Ensure the database name in `fromDatabase` matches the database `name` in the `databases` section.

## 📋 Validation Checklist

Before deploying, verify your `render.yaml`:

- [ ] PostgreSQL database is in `databases` section
- [ ] No `runtime` field for PostgreSQL
- [ ] No `startCommand` for PostgreSQL
- [ ] Services are in `services` section
- [ ] Environment variables use `fromDatabase` for database references
- [ ] Secrets use `sync: false`

## 🔄 Switching Between Configurations

Use the switch script to easily change configurations:

```bash
# List all available versions
node switch-render-version.js

# Switch to specific version
node switch-render-version.js corrected-final
node switch-render-version.js no-db
```

## 📞 Support

If you encounter issues:

1. **Check Render logs** in the dashboard
2. **Verify configuration** using the validation checklist
3. **Use the switch script** to try different configurations
4. **Consult Render documentation** at [render.com/docs](https://render.com/docs)

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ All services show "Live" status
- ✅ Database connection string is properly set
- ✅ Frontend can communicate with backend
- ✅ OAuth flows work correctly
- ✅ Database migrations run successfully 