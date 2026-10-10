import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log("🧹 Bắt đầu dọn sạch toàn bộ dữ liệu...");

  // Xóa toàn bộ logs, incidents, scans, alerts, websites
  await prisma.checkLog.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.notificationHistory.deleteMany({});
  await prisma.securityScan.deleteMany({});
  await prisma.alertConfig.deleteMany({});
  await prisma.website.deleteMany({});

  console.log("✅ Đã dọn sạch toàn bộ dữ liệu website, logs, sự cố và thông báo!");
}

clearDatabase()
  .catch((e) => {
    console.error("❌ Lỗi dọn dẹp:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
