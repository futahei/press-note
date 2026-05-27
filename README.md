# PressNote

PressNote は、監視対象企業のプレスリリースを収集し、AI による要約、タグ付け、単語解説とともに閲覧できる Web アプリです。

仕様の詳細は [docs/SPEC.md](docs/SPEC.md) を参照してください。

## 技術スタック

- Next.js 15 App Router / React 19 / TypeScript
- Supabase
- OpenAI API
- Web Push
- Vitest / ESLint

## セットアップ

```bash
pnpm install
```

ローカルで起動する場合は `.env.example` を参考に `.env.local` を作成し、必要な値を入れてください。

```bash
pnpm dev
```

起動後に `http://localhost:3000` を開きます。

## 検証

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 環境変数

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
OPENAI_DAILY_BUDGET_TOKENS=1000000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

ADMIN_PASSWORD=
SESSION_PASSWORD=

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com

CRON_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` はサーバー専用です。ブラウザに公開される `NEXT_PUBLIC_` 付きの環境変数には入れないでください。

## Supabase

初期スキーマは次の SQL です。

```txt
supabase/migrations/20260526140000_initial_schema.sql
```

Supabase SQL Editor で実行するか、Supabase CLI の migration として適用してください。`pg_cron`、`pg_net`、`pgcrypto` を利用します。

Cron を Supabase から実行する場合は、DB 設定に本番 URL と Cron シークレットを登録します。

```sql
alter database postgres set "app.pressnote_base_url" = 'https://your-app.example.com';
alter database postgres set "app.cron_secret" = 'your-cron-secret';
```

ダミーデータは含めていません。運用開始時は `companies` と `sources` に監視対象を登録してください。AI 解析後の単語は `words` と `article_words` に保存され、画面から読み込まれます。

## 主な画面

- `/` 最新記事一覧
- `/articles/:id` 記事詳細
- `/terms` 単語帳
- `/companies` 企業一覧
- `/settings` 通知時刻設定
- `/admin/login` 管理ログイン
- `/admin` 管理ダッシュボード
- `/admin/sources` ソース管理
- `/admin/words` 単語帳管理

## API

公開 API:

- `GET /api/articles`
- `GET /api/articles/:id`
- `GET /api/sources`
- `GET /api/words`
- `POST /api/push/subscribe`

管理 API:

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/sources`
- `POST /api/admin/sources`
- `GET /api/admin/words`
- `POST /api/admin/words`
- `PATCH /api/admin/words`
- `DELETE /api/admin/words`

Cron API:

- `POST /api/cron/crawl`
- `POST /api/cron/ai`
- `POST /api/cron/notify`
- `POST /api/cron/prune`

Cron API は `X-Cron-Secret` ヘッダーで保護します。
