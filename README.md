# 🛡️ CANH GÁC WEBSITE
### Nền tảng Giám sát Website Uptime, SSL & An ninh 24/7 (Vibe Host Free Template)

> **"Template mã nguồn mở 100% miễn phí tối ưu cho Vibe Host — không thu phí, không giới hạn tính năng."**

Canh Gác Website là nền tảng giúp cá nhân, Web Agency và kỹ thuật viên quản lý hàng chục website trên một dashboard duy nhất khi triển khai trên Vibe Host. Thay vì phải kiểm tra thủ công 10–30 website mỗi ngày, hệ thống tự động:
- 🟢 Giám sát Uptime & HTTP status liên tục 24/7 (đo latency, phát hiện phản hồi chậm).
- 🔒 Kiểm tra chứng chỉ TLS/SSL thật, cảnh báo trước khi hết hạn 30, 15, 7, 1 ngày.
- 🔍 Phát hiện dấu hiệu bất thường (thay đổi title, meta description, mã độc, link ẩn cờ bạc casino/betting).
- 🚨 Gửi cảnh báo tức thì kèm mã sự cố qua **Telegram Bot API** và **Email**.
- ✨ Tự động nhận diện khi website phục hồi và ghi nhận thời gian downtime chính xác.
- 🛡️ Tích hợp bộ lọc an ninh **chống tấn công SSRF** và phân giải DNS nghiêm ngặt.

---

## 1. 🏗️ Kiến Trúc Hệ Thống (Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 14 App Router UI                  │
│       (Dashboard, Website List, Incidents, Alerts, Reports) │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API
┌──────────────────────────────▼──────────────────────────────┐
│                  Next.js REST API Layer                     │
│    (SSRF Validator, Auth JWT/Bcrypt, Live Check, Settings)  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     Database (Prisma ORM)   ││    Background Monitoring     │
│   (SQLite / PostgreSQL)     ││          Worker Engine       │
│  - Users & Settings         ││  - Periodic Job Scheduler    │
│  - Websites (28 preloaded)  ││  - Concurrency Pool (Limit 5)│
│  - Check Logs               ││  - False Positive Protection │
│  - Incidents & Timeline     ││  - Recovery Detector         │
│  - Notification History     ││  - Real TLS/SSL Inspector    │
│  - Security Scans           ││  - HTML Anomaly Analyzer     │
└─────────────────────────────┘└──────────────┬───────────────┘
                                              │
                      ┌───────────────────────▼───────────────┐
                      │          Alert Notification           │
                      │  - Telegram Bot API (Formatted HTML)  │
                      │  - SMTP Email Service                 │
                      └───────────────────────────────────────┘
