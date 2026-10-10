import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Khởi tạo dữ liệu hệ thống Canh Gác Website (Clean State)...");

  // 1. Tạo tài khoản quản trị viên chuẩn (Tuân thủ Điều 1 & Điều 6: "Nguyễn Văn A")
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Admin@123456", salt);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@canhgacwebsite.vn" },
    update: {
      name: "Nguyễn Văn A",
      passwordHash,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    },
    create: {
      email: "admin@canhgacwebsite.vn",
      name: "Nguyễn Văn A",
      passwordHash,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    },
  });

  console.log(`👤 Tài khoản quản trị: ${adminUser.email} (Tên: ${adminUser.name})`);

  // 2. User Settings mặc định
  await prisma.userSettings.upsert({
    where: { userId: adminUser.id },
    update: {
      telegramEnabled: false,
      alertDown: true,
      alertRecovery: true,
      sslWarningDays: 15,
      slowResponseEnabled: true,
      slowResponseThreshold: 2000,
      defaultCheckInterval: 300,
      retryThreshold: 2,
    },
    create: {
      userId: adminUser.id,
      telegramEnabled: false,
      alertDown: true,
      alertRecovery: true,
      sslWarningDays: 15,
      slowResponseEnabled: true,
      slowResponseThreshold: 2000,
      defaultCheckInterval: 300,
      retryThreshold: 2,
    },
  });

  // 3. Worker Heartbeat
  await prisma.workerHeartbeat.upsert({
    where: { id: "primary-worker" },
    update: {
      lastHeartbeatAt: new Date(),
      workerStatus: "RUNNING",
      activeJobs: 0,
      queueDepth: 0,
    },
    create: {
      id: "primary-worker",
      lastHeartbeatAt: new Date(),
      workerStatus: "RUNNING",
      activeJobs: 0,
      queueDepth: 0,
    },
  });

  // 4. Xóa sạch mọi website, logs, incident cũ (Tuân thủ Điều 1: Tuyệt đối không lưu dữ liệu khách hàng thật)
  await prisma.checkLog.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.notificationHistory.deleteMany({});
  await prisma.securityScan.deleteMany({});
  await prisma.alertConfig.deleteMany({});
  await prisma.website.deleteMany({});

  console.log("✨ Khởi tạo hoàn tất: Cơ sở dữ liệu sạch, sẵn sàng tiếp nhận đăng ký tài khoản mới!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khởi tạo:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
