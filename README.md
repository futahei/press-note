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

`.env.example` をコピーして `.env` を作成し、必要な値を設定します。サーバー専用キーは `NEXT_PUBLIC_*` にしないでください。

```bash
cp .env.example .env
```

| 変数名 | 必須 | セットする値 | 用途 |
| --- | --- | --- | --- |
| `ADMIN_PASSWORD_HASH` | 本番必須 | 管理ログイン用パスワードを bcrypt でハッシュ化した文字列 | `/admin` のパスワード認証 |
| `ADMIN_JWT_SECRET` | 本番必須 | 32 文字以上のランダムな秘密文字列 | 管理ログイン Cookie の JWT 署名 |
| `OPENAI_API_KEY` | クロール必須 | OpenAI Platform の API key | プレスリリース要約と用語抽出 |
| `OPENAI_MODEL` | 任意 | 使用する OpenAI モデル名。未設定時は `gpt-5.5` | AI 要約で使うモデルの切り替え |
| `SUPABASE_URL` | DB 利用時必須 | Supabase Project Settings の Project URL | サーバー側 Supabase 接続 |
| `SUPABASE_SERVICE_ROLE_KEY` | DB 利用時必須 | Supabase Project API keys の `service_role` key | サーバー側 DB 操作用。クライアントに出さない |
| `NEXT_PUBLIC_SUPABASE_URL` | 必要時のみ | `SUPABASE_URL` と同じ Project URL | ブラウザ側 Supabase 利用が必要になった場合の公開 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 必要時のみ | Supabase Project API keys の `anon` key | ブラウザ側 Supabase 利用が必要になった場合の公開 anon key |
| `VAPID_PUBLIC_KEY` | Push 必須 | Web Push 用 VAPID public key | ブラウザの Push 購読作成 |
| `VAPID_PRIVATE_KEY` | Push 必須 | Web Push 用 VAPID private key | サーバーから Push 通知を送信 |
| `VAPID_SUBJECT` | Push 必須 | `mailto:you@example.com` 形式の連絡先 | Push サービスへ送る VAPID subject |
| `CRON_SECRET` | Cron 必須 | 32 文字以上のランダムな秘密文字列 | Supabase Cron から `/api/cron/*` を呼ぶ Bearer 認証 |
| `APP_ORIGIN` | 本番必須 | デプロイ先のオリジン。例: `https://pressnote.example.com` | 管理操作の Origin チェック |

ローカルで Supabase 関連の値を空にしている場合、公開ページと管理画面はモックデータで表示されます。開発時のみ `ADMIN_PASSWORD_HASH` 未設定なら、管理ログインの暫定パスワードは `admin` です。

### 秘密値の作成例

`ADMIN_JWT_SECRET` と `CRON_SECRET` は、十分に長いランダム文字列を使います。

```bash
node -e "const { randomUUID } = require('crypto'); console.log(randomUUID() + randomUUID())"
```

`ADMIN_PASSWORD_HASH` は bcrypt ハッシュを設定します。

```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('ここに管理パスワード', 12).then(console.log)"
```

VAPID 鍵は `web-push` で生成できます。

```bash
pnpm exec web-push generate-vapid-keys
```

## 検証

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```
