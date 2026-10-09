/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// 1. Patch bundle-server.js for sharp
const bundleServerPattern = path.join('node_modules', '.pnpm', '@opennextjs+cloudflare@1.20.6_next@16.3.6_@babel+core@7.29.7_@playwright+test@1.63.0_@types+n_7nxga4usaseqkhi2enshctnoni', 'node_modules', '@opennextjs', 'cloudflare', 'dist', 'cli', 'build', 'bundle-server.js');
if (fs.existsSync(bundleServerPattern)) {
  let content = fs.readFileSync(bundleServerPattern, 'utf8');
  if (!content.includes('"sharp"')) {
    content = content.replace('external: [', 'external: ["sharp", "@img/*", ');
    fs.writeFileSync(bundleServerPattern, content);
    console.log('Successfully added sharp to external in bundle-server.js');
  } else {
    console.log('bundle-server.js already patched');
  }
}

// 2. Patch next-server.js to safely try-catch dynamic require of middleware-manifest.json
function findFiles(dir, matchFileName, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '.git') {
        findFiles(fullPath, matchFileName, results);
      }
    } else if (entry.name === matchFileName) {
      results.push(fullPath);
    }
  }
  return results;
}

const safeManifestCode = `let manifest = null;
            try {
                manifest = require(this.middlewareManifestPath);
            } catch {}
            return manifest;`;

const nextServerFiles = findFiles(path.resolve('node_modules'), 'next-server.js');
for (const file of nextServerFiles) {
  if (file.includes(path.join('dist', 'server', 'next-server.js'))) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('const manifest = null;\n            return manifest;')) {
      content = content.replace('const manifest = null;\n            return manifest;', safeManifestCode);
      fs.writeFileSync(file, content);
      console.log('Updated getMiddlewareManifest with safe try-catch in:', file);
    } else if (content.includes('const manifest = require(this.middlewareManifestPath);\n            return manifest;')) {
      content = content.replace('const manifest = require(this.middlewareManifestPath);\n            return manifest;', safeManifestCode);
      fs.writeFileSync(file, content);
      console.log('Patched getMiddlewareManifest with safe try-catch in:', file);
    } else {
      console.log('Already has safe getMiddlewareManifest in:', file);
    }
  }
}
