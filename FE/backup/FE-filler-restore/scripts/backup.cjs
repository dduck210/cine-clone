const fs = require('fs').promises;
const path = require('path');

async function copyRecursive(src, dest) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src);
    for (const entry of entries) {
      if (['backup', 'node_modules', '.git', '.vite'].includes(entry)) continue;
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      await copyRecursive(srcPath, destPath);
    }
  } else {
    await fs.copyFile(src, dest);
  }
}

(async () => {
  try {
    const feRoot = path.resolve(__dirname, '..');
    const dest = path.join(feRoot, 'backup', 'FE-filler-restore');
    console.log('Backing up', feRoot, '→', dest);
    await copyRecursive(feRoot, dest);
    console.log('Backup complete:', dest);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exitCode = 1;
  }
})();
