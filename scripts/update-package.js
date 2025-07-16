const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 스크립트 추가
packageJson.scripts = {
  ...packageJson.scripts,
  'crawler:start': 'node scripts/start-crawler.js',
  'crawler:manual': 'node scripts/manual-crawl.js',
  'crawler:status': 'node scripts/check-status.js',
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ package.json 스크립트 업데이트 완료');
