# Production Deployment & Operations Guide
## Al Mukammal Computer Trading LLC — E-Commerce Platform

---

### 1. Executive Architecture Summary

- **Framework:** Next.js 15 (App Router with React 19 Server & Client Components)
- **Database:** MongoDB 6.0+ via Mongoose ODM (Connection pooling with cached promises)
- **Authentication:** Cryptographic stateless JWT tokens stored in HTTP-only cookies and Authorization headers, enforced at edge via `middleware.js`
- **Localization:** United Arab Emirates (AED Currency, 7 Emirates delivery selector, WhatsApp order integration to `+971 50 955 0121`)
- **Design System:** Juspay-inspired dark surface palette, pill buttons, electric indigo/blue accents, fluid typography.

---

### 2. Production Prerequisites

1. **Runtime:** Node.js `>= 18.18.0` (Node.js 20 LTS recommended).
2. **Package Manager:** `npm` `>= 9.0.0` or `pnpm` / `yarn`.
3. **Database:** MongoDB Atlas M0/M10+ cluster with:
   - IP Whitelist configured (or `0.0.0.0/0` with strong SCRAM-SHA-256 credentials).
   - Replica set enabled (`retryWrites=true&w=majority`).
4. **Domain & SSL:** Qualified domain name (e.g. `almukammal.ae`) with valid TLS/SSL certificates.
5. **Environment Variables:** All variables outlined in [.env.example](file:///e:/Al_MUKAMMAL_PART_2/.env.example).

---

### 3. Deployment Option A: Vercel (Recommended)

Next.js is natively optimized for Vercel with zero-configuration edge routes and image optimization.

#### Step 1: Connect Repository
1. Import the Git repository in the Vercel Dashboard.
2. Select framework preset: **Next.js**.
3. Root Directory: `./`.

#### Step 2: Configure Environment Variables
In **Project Settings > Environment Variables**, add:
- `MONGODB_URI`: Your production MongoDB connection string.
- `JWT_SECRET`: High-entropy 32+ character random string (`openssl rand -base64 32`).
- `ADMIN_SECRET_KEY`: Secret passcode for admin registration.
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: `971509550121`
- `NEXT_PUBLIC_APP_URL`: `https://almukammal.ae`
- `NODE_ENV`: `production`

#### Step 3: Deploy
Click **Deploy**. Vercel will run `npm run build` and provision serverless functions automatically.

---

### 4. Deployment Option B: Docker Containerization

For self-hosted environments (AWS ECS, Google Cloud Run, DigitalOcean Kubernetes, or dedicated VPS).

#### Multi-Stage `Dockerfile`
Create `Dockerfile` in the root directory:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000

CMD ["npm", "start"]
```

#### Run Container:
```bash
docker build -t almukammal-app:latest .
docker run -d \
  --name almukammal \
  -p 3000:3000 \
  --env-file .env.production \
  --restart always \
  almukammal-app:latest
```

---

### 5. Deployment Option C: Linux VPS (Ubuntu 22.04 LTS) with PM2 & Nginx

#### Step 1: Server Setup
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx git
sudo npm install -g pm2
```

#### Step 2: Clone and Build
```bash
cd /var/www
git clone <repo-url> almukammal
cd almukammal
npm ci
cp .env.example .env.local
# Edit .env.local with production credentials
nano .env.local
npm run build
```

#### Step 3: Configure PM2 Process Manager
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'almukammal',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

Launch with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Step 4: Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/almukammal`:
```nginx
server {
    server_name almukammal.ae www.almukammal.ae;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 20M;
}
```

Enable site & SSL:
```bash
sudo ln -s /etc/nginx/sites-available/almukammal /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo certbot --nginx -d almukammal.ae -d www.almukammal.ae
```

---

### 6. Database Seeding & Verification

To verify database connectivity and seed default admin accounts and initial laptop SKUs:

```bash
# 1. Verify product inventory in database
node scripts/checkProducts.js

# 2. Provision initial store settings and delivery rules
# Navigate to /admin/settings in browser or trigger POST /api/admin/settings
```

---

### 7. Backup & Maintenance Protocol

1. **MongoDB Backups:** Enable continuous backups in MongoDB Atlas with point-in-time recovery.
2. **Log Monitoring:** View PM2 logs via `pm2 logs almukammal` or Vercel Runtime Logs.
3. **SSL Renewal:** Certbot handles automatic renewal via cron (`sudo certbot renew --dry-run`).
4. **Security Audits:** Regularly run `npm audit` and update dependencies.
