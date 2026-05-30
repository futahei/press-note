# PressNote

PressNote は企業プレスリリースの収集、100 文字要約、用語解説、ブラウザ通知を扱う Next.js アプリです。`docs/SPEC.md` の Phase 0〜5 の骨格を実装しています。

## 開発

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Supabase 環境変数が未設定の場合、公開ページと管理画面はモックデータで表示されます。開発時のみ管理ログインの暫定パスワードは `admin` です。本番では必ず `ADMIN_PASSWORD_HASH` と `ADMIN_JWT_SECRET` を設定してください。

## 主なルート

- `/` 最新 24 時間のプレスリリース
- `/articles` 過去記事検索
- `/terms` 用語帳
- `/settings` Web Push 購読設定
- `/admin` 管理ダッシュボード
- `/api/cron/crawl?source=<uuid>` Supabase Cron 用クロール

## 環境変数

`.env.example` を参照してください。サーバー専用キーは `NEXT_PUBLIC_*` にしないでください。

## 検証

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```
