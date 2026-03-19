# Deployment Guide — UNDERCOVER Game

Panduan deploy ke berbagai environment: VPS, Railway, dan Docker.

---

## Pilihan Deployment

| Opsi | Cocok Untuk | Difficulty |
|------|-------------|-----------|
| [VPS (Ubuntu)](#1-vps-ubuntu) | Production mandiri | Medium |
| [Railway](#2-railway) | Quick cloud deploy | Easy |
| [Docker Compose](#3-docker-compose) | Self-hosted + portabel | Medium |
| [PM2 (bare metal)](#4-pm2-bare-metal) | Server sederhana | Easy |

---

## 1. VPS (Ubuntu)

### Prasyarat
- Ubuntu 22.04 LTS
- Minimal 1 GB RAM, 1 vCPU
- Akses SSH sebagai root/sudo

### Step 1 — Install Node.js & MySQL

```bash
# Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL 8
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Cek versi
node -v   # v20.x.x
mysql -V  # 8.x.x
```

### Step 2 — Setup Database

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE undercover_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'undercover'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_KUAT';
GRANT ALL PRIVILEGES ON undercover_game.* TO 'undercover'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3 — Deploy App

```bash
# Clone project
git clone <repo-url> /var/www/undercover
cd /var/www/undercover

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env
```

Isi `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=undercover
DB_PASSWORD=GANTI_PASSWORD_KUAT
DB_NAME=undercover_game
NODE_ENV=production
```

```bash
# Build
npm run build

# Test jalankan
node .output/server/index.mjs
# Ctrl+C kalau sudah oke
```

### Step 4 — PM2 Process Manager

```bash
npm install -g pm2

# Jalankan
pm2 start .output/server/index.mjs --name undercover

# Auto-start setelah reboot
pm2 startup
pm2 save
```

### Step 5 — Nginx Reverse Proxy

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/undercover
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # SSE: wajib disable buffering dan set timeout panjang
    # Timer giliran 90 detik, jaga koneksi tetap hidup
    location /api/events/ {
        proxy_pass              http://localhost:3000;
        proxy_http_version      1.1;
        proxy_set_header        Connection '';
        proxy_set_header        Cache-Control 'no-cache';
        proxy_set_header        X-Accel-Buffering 'no';
        proxy_buffering         off;
        proxy_read_timeout      3600s;
        chunked_transfer_encoding on;
    }

    location / {
        proxy_pass              http://localhost:3000;
        proxy_http_version      1.1;
        proxy_set_header        Upgrade $http_upgrade;
        proxy_set_header        Connection 'upgrade';
        proxy_set_header        Host $host;
        proxy_set_header        X-Real-IP $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header        X-Forwarded-Proto $scheme;
        proxy_cache_bypass      $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/undercover /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6 — SSL dengan Certbot (opsional tapi direkomendasikan)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 2. Railway

Railway adalah platform cloud yang otomatis detect Nuxt dan deploy dengan mudah.

### Step 1 — Persiapan

Pastikan `package.json` punya script `start`:

```json
{
  "scripts": {
    "start": "node .output/server/index.mjs",
    "build": "nuxt build",
    "dev": "nuxt dev"
  }
}
```

### Step 2 — Deploy

1. Buat akun di [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Connect repo kamu
4. Railway otomatis detect Nuxt dan build

### Step 3 — Tambah MySQL

Di Railway dashboard:
1. **+ New** → **Database** → **MySQL**
2. Tunggu MySQL provisioned
3. Klik MySQL service → tab **Variables** → copy connection details

### Step 4 — Set Environment Variables

Di Railway app service → tab **Variables**:

```
DB_HOST      = <dari MySQL service - MYSQL_HOST>
DB_PORT      = <dari MySQL service - MYSQL_PORT>
DB_USER      = <dari MySQL service - MYSQL_USER>
DB_PASSWORD  = <dari MySQL service - MYSQL_PASSWORD>
DB_NAME      = <dari MySQL service - MYSQL_DATABASE>
NODE_ENV     = production
```

> Gunakan fitur **Reference Variable** Railway untuk otomatis link ke MySQL service.

### Step 5 — Generate Domain

Di Railway app service → tab **Settings** → **Generate Domain**

App akan tersedia di `https://xxx.railway.app`

> **Catatan SSE:** Railway mendukung SSE secara native. Tidak perlu konfigurasi tambahan — timer giliran 90 detik akan berjalan normal.

---

## 3. Docker Compose

### `Dockerfile`

Buat file `Dockerfile` di root project:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.output ./.output
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", ".output/server/index.mjs"]
```

### `docker-compose.yml`

Buat file `docker-compose.yml` di root project:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DB_HOST: db
      DB_PORT: 3306
      DB_USER: undercover
      DB_PASSWORD: secret123
      DB_NAME: undercover_game
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootsecret
      MYSQL_DATABASE: undercover_game
      MYSQL_USER: undercover
      MYSQL_PASSWORD: secret123
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uundercover", "-psecret123"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mysql_data:
```

### `nginx.conf` (untuk Docker)

```nginx
server {
    listen 80;

    # SSE: wajib disable buffering
    location /api/events/ {
        proxy_pass              http://app:3000;
        proxy_http_version      1.1;
        proxy_set_header        Connection '';
        proxy_set_header        Cache-Control 'no-cache';
        proxy_buffering         off;
        proxy_read_timeout      3600s;
        chunked_transfer_encoding on;
    }

    location / {
        proxy_pass              http://app:3000;
        proxy_http_version      1.1;
        proxy_set_header        Host $host;
        proxy_set_header        X-Real-IP $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Jalankan

```bash
# Build & start semua services
docker compose up -d

# Lihat logs
docker compose logs -f app

# Stop
docker compose down

# Stop + hapus data DB
docker compose down -v
```

---

## 4. PM2 (Bare Metal)

Cara paling simpel untuk server yang sudah ada Node.js & MySQL.

```bash
# Install PM2 global
npm install -g pm2

# Build app
npm run build

# Buat PM2 ecosystem file
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'undercover',
    script: '.output/server/index.mjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_USER: 'undercover',
      DB_PASSWORD: 'GANTI_INI',
      DB_NAME: 'undercover_game'
    }
  }]
}
EOF

# Jalankan
pm2 start ecosystem.config.cjs

# Monitor
pm2 monit

# Lihat logs
pm2 logs undercover

# Restart
pm2 restart undercover

# Auto-start saat reboot
pm2 startup
pm2 save
```

> **Catatan:** Game menggunakan SSE dengan timer giliran 90 detik per pemain. Jalankan dengan `instances: 1` — jangan lebih, karena SSE clients disimpan in-memory per proses.

---

## Update / Redeploy

### VPS / Bare Metal

```bash
cd /var/www/undercover

# Pull latest code
git pull origin main

# Install deps jika ada perubahan
npm install

# Build ulang
npm run build

# Restart (tabel DB diupdate otomatis via migrate.ts)
pm2 restart undercover
```

### Docker Compose

```bash
git pull origin main

# Rebuild image
docker compose build app

# Restart service
docker compose up -d --no-deps app
```

---

## Environment Variables Lengkap

| Variable | Default | Wajib | Keterangan |
|----------|---------|-------|------------|
| `DB_HOST` | `localhost` | ✅ | Hostname MySQL |
| `DB_PORT` | `3306` | | Port MySQL |
| `DB_USER` | `root` | ✅ | Username MySQL |
| `DB_PASSWORD` | _(kosong)_ | ✅ | Password MySQL |
| `DB_NAME` | `undercover_game` | ✅ | Nama database |
| `PORT` | `3000` | | Port server (Nuxt auto-detect) |
| `HOST` | `0.0.0.0` | | Bind address |
| `NODE_ENV` | `development` | | Set `production` saat deploy |

---

## Troubleshooting

### App tidak bisa connect ke MySQL

```bash
# Cek MySQL berjalan
sudo systemctl status mysql

# Test koneksi manual
mysql -u undercover -p -h localhost undercover_game

# Cek error logs
pm2 logs undercover --err
```

### SSE tidak terima event / timer tidak jalan

SSE adalah pondasi real-time game (termasuk timer giliran). Pastikan Nginx dikonfigurasi dengan benar:

- `proxy_buffering off` — **wajib**, tanpa ini event tidak terkirim real-time
- `proxy_read_timeout 3600s` — agar koneksi tidak putus di tengah game
- `Connection ''` (string kosong) — untuk SSE, **bukan** `upgrade` (itu WebSocket)
- `X-Accel-Buffering 'no'` — matikan buffering di level Nginx

```bash
# Test SSE langsung (tanpa browser)
curl -N http://localhost:3000/api/events/ROOMID
# Harus langsung stream, tidak menunggu
```

### Timer giliran tidak sinkron antar pemain

Timer berjalan di sisi client masing-masing dan di-reset saat event `clue_submitted` / `next_round` diterima via SSE. Jika timer tidak sinkron:

1. Pastikan SSE terhubung (indikator koneksi di header game)
2. Cek apakah SSE terputus dan reconnect — timer akan reset saat giliran berubah
3. Jika koneksi SSE sering putus, periksa `proxy_read_timeout` di Nginx

### Port 3000 sudah dipakai

```bash
# Jalankan di port berbeda
PORT=4000 node .output/server/index.mjs
```

### Database tabel tidak terbuat

Tabel dibuat otomatis via `server/plugins/migrate.ts` saat server start. Jika gagal:

```bash
# Lihat log migrasi
pm2 logs undercover | grep -i migrat

# Manual: pastikan user punya privilege
mysql -u root -p -e "GRANT ALL ON undercover_game.* TO 'undercover'@'localhost';"
```

### Build gagal (Out of Memory)

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Multi-instance / Load Balancer

Game **tidak mendukung** multi-instance karena SSE clients disimpan in-memory. Jika butuh HA:
- Gunakan Redis Pub/Sub untuk menggantikan in-memory SSE map
- Atau tetap pakai 1 instance dengan PM2 cluster disabled (`instances: 1`)

---

## Rekomendasi Produksi

- Gunakan **SSL/HTTPS** (Certbot gratis) — browser modern blokir mixed content
- Buat **dedicated MySQL user** (jangan pakai root)
- Set `NODE_ENV=production` untuk performa optimal
- Jalankan dengan **1 instance** — SSE in-memory tidak kompatibel dengan multi-instance
- Backup database rutin: `mysqldump undercover_game > backup_$(date +%Y%m%d).sql`
- Monitor dengan `pm2 monit` atau Grafana + Prometheus
- Aktifkan **MySQL slow query log** untuk debugging performa
