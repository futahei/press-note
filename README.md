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

| 変数名                          | 必須          | セットする値                                              | 用途                                                      |
| ------------------------------- | ------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `ADMIN_PASSWORD_HASH`           | 本番必須      | 管理ログイン用パスワードを bcrypt でハッシュ化した文字列  | `/admin` のパスワード認証                                 |
| `ADMIN_JWT_SECRET`              | 本番必須      | 32 文字以上のランダムな秘密文字列                         | 管理ログイン Cookie の JWT 署名                           |
| `OPENAI_API_KEY`                | クロール必須  | OpenAI Platform の API key                                | プレスリリース要約と用語抽出                              |
| `OPENAI_ADMIN_API_KEY`          | コスト表示必須 | OpenAI Platform の Admin API key                          | 管理画面の LLM コストを OpenAI Costs API から取得         |
| `OPENAI_COST_API_KEY_ID`        | 任意          | このサービス専用 API key の ID / Tracking ID              | Costs API の取得対象をこのサービスの API key に絞り込む   |
| `OPENAI_MODEL`                  | 任意          | 使用する OpenAI モデル名。未設定時は `gpt-5.5`            | AI 要約で使うモデルの切り替え                             |
| `USD_TO_JPY_RATE`               | 任意          | 例: `160`。未設定時は `160`                               | 管理画面の LLM コストを円換算するための概算レート         |
| `SUPABASE_URL`                  | DB 利用時必須 | Supabase Project Settings の Project URL                  | サーバー側 Supabase 接続                                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | DB 利用時必須 | Supabase Project API keys の `service_role` key           | サーバー側 DB 操作用。クライアントに出さない              |
| `NEXT_PUBLIC_SUPABASE_URL`      | 必要時のみ    | `SUPABASE_URL` と同じ Project URL                         | ブラウザ側 Supabase 利用が必要になった場合の公開 URL      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 必要時のみ    | Supabase Project API keys の `anon` key                   | ブラウザ側 Supabase 利用が必要になった場合の公開 anon key |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | 任意          | Google Analytics 4 Web データストリームの `G-...` 形式 ID | Google Analytics の page_view 計測。未設定ならタグを出さない |
| `VAPID_PUBLIC_KEY`              | Push 必須     | Web Push 用 VAPID public key                              | ブラウザの Push 購読作成                                  |
| `VAPID_PRIVATE_KEY`             | Push 必須     | Web Push 用 VAPID private key                             | サーバーから Push 通知を送信                              |
| `VAPID_SUBJECT`                 | Push 必須     | `mailto:you@example.com` 形式の連絡先                     | Push サービスへ送る VAPID subject                         |
| `CRON_SECRET`                   | Cron 必須     | 32 文字以上のランダムな秘密文字列                         | Supabase Cron から `/api/cron/*` を呼ぶ Bearer 認証       |
| `APP_ORIGIN`                    | 本番必須      | デプロイ先のオリジン。例: `https://pressnote.example.com` | 管理操作の Origin チェック                                |

### Google Analytics の設定

Google Analytics 4 の Web データストリームを作成し、`G-...` 形式の測定 ID を `NEXT_PUBLIC_GA_MEASUREMENT_ID` に設定してください。未設定、または `G-...` 形式でない値の場合は Google Analytics タグを出力しません。

1. Google Analytics で GA4 プロパティを作成します。
2. 管理画面の「データ ストリーム」から Web データストリームを作成します。
3. ストリーム詳細に表示される測定 ID（例: `G-XXXXXXXXXX`）をコピーします。
4. Vercel などの本番環境変数に `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` を設定します。
5. 再デプロイ後、Google Analytics のリアルタイムレポートで page_view が入ることを確認します。

ローカルで Supabase 関連の値を空にしている場合、公開ページと管理画面はモックデータで表示されます。開発時のみ `ADMIN_PASSWORD_HASH` 未設定なら、管理ログインの暫定パスワードは `admin` です。

### 秘密値の作成例

`ADMIN_JWT_SECRET` と `CRON_SECRET` は、十分に長いランダム文字列を使います。

```bash
openssl rand -hex 32
```

`ADMIN_PASSWORD_HASH` は bcrypt ハッシュを設定します。

```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('ここに管理パスワード', 12).then(console.log)"
```

bcrypt ハッシュには `$` が含まれます。Next.js の `.env` は `$` を変数展開するため、`.env` に直接貼る場合は `$` を `\$` に置き換えてください。Vercel などの環境変数 UI に入力する場合は通常そのままで問題ありません。

VAPID 鍵は `web-push` で生成できます。

```bash
pnpm exec web-push generate-vapid-keys
```

### Supabase Cron の本番設定

Supabase Cron は `app_runtime_config` テーブルから本番 URL と Cron 用シークレットを読みます。Supabase SQL Editor で、Vercel に設定した `APP_ORIGIN` と `CRON_SECRET` と同じ値を登録してください。

```sql
insert into app_runtime_config (key, value)
values
  ('pressnote_origin', 'https://your-app.vercel.app'),
  ('cron_secret', 'your-cron-secret')
on conflict (key) do update
set value = excluded.value,
    updated_at = now();
```

`alter database ... set app.pressnote_origin` は Supabase の権限で拒否される場合があるため使いません。

## 検証

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## フィードバック

画面右下のフィードバックボタンから、不具合報告または機能要望を匿名で送信できます。不具合報告では直近のエラーログを含め、機能要望ではパスと本文のみを送信します。管理画面の `/admin/bug-reports` で種別ごとに確認・フィルターできます。
