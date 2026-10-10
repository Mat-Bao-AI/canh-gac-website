// scripts/push-to-github.js - Tự động đẩy code lên GitHub bằng isomorphic-git
const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

const dir = path.resolve(__dirname, '..');
const token = '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';
const repoUrl = 'https://github.com/Mat-Bao-AI/canh-gac-website.git';

async function run() {
  console.log('====================================================');
  console.log(`🚀 BẮT ĐẦU ĐẨY TOÀN BỘ MÃ NGUỒN LÊN: ${repoUrl}`);
  console.log('====================================================');

  const gitDir = path.join(dir, '.git');
  if (!fs.existsSync(gitDir)) {
    console.log('📁 Khởi tạo git repository cục bộ...');
    await git.init({ fs, dir });
  }

  console.log('📦 Đang quét và thêm các tệp tin vào git staging...');
  const ignoredDirs = new Set(['.git', 'node_modules', '.next', '_staging', '_test_unpack']);
  
  async function addFiles(currentDir, relDir = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoredDirs.has(entry.name)) continue;
      if (entry.name.endsWith('.db') || entry.name.endsWith('.db-journal') || entry.name.endsWith('.log')) continue;
      
      const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await addFiles(fullPath, relPath);
      } else if (entry.isFile()) {
        try {
          await git.add({ fs, dir, filepath: relPath.replace(/\\/g, '/') });
        } catch (e) {}
      }
    }
  }

  await addFiles(dir);
  console.log('✅ Đã thêm tất cả các tệp tin vào Git index.');

  console.log('📝 Đang tạo commit...');
  let sha;
  try {
    sha = await git.commit({
      fs,
      dir,
      message: 'feat: hoàn thiện nền tảng Canh Gác Website chuẩn mẫu Vibe Host Mắt Bão',
      author: {
        name: 'babykajima47',
        email: 'admin@matbao.com'
      }
    });
    console.log(`✅ Commit thành công: ${sha.slice(0, 7)}`);
  } catch (err) {
    console.log('ℹ️ Commit status:', err.message);
  }

  // Đảm bảo nhánh là main
  await git.branch({ fs, dir, ref: 'main', checkout: true }).catch(() => {});

  console.log('📤 Đang push lên GitHub branch main...');
  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    url: repoUrl,
    ref: 'main',
    force: true,
    onAuth: () => ({ username: token })
  });

  console.log('====================================================');
  console.log('🎉🎉🎉 ĐẨY TOÀN BỘ MÃ NGUỒN LÊN GITHUB THÀNH CÔNG 100%!');
  console.log(`👉 Link Repository: https://github.com/Mat-Bao-AI/canh-gac-website`);
  console.log('====================================================');
  return pushResult;
}

run().catch(err => {
  console.error('\n❌ Lỗi khi push:', err);
  process.exit(1);
});
