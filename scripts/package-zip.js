// scripts/package-zip.js - Tạo file ZIP chuẩn POSIX cho Vibe Host / Wings / Linux
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outputFile = path.join(rootDir, 'canhgac-website.zip');

async function run() {
  const { ZipArchive } = await import('archiver');

  console.log('====================================================');
  console.log('📦 BẮT ĐẦU ĐÓNG GÓI CANH GÁC WEBSITE (CHUẨN VIBE HOST / WINGS)');
  console.log('====================================================');

  // Xóa file zip cũ nếu có
  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }

  const output = fs.createWriteStream(outputFile);
  const archive = new ZipArchive({
    zlib: { level: 9 },
    forceLocalTime: true
  });

  const completionPromise = new Promise((resolve, reject) => {
    output.on('close', () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ Đã đóng gói thành công: ${outputFile}`);
      console.log(`📊 Dung lượng file: ${sizeMB} MB (${archive.pointer()} bytes)`);
      resolve();
    });
    archive.on('error', reject);
    archive.on('warning', (err) => {
      if (err.code !== 'ENOENT') reject(err);
    });
  });

  archive.pipe(output);

  // Danh sách các file đơn lẻ ở root
  const filesToInclude = [
    'Dockerfile',
    'docker-compose.yml',
    'docker-entrypoint.sh',
    'server.js',
    'setup.sh',
    'ecosystem.config.js',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'tailwind.config.ts',
    'postcss.config.js',
    'next-env.d.ts',
    '.env.example',
    '.dockerignore',
    'README.md',
    'HUONG_DAN_CAI_DAT_VIBE_HOST.md',
    'vibehost-template.json'
  ];

  const directoriesToInclude = [
    'src',
    'public',
    'scripts',
    'tests'
  ];

  let addedFilesCount = 0;
  const addedPaths = new Set();

  function safeAddFile(filePath, entryName) {
    const posixPath = entryName.replace(/\\/g, '/');
    if (addedPaths.has(posixPath)) {
      console.warn(`[Cảnh báo trùng lặp] Bỏ qua file: ${posixPath}`);
      return;
    }
    addedPaths.add(posixPath);
    archive.file(filePath, { name: posixPath });
    addedFilesCount++;
  }

  // Hàm duyệt đệ quy chỉ lấy FILE, bỏ qua thư mục rỗng để triệt tiêu lỗi duplicate entries trên Wings/Go
  function addDirectoryFiles(dirRelPath) {
    const fullDirPath = path.join(rootDir, dirRelPath);
    if (!fs.existsSync(fullDirPath)) return;

    function traverse(currentDir, relativePrefix) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          // KHÔNG thêm entry thư mục vào ZIP! Chỉ duyệt file con
          traverse(fullPath, relPath);
        } else if (entry.isFile()) {
          // Bỏ qua các file database cục bộ hoặc log
          if (entry.name.endsWith('.db') || entry.name.endsWith('.db-journal') || entry.name.endsWith('.log')) {
            continue;
          }
          safeAddFile(fullPath, relPath);
        }
      }
    }

    traverse(fullDirPath, dirRelPath);
  }

  // 1. Thêm các thư mục
  for (const dir of directoriesToInclude) {
    addDirectoryFiles(dir);
  }

  // 2. Thêm thư mục prisma (chỉ lấy schema.prisma và seed.ts)
  const prismaSchema = path.join(rootDir, 'prisma', 'schema.prisma');
  if (fs.existsSync(prismaSchema)) {
    safeAddFile(prismaSchema, 'prisma/schema.prisma');
  }
  const prismaSeed = path.join(rootDir, 'prisma', 'seed.ts');
  if (fs.existsSync(prismaSeed)) {
    safeAddFile(prismaSeed, 'prisma/seed.ts');
  }

  // 3. Thêm các file đơn lẻ ở thư mục gốc
  for (const file of filesToInclude) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      safeAddFile(fullPath, file);
    }
  }

  console.log(`📁 Đang nén tổng cộng ${addedFilesCount} tệp tin chuẩn POSIX...`);
  await archive.finalize();
  await completionPromise;

  console.log('🚀 File ZIP đã sẵn sàng upload lên Vibe Host mà không gặp lỗi duplicate entries!');
}

run().catch((err) => {
  console.error('Lỗi đóng gói:', err);
  process.exit(1);
});
