const fs = require('fs').promises;
const path = require('path');

async function copyRecursive(src, dest) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src);
    for (const entry of entries) {
      // skip backup folder, node_modules, .git
      if (entry === 'backup' || entry === 'node_modules' || entry === '.git') continue;
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
    const beRoot = path.resolve(__dirname, '..');
    const dest = path.join(beRoot, 'backup', 'FE-filler-restore');
    console.log('Backing up', beRoot, '→', dest);
    await copyRecursive(beRoot, dest);
    console.log('Backup complete:', dest);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exitCode = 1;
  }
})();
