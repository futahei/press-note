# PressNote

PressNote は、監視対象企業のプレスリリースを収集し、AI による要約・用語解説とともに閲覧できる Web アプリです。

詳細仕様は [docs/SPEC.md](docs/SPEC.md) を参照してください。

## 現在の実装範囲

- Next.js 15 App Router / React 19 / TypeScript / Tailwind CSS のアプリ基盤
- モックデータによるトップ画面、記事詳細、企業一覧、Bot 説明ページ
- 管理ログイン、管理ダッシュボード、ソース一覧、ソース登録画面の初期 UI
- 公開 API、管理 API、Cron API、Push 購読 API の初期 route handler
- Supabase 初期マイグレーション
- ESLint / TypeScript / Vitest coverage / GitHub Actions CI

Supabase、OpenAI、Web Push、実クロール処理は接続境界とスタブを用意した段階です。

## 技術スタック

- Next.js 15.5.9
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- OpenAI API
- Web Push
- Vitest
- ESLint

## セットアップ

```bash
pnpm install
```

## 開発サーバー

```bash
pnpm dev
```

起動後、以下を開きます。

```txt
http://localhost:3000
```

## 検証

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 環境変数

ローカルでは `.env.local` を作成して設定します。

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

ADMIN_PASSWORD=
SESSION_PASSWORD=

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=

CRON_SECRET=
OPENAI_DAILY_BUDGET_TOKENS=1000000
```

管理画面ログインを試す場合は、少なくとも `ADMIN_PASSWORD` を設定してください。

## 主な画面

- `/` 今日のプレスリリース
- `/articles/:id` リリース詳細
- `/companies` 企業一覧
- `/about-bot` Bot 説明
- `/admin/login` 管理者ログイン
- `/admin` 管理ダッシュボード
- `/admin/sources` ソース管理
- `/admin/sources/new` ソース登録

## API

公開 API:

- `GET /api/articles`
- `GET /api/articles/:id`
- `GET /api/sources`
- `POST /api/push/subscribe`

管理 API:

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/sources`
- `POST /api/admin/sources`
- `POST /api/admin/sources/analyze`

Cron API:

- `POST /api/cron/crawl`
- `POST /api/cron/ai`
- `POST /api/cron/notify`
- `POST /api/cron/prune`

Cron API は `X-Cron-Secret` ヘッダーで保護します。

## データベース

初期スキーマは以下にあります。

```txt
supabase/migrations/20260526140000_initial_schema.sql
```

Supabase 側では `pg_cron` と `pg_net` を利用する前提です。

## リポジトリ

```txt
https://github.com/futahei/press-note.git
```

