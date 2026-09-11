import fs from 'fs';
import path from 'path';

const pkgPath = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version;

const manifestFiles = [
  'manifests/manifest.chrome.json',
  'manifests/manifest.firefox.json',
  'manifests/manifest.safari.json',
];

console.log(`Syncing version ${version} from package.json to manifests...`);

manifestFiles.forEach((file) => {
  const filePath = path.resolve(file);
  if (fs.existsSync(filePath)) {
    const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    manifest.version = version;
    fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    console.log(`  ✓ Updated ${file} -> version ${version}`);
  } else {
    console.warn(`  ⚠️ File not found: ${file}`);
  }
});

console.log('✅ Manifest versions synchronized successfully!\n');
