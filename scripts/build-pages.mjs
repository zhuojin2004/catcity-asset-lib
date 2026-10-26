// 组装 GitHub Pages 静态站点到 pages/，并替换 HBS 占位符
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'dist/client');
const OUT = path.join(ROOT, 'pages');
const BASE_PATH = '/catcity-asset-lib';

const copyDir = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name);
    const t = path.join(to, e.name);
    if (e.isDirectory()) copyDir(s, t);
    else fs.copyFileSync(s, t);
  }
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

copyDir(path.join(SRC, 'assets'), path.join(OUT, 'assets'));
copyDir(path.join(SRC, 'img'), path.join(OUT, 'img'));
fs.copyFileSync(path.join(SRC, 'favicon.svg'), path.join(OUT, 'favicon.svg'));

let html = fs.readFileSync(path.join(SRC, 'client/index.html'), 'utf-8');

const APP_NAME = '猫城纪行·全品类资产库';
const APP_DESC = '猫城纪行全品类资产库：角色、场景、道具、音色统一管理与检索';

// 顺序：先替换三花括号，再替换双花括号
const replacements = [
  ['{{{appAvatar}}}', 'favicon.svg'],
  ['{{{__platform__}}}', '{}'],
  ['{{appId}}', ''],
  ['{{userId}}', ''],
  ['{{tenantId}}', ''],
  ['{{userName}}', ''],
  ['{{csrfToken}}', ''],
  ['{{environment}}', 'online'],
  ['{{basename}}', BASE_PATH],
  ['{{appName}}', APP_NAME],
  ['{{appDescription}}', APP_DESC],
  ['{{appAvatar}}', 'favicon.svg'],
];
for (const [k, v] of replacements) {
  html = html.split(k).join(v);
}

fs.writeFileSync(path.join(OUT, 'index.html'), html);
// 禁用 Jekyll 处理，保证静态资源正常
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

console.log('Pages 站点已生成到 pages/');
