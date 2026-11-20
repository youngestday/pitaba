# ピタBA（旧名 Zengo）：Claude への決まりごと

このファイルは、セッションの最初に自動で読まれる。ここと NEXT_SESSION.md を読めば、引き継ぎなしで続きができるようにしてある。

## 最初にすること
1. **NEXT_SESSION.md を読む**（今の状態・決まったこと・次の候補が全部ある）
2. 必要に応じて README.md（機能の詳しい説明）と index.html を読む
3. 作者の指示を待つ（読んだだけで勝手に作業を始めない）

## ブランチの決まり（大事）
- `main` ＝ 公開中の版（GitHub Pages：https://youngestday.github.io/pitaba/ ）。**整理収納アドバイザーの方に使ってもらっている**
- `develop` ＝ 試している版（Cloudflare Pages：https://develop.pitaba.pages.dev/ 。push すると1分ほどで自動更新）
- **作業は `develop` で行う。`main` に入れる（公開する）のは、作者が「出してよい／main に入れて」と言ったときだけ**
- 例外：アプリの動きに関係しない文書（CLAUDE.md・NEXT_SESSION.md）は、両方のブランチに入れてよい（`main` には cherry-pick で入れる。`develop` を `main` にまるごと merge しない）
- clone が `main` だけを追う設定のときは `git config --add remote.origin.fetch '+refs/heads/develop:refs/remotes/origin/develop' && git fetch origin` で `develop` を取ってくる

## 作るときの決まり
- 変更のたびに `<meta name="zengo-version">` の版を上げる（形式 `YYYY.MM.DD-通し番号`。通し番号は main・develop を通して増やす）。名前の zengo は変えない（古いアプリの更新確認に使う）
- **main に入れる（公開する）ときは、CHANGELOG.md に、前の公開からの変更を「どこがどう変わったか」で短くまとめる**（新しいものが上。利用者にわかる言葉で）。**アプリの設定画面の「更新履歴」（index.html の `#changelog`）も同じ内容に更新する**
- IndexedDB 名 `zengo`、localStorage の `bacam.` は変えない（保存データが消える）
- ボタンの位置と大きさは、ビフォー／アフター／ON・OFF で動かさない。縦横回転後も崩れないこと
- テストは Playwright（フェイクカメラ）。`NODE_PATH=$(npm root -g) node テスト.js`。カメラ映像を流し込むときは `--use-file-for-fake-video-capture=動画.y4m`（ffmpeg で画像から作れる）。`index.html#test` で開くと `window.__z` などのテスト用の入口が使える
- 変更したら README を更新し、push する。配布ガイド（docs/guide.html）を直したら `NODE_PATH=$(npm root -g) node tools/make-guide.js` で PDF と画像を作り直す
- 説明は日本語でやさしく。アプリの中の言葉は、用途を限らない（「片付け」などと書かない）
- 機能は**足すより引く**（Apple 製品のような、そぎ落とした使いやすさ）。**1クリックでも減らす**。確認の質問を出さない（元に戻せるようにする）。何をしたかは見せる（ブラックボックスにしない）

## 引き継ぎ（いつも最新にしておく）
- **作業がひと区切りついたら、そのつど NEXT_SESSION.md の「今の状態」「最近決まったこと」「次の候補」を書き直して push する**（develop と main の両方。上の例外のとおり）。こうしておけば、セッションが切れても引き継ぎ作業はいらない
- **コンテキスト（会話の長さ）が 50% を超えたら**、作者に「50%を超えたので、新しいセッションに移りましょう」と伝える。その前に NEXT_SESSION.md を最新にして push しておく。作者が残りの%を教えてくれたときも同じ。自分で正確な%が分からないときは、会話がかなり長くなった（大きな作業をいくつも終えた）時点で、念のため伝える