```

---

## 2. ⚡ Cài Đặt Nhanh (Quickstart)

### Yêu cầu môi trường:
- **Node.js**: Phiên bản 18+ (khuyến nghị 20 LTS)
- **npm** hoặc **pnpm** / **yarn**

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Khởi tạo Database & Prisma
```bash
npx prisma db push
```

### Bước 3: Khởi tạo Cơ sở dữ liệu
```bash
npm run db:push
```
> Hệ thống sẵn sàng cho người dùng mới đăng ký tài khoản tại `/register` hoặc khởi tạo dữ liệu mẫu với lệnh `npm run seed`.

### Bước 4: Chạy Ứng dụng Web
```bash
npm run dev
```
Truy cập: [http://localhost:3000](http://localhost:3000)

### Bước 5: Chạy Background Monitoring Worker (trong terminal riêng)
```bash
npm run worker
```
Worker sẽ tự động quét các website theo chu kỳ kiểm tra thực tế, kết nối HTTP, đo độ trễ DNS/TCP/TLS, kiểm tra SSL và gửi thông báo khi có sự cố.

---

## 3. 👤 Đăng Ký & Tài Khoản Trải Nghiệm

Hệ thống hỗ trợ 2 hình thức:
1. **Đăng ký tài khoản mới:** Truy cập [http://localhost:3000/register](http://localhost:3000/register), nhập họ tên, email và mật khẩu để bắt đầu giám sát website cá nhân của bạn ngay lập tức.
2. **Tài khoản quản trị mặc định (nếu sử dụng seed mẫu):**
   - **Email:** `admin@canhgacwebsite.vn`
   - **Mật khẩu:** `Admin@123456`
   - **Tên:** `Nguyễn Văn A` (Quản trị viên)

---

## 4. 🧪 Kịch Bản Kiểm Thử Tính Năng (Testing Scenarios)

1. **Dashboard Tổng quan:**
   - Xem các chỉ số KPI: Tổng số Website, Trạng thái (Hoạt động, Cảnh báo, Gặp lỗi).
   - Biểu đồ cột lịch sử trạng thái 7 ngày & tỷ lệ uptime.
   - Danh sách website vừa kiểm tra và bảng tin cảnh báo Telegram mới nhất.
   - Tự động làm mới dữ liệu thời gian thực sau mỗi 20 giây.

2. **Kiểm tra Website Down & Incident Timeline:**
   - Theo dõi sự cố đang diễn ra, thời gian bắt đầu, timeline phát hiện và thông báo cảnh báo đã gửi.

3. **Kiểm tra Cảnh báo SSL sắp hết hạn:**
   - Cảnh báo chứng chỉ SSL sắp hết hạn kèm đếm ngược ngày màu hổ phách/đỏ.

4. **Kiểm tra Quét an ninh & Phát hiện mã độc:**
   - Xem kết quả phân tích HTML hash, thẻ meta thay đổi và phát hiện từ khóa nghi vấn.

5. **Thao tác Kiểm tra trực tiếp (Live Check):**
   - Bấm nút **"Kiểm tra ngay"** trên bất kỳ website nào để kích hoạt kiểm tra HTTP và SSL thực tế ngay lập tức.

6. **Báo cáo & Xuất file CSV:**
   - Mở trang **Báo cáo**, xem tỷ lệ uptime trung bình, tổng sự cố và bấm **"Xuất CSV"** để tải file báo cáo thống kê.

7. **Cấu hình Telegram Bot:**
   - Mở trang **Cài đặt** > Nhập Bot Token & Chat ID > Bấm **"Kiểm tra kết nối"** để nhận tin nhắn test qua Telegram.

---

## 5. 🔒 Các Lớp Bảo Mật Được Triển Khai (Security)

1. **SSRF Protection:** Kiểm tra URL trước khi request, chặn toàn bộ dải IP loopback (`127.0.0.0/8`), mạng nội bộ RFC1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), Cloud Metadata (`169.254.169.254`), phân giải DNS chặn DNS rebinding.
2. **False Positive Protection:** Cơ chế thử lại thông minh (Retry threshold 2 lần liên tiếp) trước khi xác nhận sự cố gián đoạn để tránh spam cảnh báo.
3. **Mật khẩu & Phiên đăng nhập:** Mã hóa mật khẩu bằng `bcryptjs` với salt rounds 10; phiên xác thực bảo mật bằng HTTP-only cookie và JWT token.
4. **API Authorization:** Kiểm tra quyền sở hữu (Ownership validation) trên mọi API endpoints; người dùng không thể xem hay chỉnh sửa website của người khác.
5. **Che giấu thông tin nhạy cảm:** Structured logger tự động ẩn (redact) mật khẩu, token bot và secrets trong toàn bộ logs.

---

## 6. 🐳 Triển Khai Với Docker & Vibe Hosting

Dự án được tối ưu hóa toàn diện để đóng gói Docker gọn nhẹ, hỗ trợ chạy cả giao diện Web Next.js và Background Monitoring Worker tự động song song trong một container duy nhất với cơ chế lưu trữ dữ liệu bền vững (Persistent Volume).

### Cách 1: Triển khai nhanh bằng Docker Compose
```bash
docker compose up -d --build
```
Hệ thống sẽ:
1. Tự động build image production đa tầng (multi-stage).
2. Tự động chuẩn bị schema database với Prisma.
3. Khởi chạy song song Web App (cổng 3000) và Monitoring Worker trong nền.
4. Dữ liệu được lưu trữ bền vững tại volume `canhgac-data` (đường dẫn `/app/data` trong container).

### Cách 2: Build & Chạy trực tiếp với Docker
```bash
# 1. Build Docker image
docker build -t canhgac-website:latest .

# 2. Khởi chạy container với volume lưu trữ database
docker run -d \
  --name canhgac-website \
  -p 3000:3000 \
  -v canhgac_data:/app/data \
  -e AUTH_SECRET="canh-gac-website-production-secret-2026" \
  canhgac-website:latest
