#!/usr/bin/env bash
# setup.sh - Script tự động cài đặt & cấu hình Canh Gác Website trên Vibe Host / Linux VPS
set -e

echo "=========================================================="
echo "🛡️  TỰ ĐỘNG CÀI ĐẶT & KHỞI CHẠY CANH GÁC WEBSITE (VIBE HOST)"
echo "=========================================================="

# 1. Kiểm tra môi trường Node.js & npm
if ! command -v node &> /dev/null; then
    echo "❌ Lỗi: Chưa tìm thấy Node.js!"
    echo "👉 Vui lòng kích hoạt Node.js (phiên bản 18+ hoặc 20+) trong mục 'Setup Node.js App' của Vibe Host."
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo "✅ npm:     $(npm -v)"

# 2. Cấu hình tự động file .env
if [ ! -f .env ]; then
    echo "📝 Đang tự động cấu hình file .env từ .env.example..."
    cp .env.example .env
    RANDOM_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32 ; echo '')
    sed -i "s/super-secret-jwt-key-canh-gac-website-2026-production-ready/$RANDOM_SECRET/g" .env 2>/dev/null || true
    sed -i "s/canh-gac-website-production-secret-2026/$RANDOM_SECRET/g" .env 2>/dev/null || true
    echo "✅ Đã tạo file .env với mã AUTH_SECRET bảo mật."
fi

# 3. Cài đặt các gói npm
echo "📦 Đang cài đặt thư viện cần thiết (npm install)..."
npm install --include=dev

# 4. Tạo thư mục dữ liệu và đồng bộ Prisma DB
echo "🗄️ Đang khởi tạo cơ sở dữ liệu SQLite..."
mkdir -p prisma
npx prisma generate
npx prisma db push --skip-generate

# 5. Build Next.js Production
echo "🏗️ Đang biên dịch ứng dụng Next.js (npm run build)..."
npm run build

echo "=========================================================="
echo "🎉 CÀI ĐẶT VÀ CẤU HÌNH HOÀN TẤT 100%!"
echo "👉 Ứng dụng sẵn sàng hoạt động:"
echo "   - Cách 1 (Khuyên dùng): node server.js"
echo "   - Cách 2: npm run start"
echo "   - Cách 3 (Nếu dùng PM2): pm2 start ecosystem.config.js"
echo "=========================================================="
