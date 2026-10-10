// server.js - Production Server Tự Động Hóa cho Vibe Host / cPanel / Linux / Docker
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('====================================================');
console.log('🛡️  KHỞI ĐỘNG HỆ THỐNG CANH GÁC WEBSITE (VIBE HOST)');
console.log('====================================================');

// 1. Tự động cấu hình file .env nếu chưa có
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('[Auto-Config] File .env chưa tồn tại. Đang tự động tạo từ .env.example...');
  let envContent = '';
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  } else {
    envContent = `DATABASE_URL="file:./prisma/dev.db"\nAUTH_SECRET="auto-generated-secret"\nPORT=3000\n`;
  }
  const secret = crypto.randomBytes(32).toString('hex');
  envContent = envContent.replace(/canh-gac-website-production-secret-2026/g, secret);
  envContent = envContent.replace(/super-secret-jwt-key-canh-gac-website-2026-production-ready/g, secret);
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('[Auto-Config] Đã tạo .env thành công với AUTH_SECRET ngẫu nhiên bảo mật.');
}

// Đảm bảo thư mục lưu trữ data SQLite tồn tại
const prismaDir = path.join(__dirname, 'prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

// 2. Tự động kiểm tra và sync schema database SQLite
try {
  console.log('[Auto-Config] Đồng bộ cấu trúc dữ liệu Prisma Database...');
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: process.env
  });
  console.log('[Auto-Config] Prisma Database đã sẵn sàng.');
} catch (err) {
  console.warn('[Auto-Config] Lưu ý về Prisma Sync:', err.message);
}

// 3. Tự động khởi chạy Background Monitoring Worker song song
console.log('[Auto-Config] Đang kích hoạt Monitoring Worker chạy ngầm...');
try {
  const workerProcess = spawn('npx', ['tsx', path.join('src', 'worker', 'index.ts')], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'production' }
  });

  workerProcess.on('error', (err) => {
    console.error('[Worker Error]', err.message);
  });

  workerProcess.on('exit', (code) => {
    console.log(`[Worker] Tiến trình worker đã dừng với mã ${code}`);
  });

  const cleanup = () => {
    console.log('[Server] Đang tắt các tiến trình liên quan...');
    try {
      workerProcess.kill();
    } catch (_) {}
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
} catch (e) {
  console.warn('[Worker Launch Warning]', e.message);
}

// 4. Khởi chạy Next.js Application Server
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('[HTTP Error]', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    })
      .once('error', (err) => {
        console.error('[Server Error]', err);
        process.exit(1);
      })
      .listen(port, hostname, () => {
        console.log(`🚀 Web Server đang hoạt động tại: http://${hostname}:${port}`);
      });
  })
  .catch((err) => {
    console.error('[Next.js Prepare Error]', err);
    process.exit(1);
  });