```

### Cách 3: Triển khai trên Vibe Hosting / Container Cloud
1. **Kết nối Git Repository** hoặc upload mã nguồn lên Vibe Hosting.
2. **Cấu hình Build Type**: Chọn **Dockerfile** (hệ thống sẽ tự nhận diện `Dockerfile` và `docker-entrypoint.sh`).
3. **Cấu hình Cổng (Port)**: Chọn cổng `3000`.
4. **Cấu hình Persistent Volume (Lưu trữ bền vững)**:
   - Mount Volume: `/app/data` (đảm bảo database SQLite không bị mất khi redeploy hoặc restart container).
5. **Biến môi trường (Environment Variables)**:
   - `PORT`: `3000`
   - `AUTH_SECRET`: Một chuỗi khóa bảo mật ngẫu nhiên
   - `DATABASE_URL`: `file:/app/data/canhgac.db` (mặc định đã được cấu hình tự động)
   - `TELEGRAM_BOT_TOKEN`: (Tùy chọn cấu hình thông báo Telegram)
   - `TELEGRAM_CHAT_ID`: (Tùy chọn)
6. **Health Check Endpoint**: `/api/health`

### Health Check Endpoint:
```
GET /api/health
```
Phản hồi:
```json
{
  "status": "ok",
  "database": "connected",
  "worker": "healthy",
  "timestamp": "2026-10-08T01:30:00.000Z"
}
```

---

## 7. 🧪 Chạy Kiểm Thử (Tests)
```bash
npm test
```
Tất cả 15 bài kiểm thử cốt lõi về SSRF filtering, anomaly keyword scanning, retry logic, dynamic staleness và SSL warning calculation đều vượt qua 100%.

---

## 8. 🚀 Hướng Dẫn Deploy (Chuẩn Danh Mục Mẫu Vibe Host)

> *Mục này đáp ứng đầy đủ 6 yêu cầu bắt buộc khi nộp mẫu deploy lên Vibe Host (Mắt Bão).*

### 8.1. Yêu cầu trước
- **Runtime:** Node.js 20.x LTS hoặc môi trường Docker 24+.
- **Tài nguyên tối thiểu:** RAM 512MB (khuyên dùng 1GB khi giám sát nhiều website), CPU 0.5 core.
- **Cổng kết nối:** Cổng 3000 không bị chiếm dụng bên trong container/máy chủ.

### 8.2. Lệnh dựng & chạy (Chép dán chạy được ngay)
```bash
# 1. Build Docker image từ Dockerfile
docker build -t canhgac-website:latest .

# 2. Khởi chạy container kèm volume lưu trữ bền vững
docker run -d \
  --name canhgac \
  -p 3000:3000 \
  -v canhgac_data:/app/data \
  -e AUTH_SECRET="canhgac-production-secret-2026" \
  canhgac-website:latest

# Hoặc khởi chạy bằng Docker Compose:
docker compose up -d --build
```

### 8.3. Dấu hiệu đã chạy
1. Gửi request `GET /api/health` trả về mã HTTP `200` với JSON:
   ```json
   {"status":"ok","database":"connected","worker":"healthy"}
   ```
2. Mở trình duyệt tại `http://localhost:3000` (hoặc tên miền được cấp): Trang chủ và Dashboard tải thành công, hiển thị đầy đủ giao diện Light SaaS, danh sách 28 website mẫu và các khối telemetry.

### 8.4. Tài khoản đầu tiên
- **Đường dẫn kích hoạt:** Truy cập `http://<domain>/register`
- **Thao tác chiếm quyền quản trị:** Người dùng đầu tiên mở trang `/register`, nhập thông tin để tạo tài khoản Admin và lập tức sở hữu hệ thống.
- **Tài khoản mặc định (khi nạp seed):** `admin@canhgacwebsite.vn` / Mật khẩu: `Admin@123456`.

### 8.5. Nâng cấp & lùi bản
- **Bảo toàn dữ liệu:** Toàn bộ cơ sở dữ liệu SQLite, cấu hình website, lịch sử uptime và nhật ký sự cố được lưu trữ an toàn trong persistent volume tại `/app/data`.
- **Thao tác cập nhật:** Khi đổi phiên bản (tag image mới) hoặc rollback về phiên bản trước, chỉ cần chạy lại container và trỏ vào cùng volume `/app/data`. Dữ liệu khách hàng được bảo toàn 100%, không bị mất mát.

### 8.6. Lỗi thường gặp & Cách xử lý
1. **Lỗi: `Wings import: 400 ... duplicate entries in zip file` khi upload mã nguồn:**
   - *Nguyên nhân:* Do nén bằng tiện ích zip mặc định của Windows làm phát sinh bản ghi thư mục rỗng và dùng dấu gạch chéo ngược `\`.
   - *Cách xử:* Sử dụng tệp zip được đóng gói chuẩn POSIX bằng lệnh `npm run package:zip`.
2. **Lỗi: Mất cấu hình website và lịch sử sau khi restart container:**
   - *Nguyên nhân:* Chưa mount volume bền vững cho container.
   - *Cách xử:* Luôn mount volume vào đường dẫn `/app/data` (ví dụ: `-v canhgac_data:/app/data`).
3. **Lỗi: Worker không gửi tin nhắn cảnh báo qua Telegram:**
   - *Nguyên nhân:* Chưa khai báo hoặc điền sai `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`.
   - *Cách xử:* Vào mục **Cài đặt** trên giao diện, điền token, chat ID và nhấn nút **"Kiểm tra kết nối"** để thử nghiệm.

