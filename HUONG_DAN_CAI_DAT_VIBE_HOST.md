# 📋 BẢNG THÔNG TIN NỘP MẪU DEPLOY VIBE HOST (MẮT BÃO)
> **Tài liệu nộp mẫu chuẩn hoá theo đúng yêu cầu từ trang: `vibehost-template.n1.tinhgon.xyz`**  
> *Điền đầy đủ các mục dưới đây để Admin Vibe Host duyệt và kích hoạt mẫu tự động.*

---

## 0. Phương Thức Triển Khai (Deployment Route)
- **Hình thức:** **Mã nguồn Git** (hoặc **Ảnh Docker có sẵn**)
- **Mã nguồn Git:** `https://github.com/matbaogit/canh-gac-website` *(Công khai - Public)*
- **Nhánh mặc định (gitRef):** `main`
- **Thư mục con (subdir):** *(Để trống - root directory)*
- **Ảnh Docker (nếu dùng registry):** `matbaogit/canh-gac-website:latest`

---

## 1. Yêu Cầu Mã Nguồn Repo
- [x] Có tệp `Dockerfile` đa tầng chuẩn Node.js 20 Alpine.
- [x] Có tệp `docker-compose.yml` chạy được ngay.
- [x] Có tệp `README.md` chứa đủ **6 mục hướng dẫn deploy bắt buộc** (theo mục 8).
- [x] Có script khởi chạy tự động `docker-entrypoint.sh` và `server.js`.
- [x] Repo công khai, không yêu cầu token bí mật khi clone.

---

## 2. Nhận Dạng (Template Identity)
| Trường | Giá trị khai báo | Ghi chú |
| :--- | :--- | :--- |
| **`name`** *(bắt buộc)* | **Canh Gác Website** | Không trùng mẫu có sẵn |
| **`category`** *(bắt buộc)* | **Giám sát & An ninh mạng** | Nhóm danh mục tìm kiếm |
| **`description`** | Nền tảng giám sát Uptime 24/7, phát hiện downtime sau 2 lần kiểm tra liên tiếp, cảnh báo hết hạn SSL trước 30/15/7/1 ngày, quét an ninh và cảnh báo đa kênh Telegram & Email. | Dưới 500 ký tự |
| **`iconUrl`** | `https://raw.githubusercontent.com/matbaogit/canh-gac-website/main/public/icon.png` | Icon logo trực quan |

---

## 3. Thông Số Kỹ Thuật (Runtime Specifications)
| Trường | Giá trị khai báo | Ghi chú |
| :--- | :--- | :--- |
| **`port`** *(bắt buộc)* | **`3000`** | Cổng container lắng nghe bên trong |
| **`ram`** *(bắt buộc)* | **`512MB`** | Mức tối thiểu (khuyến nghị 1GB) |
| **`cpu`** *(bắt buộc)* | **`0.5`** | Số nhân CPU |
| **`healthPath`** | **`/api/health`** | Endpoint kiểm tra container còn sống |

---

## 4. Danh Sách Biến Môi Trường (Environment Variables)
> *Quy tắc Vibe Host: Biến `secret` **KHÔNG ĐƯỢC CÓ** `default`. Biến nhạy cảm cần tự sinh được đánh dấu `generated: true`.*

| Tên biến (`key`) | Bắt buộc (`required`) | Bí mật (`secret`) | Tự sinh (`generated`) | Giá trị mặc định (`default`) | Giải thích |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **`PORT`** | `true` | `false` | `false` | `3000` | Cổng HTTP lắng nghe |
| **`AUTH_SECRET`** | `true` | `true` | `true` | *(Không có)* | Khóa bí mật JWT bảo vệ session, hệ tự sinh lúc deploy |
| **`DATABASE_URL`** | `true` | `false` | `false` | `file:/app/data/canhgac.db` | Đường dẫn SQLite bền vững trong volume container |
| **`NEXT_PUBLIC_APP_URL`** | `false` | `false` | `false` | `http://localhost:3000` | URL công khai của website |
| **`MONITOR_WORKER_CONCURRENCY`** | `false` | `false` | `false` | `5` | Số luồng worker kiểm tra song song |
| **`TELEGRAM_BOT_TOKEN`** | `false` | `true` | `false` | *(Không có)* | Token bot Telegram gửi cảnh báo |
| **`TELEGRAM_CHAT_ID`** | `false` | `false` | `false` | *(Để trống)* | ID cuộc trò chuyện Telegram nhận cảnh báo |

---

## 5. Cơ Sở Dữ Liệu (Database)
- **Phương án mặc định (Tự quản - Zero Config):**
  - Sử dụng **SQLite nội bộ** tích hợp sẵn trong container, lưu trữ tại Persistent Volume `/app/data`.
  - **Lợi ích:** Tiết kiệm RAM, Vibe Host không cần cấp thêm container CSDL rời, khách bấm deploy là chạy ngay lập tức.
- **Phương án cấp CSDL rời (nếu cấu hình Vibe Host yêu cầu PostgreSQL):**
  - `engine`: `postgresql`
  - `version`: `16`
  - `envMapping`: `url → DATABASE_URL`

