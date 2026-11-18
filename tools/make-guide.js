// 配布用ガイドを作り直す：docs/guide.html から、PDF（A4・2ページ）と、インスタの DM 用の画像（1ページずつ）を書き出す。
// 使い方（リポジトリのいちばん上で）：NODE_PATH=$(npm root -g) node tools/make-guide.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const url = 'file://' + path.join(root, 'docs', 'guide.html');
  const b = await chromium.launch();

  // PDF
  const p = await b.newPage();
  await p.goto(url);
  await p.waitForTimeout(800);
  await p.pdf({ path: path.join(root, 'docs', 'pitaba-guide.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });

  // 画像（まわりに白い余白を付ける）
  const q = await b.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1.6 });
  await q.goto(url);
  await q.emulateMedia({ media: 'print' });
  await q.waitForTimeout(800);
  const pages = await q.$$('section.page');
  for (let i = 0; i < pages.length; i++) {
    await pages[i].evaluate((el) => { el.style.padding = '28px 32px'; el.style.background = '#fff'; });
    await pages[i].screenshot({ path: path.join(root, 'docs', 'pitaba-guide-' + (i + 1) + '.png') });
  }
  await b.close();
  console.log('PDF と画像 ' + pages.length + ' 枚を書き出しました');
})();
