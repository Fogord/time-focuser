import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TARGETS = ['chrome', 'firefox', 'safari'];
const requestedTarget = process.argv[2] || 'all';

const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

console.log(`\n🚀 Starting build for target: ${requestedTarget.toUpperCase()}`);

// 1. Ensure icons exist
const iconPath = path.resolve('public/icons/icon-128.png');
if (!fs.existsSync(iconPath)) {
  console.log('Generating icons...');
  execSync('node scripts/generate-icons.js', { stdio: 'inherit' });
}

// 2. Run TypeScript check
console.log('Running TypeScript type check...');
execSync('npx tsc', { stdio: 'inherit' });

// 3. Run base Vite builds into dist/
console.log('Building UI and background worker...');
execSync('npx vite build', { stdio: 'inherit' });
execSync('npx vite build -c vite.background.config.ts', { stdio: 'inherit' });

// Determine which targets to package
const targetsToBuild = requestedTarget === 'all' ? TARGETS : [requestedTarget];

for (const target of targetsToBuild) {
  if (!TARGETS.includes(target)) {
    console.error(`Unknown target: ${target}. Must be one of: ${TARGETS.join(', ')} or 'all'`);
    process.exit(1);
  }

  const targetDir = path.resolve(`dist/${target}`);
  console.log(`\n📦 Packaging distribution for ${target.toUpperCase()} -> ${targetDir}`);

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy background worker
  const bgSrc = path.resolve('dist/background.js');
  if (fs.existsSync(bgSrc)) {
    fs.copyFileSync(bgSrc, path.join(targetDir, 'background.js'));
  }

  // Copy HTML pages (src/), assets, and icons directories
  ['src', 'assets', 'icons'].forEach((dir) => {
    const src = path.resolve(`dist/${dir}`);
    if (fs.existsSync(src)) {
      copyRecursiveSync(src, path.join(targetDir, dir));
    }
  });

  // Copy browser-specific manifest
  const manifestSrc = path.resolve(`manifests/manifest.${target}.json`);
  if (!fs.existsSync(manifestSrc)) {
    console.error(`Manifest not found: ${manifestSrc}`);
    process.exit(1);
  }
  fs.copyFileSync(manifestSrc, path.join(targetDir, 'manifest.json'));

  // Create zip file for webstore upload
  const zipPath = path.resolve(`dist/${target}.zip`);
  if (fs.existsSync(zipPath)) {
    fs.rmSync(zipPath, { force: true });
  }
  execSync(`cd "${targetDir}" && zip -r "${zipPath}" . -x "*.DS_Store*"`, { stdio: 'ignore' });

  console.log(`✅ ${target.toUpperCase()} build complete! Ready in dist/${target}/ (and dist/${target}.zip)`);
}

console.log('\n🎉 All requested targets built successfully!\n');