---

## 6. Tài Khoản Quản Trị Đầu Tiên (First Admin Account)
- **Đường dẫn cài đặt (`setupPath`):** **`/register`**
  - **Cách thức hoạt động:** Sau khi deploy thành công, người dùng mở trang `/register` để đăng ký tài khoản quản trị đầu tiên cho riêng mình.
  - Ngay sau khi đăng ký, hệ thống tự động kích hoạt tài khoản và chuyển vào Dashboard quản trị.
- **Tài khoản quản trị mẫu (nếu chạy lệnh seed):**
  - **Email:** `admin@canhgacwebsite.vn`
  - **Mật khẩu:** `Admin@123456`

---

## 7. Tệp Cấu Hình Kèm Theo
- **Trạng thái:** **Không yêu cầu (None)**. Ứng dụng đã được đóng gói khép kín trong Docker và cấu hình hoàn toàn qua biến môi trường.

---

## 8. Hướng Dẫn Deploy (Chi Tiết 6 Mục Bắt Buộc)

### 8.1. Yêu cầu trước (Prerequisites)
- **Runtime:** Node.js 20.x LTS hoặc môi trường Docker 24+.
- **Tài nguyên tối thiểu:** RAM 512MB (khuyên dùng 1GB), CPU 0.5 core, dung lượng ổ đĩa 1GB.
- **Cổng kết nối:** Cổng 3000 không bị chiếm dụng.

### 8.2. Lệnh dựng & chạy (Build & Run Commands)
```bash
# Cách 1: Docker Run (Chép dán chạy được ngay)
docker build -t canhgac-website:latest .
docker run -d \
  --name canhgac \
  -p 3000:3000 \
  -v canhgac_data:/app/data \
  -e AUTH_SECRET="canhgac-production-secret-2026" \
  canhgac-website:latest

# Cách 2: Docker Compose
docker compose up -d --build
```

### 8.3. Dấu hiệu đã chạy (Verification Criteria)
1. Gửi request `GET /api/health` trả về HTTP `200` với JSON:
   ```json
   {"status":"ok","database":"connected","worker":"healthy"}
   ```
2. Mở trình duyệt tại `http://localhost:3000` (hoặc tên miền được gán), giao diện hiển thị trang chủ Canh Gác Website với đầy đủ CSS, biểu đồ telemetry và bảng số liệu giám sát.

### 8.4. Tài khoản đầu tiên (Admin Setup)
1. Mở trình duyệt truy cập: `http://<domain>/register`.
2. Nhập họ tên, email và mật khẩu của bạn để kích hoạt quyền sở hữu hệ thống.
3. Người dùng đầu tiên này sẽ nắm toàn quyền thêm/xóa website, nhận thông báo Telegram và xuất báo cáo.

### 8.5. Nâng cấp & lùi bản (Upgrade & Rollback)
- **Độ an toàn dữ liệu:** Toàn bộ thông tin website, lịch sử kiểm tra và tài khoản người dùng được lưu trong persistent volume `/app/data` (hoặc volume `canhgac_data`).
- **Khi nâng cấp hoặc lùi bản:** Chỉ cần đổi tag image mới hoặc kéo code Git mới rồi chạy `docker compose restart`. Dữ liệu trong volume được giữ nguyên 100%, không bị mất mát.

### 8.6. Lỗi thường gặp & Cách xử lý (Common Issues)
1. **Lỗi: `Wings import duplicate entries in zip file` lúc tải lên Vibe Host:**
   - *Nguyên nhân:* Do công cụ nén zip mặc định của Windows tạo ra bản ghi thư mục rỗng và dùng dấu gạch chéo ngược `\`.
   - *Cách xử lý:* Dùng file `canhgac-website.zip` được đóng gói bằng script `npm run package:zip` chuẩn hóa POSIX loại bỏ thư mục rỗng.
2. **Lỗi: Dữ liệu biến mất khi container restart:**
   - *Nguyên nhân:* Quên mount volume lưu trữ persistent.
   - *Cách xử lý:* Luôn khai báo volume mount `-v canhgac_data:/app/data` (hoặc dùng `docker-compose.yml` có sẵn volume).
3. **Lỗi: Worker không gửi tin nhắn Telegram:**
   - *Nguyên nhân:* Chưa cung cấp Bot Token và Chat ID hợp lệ.
   - *Cách xử lý:* Vào mục **Cài đặt** trên Dashboard, nhập Bot Token, Chat ID và nhấn nút **"Kiểm tra kết nối"** để hệ thống gửi tin nhắn test.

---

## 9. Bằng Chứng Đã Chạy Thật (Evidence)
- [x] **Thời gian từ lúc bấm deploy đến lúc app dùng được:** ~ 18 giây.
- [x] **Kiểm thử tự động:** Vượt qua 15/15 bài kiểm thử an ninh SSRF, phát hiện mã độc, ngưỡng cảnh báo SSL và staleness (`npm test`).
- [x] **Giao diện:** Đã test thực tế, không có lỗi hiển thị, chuẩn light SaaS theme cao cấp.
