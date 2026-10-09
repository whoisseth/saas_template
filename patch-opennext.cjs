const fs = require('fs');
const path = require('path');

const file = path.resolve('node_modules/.pnpm/@opennextjs+cloudflare@1.20.6_next@16.3.6_@babel+core@7.29.7_@playwright+test@1.63.0_@types+n_7nxga4usaseqkhi2enshctnoni/node_modules/@opennextjs/cloudflare/dist/cli/build/bundle-server.js');

if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('"sharp"')) {
    content = content.replace('external: [', 'external: ["sharp", "@img/*", ');
    fs.writeFileSync(file, content);
    console.log('Successfully added sharp to external in bundle-server.js');
  } else {
    console.log('Already patched');
  }
} else {
  console.log('File not found:', file);
}
