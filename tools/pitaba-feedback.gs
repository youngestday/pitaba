/**
 * ピタBA フィードバックの受け取り口（Google Apps Script）
 *
 * アプリから送られた「文・お名前・アプリの情報・写真」を受け取り、
 *   - 写真は、あなたの Google ドライブのフォルダ「ピタBA フィードバック写真」に保存
 *   - スプレッドシートの「アプリから」タブに1行足す（写真へのリンク付き）
 *   - あなたのメールに知らせる
 *
 * 使い方：フィードバック用のスプレッドシートを開き、「拡張機能」→「Apps Script」に、この文を全部貼り付けて保存。
 * 「setup」を1回実行して許可したあと、「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 * （次のユーザーとして実行：自分／アクセスできるユーザー：全員）で公開し、ウェブアプリの URL をアプリに設定する。
 */

const SHEET_NAME = 'アプリから';              // 書き込むタブの名前
const FOLDER_NAME = 'ピタBA フィードバック写真'; // 写真を入れるドライブのフォルダ
const NOTIFY = true;                           // 届いたらメールで知らせる（false で知らせない）
const MAX_PER_DAY = 100;                       // 1日に受け付ける件数の上限（いたずら対策）
const MAX_IMAGES = 3;                          // 1回に添えられる写真の数
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;       // 写真1枚の大きさの上限（3MB）
const MAX_TEXT = 2000;                         // 文の長さの上限

// 最初に1回だけ実行する：タブとフォルダを作り、必要な許可をもらう
function setup() {
  getSheet_();
  getFolder_();
  MailApp.getRemainingDailyQuota();
  Logger.log('準備できました。次に「デプロイ」→「新しいデプロイ」で、ウェブアプリとして公開してください。');
}

// ブラウザで URL を開いたときの確認用
function doGet() {
  return out_({ ok: true, app: 'pitaba-feedback' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (req.app !== 'pitaba') return out_({ ok: false, error: 'app' });
    const text = clean_(req.text, MAX_TEXT);
    const name = clean_(req.name, 40);
    const info = clean_(req.info, 300);
    const imgs = Array.isArray(req.images) ? req.images.slice(0, MAX_IMAGES) : [];
    if (!text && !imgs.length) return out_({ ok: false, error: 'empty' });
    if (!countToday_()) return out_({ ok: false, error: 'limit' });

    const when = new Date();
    const stamp = Utilities.formatDate(when, 'Asia/Tokyo', 'yyyyMMdd_HHmmss');
    const urls = [];
    if (imgs.length) {
      const folder = getFolder_();
      imgs.forEach(function (im, i) {
        const type = /^image\/(jpeg|png)$/.test(im && im.type) ? im.type : 'image/jpeg';
        const bytes = Utilities.base64Decode(String((im && im.data) || ''));
        if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return;
        const ext = type === 'image/png' ? 'png' : 'jpg';
        const file = folder.createFile(Utilities.newBlob(bytes, type, stamp + '_' + (i + 1) + '.' + ext));
        urls.push(file.getUrl());
      });
    }

    getSheet_().appendRow([when, name, text, urls.join('\n'), info]);

    if (NOTIFY) {
      const body = [
        'ピタBA に、フィードバックが届きました。', '',
        'お名前：' + (name || '（なし）'),
        '内容：', text || '（文なし）', '',
        '写真：' + (urls.length ? '\n' + urls.join('\n') : 'なし'), '',
        'アプリの情報：' + info, '',
        'スプレッドシート：' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      ].join('\n');
      MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'ピタBA フィードバック' + (name ? '（' + name + '）' : ''), body);
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// 書き込むタブ（なければ作る）
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['日時', 'お名前', '改善要望', '写真', 'アプリの情報']);
    sh.setFrozenRows(1);
    sh.getRange('1:1').setFontWeight('bold');
    sh.setColumnWidth(1, 150); sh.setColumnWidth(2, 100); sh.setColumnWidth(3, 400); sh.setColumnWidth(4, 260); sh.setColumnWidth(5, 320);
    sh.getRange('C:D').setWrap(true);
  }
  return sh;
}

// 写真を入れるフォルダ（なければ作る。あなただけが見られる）
function getFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('folderId');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const folder = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('folderId', folder.getId());
  return folder;
}

// 今日の件数を数え、上限を超えていたら false
function countToday_() {
  const props = PropertiesService.getScriptProperties();
  const key = 'count_' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd');
  const n = Number(props.getProperty(key) || 0) + 1;
  if (n > MAX_PER_DAY) return false;
  props.setProperty(key, String(n));
  return true;
}

// 文を整える（長さの上限。表の数式として動かないよう、= + - @ で始まるときは前に ' を付ける）
function clean_(v, max) {
  let s = String(v == null ? '' : v).slice(0, max).trim();
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
