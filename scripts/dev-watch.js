import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('👀 Starting TimeFocuser Extension Dev Watcher (Target: Chrome)...\n');

const runRebuild = () => {
  const start = Date.now();
  try {
    execSync('node scripts/build-targets.js chrome', { stdio: 'inherit' });
    console.log(`\n⚡ Rebuilt dist/chrome in ${Date.now() - start}ms! Ready in Chrome.\n`);
  } catch (err) {
    console.error('❌ Build error during watch:', err.message);
  }
};

// Initial build
runRebuild();

console.log('📂 Watching src/, manifests/, and public/ for changes...');

let debounceTimer = null;
const watchDirs = ['src', 'manifests', 'public'];

watchDirs.forEach((dir) => {
  const dirPath = path.resolve(dir);
  if (fs.existsSync(dirPath)) {
    fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
      if (!filename || filename.endsWith('~') || filename.startsWith('.')) return;

      console.log(`🔄 Change detected in ${dir}/${filename} (${eventType})`);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        runRebuild();
      }, 200);
    });
  }
});
