# PressNote 仕様書

## 1. 概要

**PressNote** は企業のプレスリリースサイトを自動監視し、その日に公開されたプレスリリースの要約と用語解説を AI が生成する Web アプリケーション。閲覧者はサイト訪問・ブラウザ通知の双方からその日のプレスを把握でき、過去記事と用語解説をアーカイブとして参照できる。

### 1.1 ターゲット

- 業界動向を毎朝キャッチアップしたいビジネスパーソン（10〜30 人規模の同時アクセスを想定）
- 専門用語に不慣れな読者（用語解説と読み仮名で読解を補助）

### 1.2 用語定義

| 用語                    | 定義                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| **ソース (Source)**     | 監視対象となる企業のプレスリリースサイト。`企業名` と `プレスリリース一覧 URL` を持つ |
| **記事 (Article)**      | クロールで取得した個別プレスリリース。AI による 90〜110 文字程度の要約を持つ          |
| **用語 (Term)**         | 記事から AI が自動抽出した専門用語。`見出し語` `読み方` `解説` `関連記事` を持つ      |
| **記事報告 (Report)**   | ユーザーが「プレスリリースではない」または「同じ記事がある」と申告した記事への通知    |
| **不具合報告 (BugReport)** | ユーザーが匿名で送るアプリ不具合の報告。本文と自動取得されたパス・ブラウザ情報・直近エラーログを持つ |
| **購読 (Subscription)** | Web Push の購読情報（endpoint, keys）                                                 |

---

## 2. 機能要件

### 2.1 公開ページ（認証不要）

#### 2.1.1 トップページ `/`

- **最新のプレスリリース一覧** を時系列降順で表示
- 見出し: 「最新のプレスリリース」 / サブキャプション（小さく）: 「直近 24 時間」
- 対象: 現在時刻から 24 時間以内に `published_at`（取得できなければ `fetched_at`）を持つ記事
- 各カードに表示する要素:
  - 企業名
  - プレスタイトル
  - 90〜110 文字程度の要約
  - 本家リンク（外部リンクアイコン付き、`target="_blank" rel="noopener"`）
  - 公開日時
  - 報告アイコン（理由: 「プレスリリースではない」/「同じ記事がある」）
- 「過去の記事を見る」リンクで `/articles` へ
- 通知購読バナー（未購読時のみ表示）

#### 2.1.2 過去記事一覧 `/articles`

- 全期間の記事を無限スクロールで表示する。初期表示は画面高さを埋める程度の件数から開始し、末尾までスクロールされたら次のバッチを追加取得する
- 絞り込み: 企業（ソース）、日付範囲
- 絞り込みフォームの空文字（未入力の日付、未選択の企業、空検索語）は未指定として扱う
- 検索: タイトル・要約のあいまい検索
- カード仕様はトップと同一
- 追加読み込み中はローディングアイコンを表示し、失敗時は再試行ボタンを表示する

#### 2.1.3 記事詳細 `/articles/[id]`

- 企業名・タイトル・要約・公開日時・本家リンク
- **記事から抽出された用語のチップ一覧**（クリックで `/terms/[id]` へ）
- 報告アイコン（理由: 「プレスリリースではない」/「同じ記事がある」。送信は 1 ブラウザ 1 回まで、`localStorage` で抑止）

#### 2.1.4 用語帳 `/terms`

- 全用語を 50 音順（読み方ベース）で表示
- 頭文字（あ・か・さ…）でジャンプ可能なインデックス。各ボタンは 50 音の行単位（例: か=かきくけこ/がぎぐげご、た=たちつてと/だぢづでど）で絞り込む
- 選択中の頭文字を再クリックすると `initial` を解除する
- 検索: 見出し語・読み方の前方一致
- 用語一覧も無限スクロールで表示する。初期表示は画面高さを埋める程度の件数から開始し、末尾までスクロールされたら次のバッチを追加取得する
- 追加読み込み中はローディングアイコンを表示し、失敗時は再試行ボタンを表示する
- 絞り込み後の件数より先のページを取得した場合は空結果として扱い、追加読み込みを終了する

#### 2.1.5 用語詳細 `/terms/[id]`

- 見出し語・読み方（ひらがな/カタカナ）・解説本文
- **この用語が登場した記事の一覧**（要約付きカード、記事詳細へ遷移）

#### 2.1.6 通知設定 `/settings`

- 未購読の場合は「ON にする」ボタンのみ表示
- 購読中の場合は「OFF にする」ボタンを表示
- 購読中の場合は「テスト通知を送る」ボタン

#### 2.1.7 共通不具合報告

- 全画面で右下に不具合報告アイコンを固定表示する
- クリックでダイアログを開き、ユーザーから自由記述の報告本文を匿名で受け付ける
- 送信時に現在のパス、User-Agent、viewport、言語、タイムゾーン、直近 20 件までの `error` / `unhandledrejection` ログを自動送信する
- 送信中はローディングアイコンを表示する
- 送信成功時はダイアログを閉じる

### 2.2 管理画面（パスワード認証）

#### 2.2.1 ログイン `/admin/login`

- パスワード入力（1 フィールド）
- 成功時、HTTP-Only Cookie に JWT を保存（有効期限 90 日、`SameSite=Lax`）
- パスワードは環境変数 `ADMIN_PASSWORD_HASH` の bcrypt ハッシュと比較

#### 2.2.2 管理ダッシュボード `/admin`

- 監視中ソース数、今日の記事数、未対応の記事報告数、未対応の不具合報告数、用語数のサマリー
- **LLM コストグラフ**: 当月 1 日〜末日の日次 OpenAI 使用料を `USD_TO_JPY_RATE` で円換算し、横軸を日付、縦軸をコスト（円）とする棒グラフで表示。月次合計とモデル別内訳も円でサマリー表示
- 管理ページ間の移動はサイドバーで行い、概要ページ下部には重複する遷移ボタンを置かない

#### 2.2.3 ソース管理 `/admin/sources`

- 一覧: 企業名・URL・最終クロール日時・有効/無効トグル
- 新規登録フォーム:
  - 企業名（必須）
  - プレスリリース一覧 URL（必須、URL バリデーション）
  - **初回取り込み件数オプション**: 0/5/10/20 件（0 = 即時取り込みなし）
  - プレビューボタン押下時、選択件数ぶんを同期的に取得・要約してプレビュー表示 → 確定で保存
- 編集・削除

#### 2.2.4 用語管理 `/admin/words`

- 一覧: 見出し語・読み方・登録元（AI 自動 / 管理者手動）・関連記事数
- 一覧は初期表示で一定件数のみ読み込み、下端到達時に次ページを追加取得する無限スクロール
- 新規追加・編集（見出し語・読み方・解説）
- 削除（論理削除なしの物理削除、関連は CASCADE）
- AI が抽出した用語は **`status=published`** で即公開（管理者は事後に編集・削除）

#### 2.2.5 記事報告管理 `/admin/reports`

- 未対応の記事報告一覧（報告理由・記事タイトル・要約・報告日時・本家リンク）
- 「記事を削除」（記事と関連用語紐付けを削除、URL は重複検知用にブラックリスト化）
- 「記事報告を却下」（記事は残し、記事報告のみクローズ）

#### 2.2.6 不具合報告管理 `/admin/bug-reports`

- 未対応の不具合報告一覧を表示する
- 表示項目: 報告本文、送信日時、パス、viewport、言語、タイムゾーン、User-Agent、直近エラーログ
- 「対応完了」で不具合報告をクローズする。操作は画面内で非同期実行し、成功後に一覧を更新する

### 2.3 バックグラウンド処理（Cron）

**実行基盤**: **Supabase Cron (pg_cron + pg_net)** を採用。Vercel Hobby の Cron 制約（1日1回上限）を回避し、追加サービスゼロで運用するため。Cron 定義は `supabase/migrations/` 配下の SQL に含めて Git 管理する。

**Vercel Function timeout (Hobby: 10 秒) 対策**: クロール API は **1 ソース 1 リクエスト** で呼び出す。Supabase 側でディスパッチャ SQL が有効ソースを列挙して `pg_net.http_get` をソースごとにループ実行する。

#### 2.3.1 クロール（1 日 3 回: 06:00 / 12:00 / 18:00 JST）

- 各有効ソースに対して OpenAI Responses API + `web_search` ツールで以下の手順を 1 プロンプト内に明示して実行:
  1. 登録 URL を調べ、ページ本文の主コンテンツ領域にある記事一覧・リスト・カードから最新のプレスリリースを取得
  2. 指定件数に満たなければ、登録 URL のドメイン内で Web 検索して最新のプレスリリースを取得
  3. それでも指定件数に満たなければ、「企業名 プレスリリース」で Web 検索して最新のプレスリリースを取得
- ヘッダー、グローバルナビ、フッター、サイドバー、関連記事、別カテゴリのニュースリンクにある URL は除外する
- 取得した URL のうち、`articles.url` に存在しないもののみ AI 要約処理へ
- 1 ソースあたり最大 20 件 / 回でレート制限
- 1 リクエスト = 1 ソース。Function 内処理は 10 秒以内に収める（記事数が多い場合は次回 Cron に持ち越し）

#### 2.3.2 AI 要約 + 用語抽出

- OpenAI Responses API を使用
- `tool_choice: "required"` で `web_search` ツールの使用を必須化
- 入力: 記事 URL（モデルがツール経由で本文取得）
- 出力（Structured Output）:

  ```json
  {
    "title": "string",
    "summary": "string (日本語90〜110文字程度、最大120文字)",
    "published_at": "ISO8601 or null",
    "is_press_release": "boolean",
    "terms": [
      { "headword": "string", "reading": "string", "description": "string" }
    ]
  }
  ```

- `published_at` は ISO8601 datetime を期待する。AI が `YYYY-MM-DD` や `YYYY年M月D日` を返した場合は保存前に ISO8601 へ正規化し、不明値は `null` にする
- `is_press_release=false` のものは保存しない
- 用語は `headword` 一致で既存とマージ（説明は既存を優先）

#### 2.3.3 毎朝 8:00 JST のプッシュ通知

- 直近 24 時間（前回通知後〜現在）に取得した記事を対象
- 通知本文: `「最新のプレス N 件 (企業 A, 企業 B, ...)」`
- クリック時のリンク先: `/`
- 失敗した購読（410 Gone）は `push_subscriptions` から削除

#### 2.3.4 LLM 使用ログの集計（日次）

- `llm_usage_logs` を日次集計する `llm_usage_daily` View を提供する
- `llm_usage_daily` は `security_invoker = true` で作成する
- `/api/cron/usage-rollup` は Cron 疎通確認用の API として残し、View 自体は自動集計される
- グラフは当月 1 日〜末日の日次コスト（円）を棒グラフ表示、月次合計を併記

### 2.4 通知購読フロー

1. サイト訪問時、`/settings` または初回バナーから「通知を有効化」ボタンを押下
2. Service Worker 登録 → `pushManager.subscribe()` で購読
3. `POST /api/push/subscribe` で endpoint/keys をサーバーに保存
4. ブラウザ拒否時はその旨を表示し、再表示は 7 日間抑止

---

## 3. 非機能要件

### 3.1 パフォーマンス

- 10〜30 人の同時アクセス時、**ページ遷移 0.2 秒以内**（TTFB 目標 100ms 以下）
- Supabase インデックス: `articles(published_at desc)`, `articles(source_id, published_at)`, `terms(reading)`, `article_terms(article_id)`, `article_terms(term_id)`
- ISR（Incremental Static Regeneration）でトップ・記事詳細・用語詳細をキャッシュ（revalidate: 60 秒）
- 画像・アイコンは Next/Image で最適化

### 3.2 レスポンシブ

- スマホ（375px〜）〜デスクトップ（1440px+）で破綻なく表示
- DESIGN.md 準拠（日本語は Noto Sans JP）
- ブレークポイント: 640 / 834 / 1068 / 1440

### 3.3 セキュリティ

- 管理 API は middleware で JWT 検証
- パスワードは平文比較せず bcrypt
- CSRF 対策: 管理操作は SameSite=Lax Cookie + Origin チェック
- Supabase は **Row Level Security (RLS) を全テーブルで有効化**、公開ページはサービスロール経由のサーバー側読み出しのみ
- 環境変数のクライアント露出禁止（`NEXT_PUBLIC_*` の精査）

### 3.4 可用性

- Cron 失敗時はログを残し、次回実行で巻き返す（冪等性を保証）
- OpenAI API 失敗時は 3 回までリトライ（指数バックオフ）

---

## 4. 技術スタック

| レイヤ              | 採用技術                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| フレームワーク      | Next.js 15 (App Router, React Server Components)                                                                                  |
| 言語                | TypeScript (strict)                                                                                                               |
| スタイリング        | Tailwind CSS v4 + DESIGN.md トークン                                                                                              |
| フォント            | Noto Sans JP（日本語）/ system-ui（英数）                                                                                         |
| DB / Auth / Storage | Supabase (Postgres)                                                                                                               |
| ホスティング        | Vercel                                                                                                                            |
| バージョン管理      | GitHub                                                                                                                            |
| AI                  | OpenAI Responses API + `web_search` ツール (`tool_choice: "required"`)、モデルは `OPENAI_MODEL` 環境変数で指定（既定: `gpt-5.5`） |
| プッシュ通知        | Web Push API + `web-push` ライブラリ + VAPID 鍵                                                                                   |
| Cron                | **Supabase Cron (pg_cron + pg_net)** — Vercel Hobby の Cron 制約を回避し、追加サービスを増やさないため                            |
| バリデーション      | Zod                                                                                                                               |
| テスト              | Vitest（unit）+ Playwright（E2E）                                                                                                 |
| CI/CD               | GitHub Actions（lint / typecheck / test） + Vercel 自動デプロイ                                                                   |

### 4.1 環境変数

| 変数名                                   | 用途                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `ADMIN_PASSWORD_HASH`                    | bcrypt ハッシュ済み管理者パスワード                                                |
| `ADMIN_JWT_SECRET`                       | 管理者 Cookie 用 JWT 署名鍵                                                        |
| `OPENAI_API_KEY`                         | OpenAI API キー                                                                    |
| `OPENAI_MODEL`                           | 使用モデル（既定: `gpt-5.5`）                                                      |
| `USD_TO_JPY_RATE`                        | 管理画面の LLM コストを円換算するための概算レート（既定: `160`）                   |
| `SUPABASE_URL`                           | Supabase プロジェクト URL                                                          |
| `SUPABASE_SERVICE_ROLE_KEY`              | サーバー専用キー（クライアント露出禁止）                                           |
| `NEXT_PUBLIC_SUPABASE_URL`               | 必要時のみ。現状はブラウザから Supabase を直接利用しないため本番必須ではない       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`          | 必要時のみ。現状はブラウザから Supabase を直接利用しないため本番必須ではない       |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push VAPID 鍵                                                                  |
| `VAPID_SUBJECT`                          | 連絡先メール（`mailto:...`）                                                       |
| `CRON_SECRET`                            | Supabase Cron (pg_net) から `/api/cron/*` を呼び出す際の Bearer 認証用シークレット |
| `APP_ORIGIN`                             | 本番オリジン。管理 API の Origin チェックに使用                                    |

Supabase Cron は DB パラメータではなく `app_runtime_config` テーブルから `pressnote_origin` と `cron_secret` を読み出す。値は Supabase SQL Editor またはマイグレーション後の SQL で登録する。

---

## 5. データモデル（Supabase / Postgres）

```sql
-- 監視対象
create table sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  enabled boolean not null default true,
  last_crawled_at timestamptz,
  created_at timestamptz not null default now()
);

-- 記事（プレスリリース）
create table articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  url text not null unique,         -- 重複検知キー
  title text not null,
  summary text not null check (char_length(summary) <= 120), -- 90〜110字程度の要約
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  is_deleted boolean not null default false  -- 報告で削除されたら true（URLはブラックリスト維持）
);
create index on articles (published_at desc);
create index on articles (source_id, published_at desc);

-- 用語
create table terms (
  id uuid primary key default gen_random_uuid(),
  headword text not null unique,
  reading text not null,            -- ひらがな or カタカナ
  description text not null,
  source_kind text not null check (source_kind in ('ai','manual')),
  status text not null default 'published' check (status in ('published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on terms (reading);

-- 記事 ↔ 用語
create table article_terms (
  article_id uuid not null references articles(id) on delete cascade,
  term_id uuid not null references terms(id) on delete cascade,
  primary key (article_id, term_id)
);
create index on article_terms (term_id);

-- 報告
create table reports (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  reason text not null default 'not_press_release' check (reason in ('not_press_release','duplicate')),
  status text not null default 'open' check (status in ('open','accepted','rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create unique index on reports (article_id) where status = 'open';

-- 不具合報告
create table bug_reports (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  path text not null,
  user_agent text,
  viewport text,
  language text,
  timezone text,
  logs jsonb not null default '[]'::jsonb,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index on bug_reports (status, created_at desc);

-- 報告承認済み / AI 判定除外 URL
create table rejected_article_urls (
  url text primary key,
  article_id uuid references articles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 通知購読
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- LLM 使用ログ（コスト可視化用）
create table llm_usage_logs (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  model text not null,                  -- 例: 'gpt-5.5'
  purpose text not null,                -- 'crawl_step_a' / 'crawl_step_b' / 'crawl_step_c' / 'summarize' / 'extract_terms'
  input_tokens integer not null,
  output_tokens integer not null,
  cost_usd numeric(10,6) not null,      -- レスポンスの usage から計算
  source_id uuid references sources(id) on delete set null,
  article_id uuid references articles(id) on delete set null
);
create index on llm_usage_logs (occurred_at desc);

-- Supabase Cron 実行時の本番 URL / Cron secret
create table app_runtime_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- 用語一覧と LLM 使用量集計は security_invoker view として提供
create view terms_with_article_count
with (security_invoker = true) as ...;

create view llm_usage_daily
with (security_invoker = true) as ...;
```

容量見積もり: 1 日 ~2,000 行 × 200 byte ≈ 400KB/日 = **150MB/年**。Supabase Free Tier (500MB) の 1/3 以内に収まる。

すべてのテーブルで RLS を有効化し、`service_role` 以外のアクセスを拒否（サーバー側ハンドラ経由のみアクセス可）。

---

## 6. API 仕様

### 6.1 公開 API

| メソッド | パス                       | 概要                                              |
| -------- | -------------------------- | ------------------------------------------------- |
| GET      | `/api/articles`            | 記事一覧（`?date=YYYY-MM-DD&source=ID&q=&page=&limit=`）。`{ articles, total, page, limit, hasMore }` を返す |
| GET      | `/api/articles/:id`        | 記事詳細 + 関連用語                               |
| GET      | `/api/terms`               | 用語一覧（`?initial=あ&q=&page=&limit=`）。`{ terms, total, page, limit, hasMore }` を返す |
| GET      | `/api/terms/:id`           | 用語詳細 + 関連記事                               |
| POST     | `/api/articles/:id/report` | 記事報告。body: `{ reason: "not_press_release" \| "duplicate" }` |
| POST     | `/api/bug-reports`         | 匿名不具合報告。body: `{ message, path, user_agent, viewport, language, timezone, logs[] }` |
| POST     | `/api/push/subscribe`      | プッシュ通知購読登録                              |
| DELETE   | `/api/push/subscribe`      | 購読解除                                          |

### 6.2 管理 API（JWT Cookie 必須）

| メソッド       | パス                            | 概要                           |
| -------------- | ------------------------------- | ------------------------------ |
| POST           | `/api/admin/login`              | ログイン、Cookie 発行          |
| POST           | `/api/admin/logout`             | Cookie 失効                    |
| GET / POST     | `/api/admin/sources`            | ソース一覧 / 登録              |
| PATCH / DELETE | `/api/admin/sources/:id`        | ソース更新 / 削除              |
| POST           | `/api/admin/sources/preview`    | 登録前の初回取り込みプレビュー |
| GET / POST     | `/api/admin/words`              | 用語一覧（`page` / `limit` ページング） / 追加 |
| PATCH / DELETE | `/api/admin/words/:id`          | 用語更新 / 削除                |
| GET            | `/api/admin/reports`            | 記事報告一覧                   |
| POST           | `/api/admin/reports/:id/accept` | 記事報告承認（記事削除）       |
| POST           | `/api/admin/reports/:id/reject` | 記事報告却下                   |
| POST           | `/api/admin/bug-reports/:id/resolve` | 不具合報告を対応完了にする |

### 6.3 Cron API（Supabase Cron から `Authorization: Bearer ${CRON_SECRET}` 付きで呼ばれる）

| メソッド | パス                            | 概要                                           | スケジュール (UTC / JST)         |
| -------- | ------------------------------- | ---------------------------------------------- | -------------------------------- |
| GET      | `/api/cron/crawl?source=<uuid>` | **指定 1 ソース** のクロール + 要約 + 用語抽出 | Supabase 側で有効ソースを fanout |
| GET      | `/api/cron/notify`              | 直近 24h 記事のプッシュ送信                    | `0 23 * * *` (UTC) = JST 08:00   |
| GET      | `/api/cron/prune`               | 失効購読のクリーンアップ                       | 週次（日曜 JST 03:00）           |
| GET      | `/api/cron/usage-rollup`        | 前日 LLM 使用ログの日次集計                    | `5 15 * * *` (UTC) = JST 00:05   |

#### 6.3.1 Supabase Cron 設定例

`supabase/migrations/xxxx_setup_cron.sql`:

```sql
-- 必要な拡張
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Cron は app_runtime_config から本番 URL とシークレットを読み出す。
-- Supabase SQL Editor で以下を設定する:
-- insert into app_runtime_config (key, value)
-- values
--   ('pressnote_origin', 'https://pressnote.vercel.app'),
--   ('cron_secret', 'your-cron-secret')
-- on conflict (key) do update set value = excluded.value, updated_at = now();

-- クロール: 06/12/18 JST = 21/03/09 UTC
-- 有効な各ソースに対して 1 リクエスト発火
select cron.schedule(
  'pressnote-crawl',
  '0 21,3,9 * * *',
  $$
  with config as (
    select
      max(value) filter (where key = 'pressnote_origin') as origin,
      max(value) filter (where key = 'cron_secret') as secret
    from public.app_runtime_config
    where key in ('pressnote_origin', 'cron_secret')
  )
  select net.http_get(
    url := rtrim(config.origin, '/') || '/api/cron/crawl?source=' || s.id::text,
    headers := jsonb_build_object('Authorization', 'Bearer ' || config.secret)
  )
  from sources s
  cross join config
  where s.enabled = true
    and config.origin is not null
    and config.secret is not null;
  $$
);

-- notify / usage-rollup / prune も同様に app_runtime_config から origin と secret を読む。
```

---

## 7. OpenAI 呼び出し設計

### 7.1 共通ポリシー

- API: `POST https://api.openai.com/v1/responses`
- 必ず `tools: [{ type: "web_search" }]`, `tool_choice: "required"` を指定
- 出力は Structured Output（JSON Schema）で受け取り、Zod で再検証

### 7.2 AI 主導の段階的探索（クロール時）

探索は HTML パースではなく、OpenAI Responses API + `web_search` ツールに以下の手順を 1 プロンプトで指示する。

1. 登録 URL を調べ、ページ本文の主コンテンツ領域にある記事一覧・リスト・カードから最新のプレスリリース個別 URL を取得
2. 指定件数に満たなければ、登録 URL のドメイン内で Web 検索して最新のプレスリリース個別 URL を取得
3. それでも指定件数に満たなければ、「企業名 プレスリリース」で Web 検索して最新のプレスリリース個別 URL を取得

除外条件:

- ヘッダー、グローバルナビ、フッター、サイドバー、関連記事、別カテゴリのニュースリンク
- 一覧ページ、カテゴリページ、採用情報、問い合わせ、SNS、重複 URL

成果物はプレスリリース本文の個別 URL のみとする。

### 7.3 要約 + 用語抽出（個別記事）

- プロンプト: 「次の URL の本文を取得し、90〜110 文字程度の要約と専門用語（読み方つき）を抽出」
- Structured Output の `summary` は `minLength: 80`, `maxLength: 120`
- 文字数が 80 文字未満であっても、文字数を理由に再生成しない
- OpenAI API の通信失敗時のみ `createResponse` 内で最大 3 回リトライする
- PDF URL は OpenAI の `web_search` ツールで取得できる場合のみ対応する。アプリ側で PDF を直接ダウンロード・テキスト抽出する明示的な処理は持たない

---

## 8. プロジェクト構成（推奨）

```txt
press-note/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # /
│   │   ├── articles/page.tsx        # /articles
│   │   ├── articles/[id]/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── terms/[id]/page.tsx
│   │   └── settings/page.tsx
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── page.tsx
│   │   ├── sources/page.tsx
│   │   ├── words/page.tsx
│   │   ├── reports/page.tsx
│   │   └── bug-reports/page.tsx
│   ├── api/
│   │   ├── articles/...
│   │   ├── bug-reports/route.ts
│   │   ├── terms/...
│   │   ├── push/subscribe/route.ts
│   │   ├── admin/...
│   │   └── cron/{crawl,notify,prune}/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/                       # UI コンポーネント
├── lib/
│   ├── supabase.ts                   # サーバー / クライアント用ファクトリ
│   ├── openai.ts                     # Responses API ラッパ
│   ├── crawler.ts                    # AI 主導の段階的探索
│   ├── push.ts                       # web-push ラッパ
│   ├── auth.ts                       # JWT 発行・検証
│   └── schemas.ts                    # Zod スキーマ
├── public/
│   ├── icon.png
│   └── sw.js                         # Service Worker（プッシュ受信）
├── supabase/migrations/              # SQL マイグレーション（pg_cron スケジュール含む）
├── tests/
│   ├── unit/                         # Vitest
│   └── e2e/                          # Playwright
├── .github/workflows/
│   ├── ci.yml                        # lint + typecheck + test on PR
│   └── db.yml                        # マイグレーション適用（pg_cron 含む）
└── README.md
```

---

## 9. テスト戦略

### 9.1 単体テスト（Vitest）

- `lib/crawler.ts` の探索プロンプト
- `lib/openai.ts` のレスポンスバリデーション（モック）
- `lib/auth.ts` の JWT 発行 / 検証
- Zod スキーマの境界値（120 字超過、公開日時の形式ゆれ、記事報告理由、不具合報告本文・ログなど）
- 不具合報告の対応完了 API（JSON 応答、一覧再検証）

### 9.2 結合テスト

- API ルートの正常系・異常系（Supabase はテスト用プロジェクト or `pg-mem` でモック）
- 重複 URL は INSERT がスキップされる
- 報告 → 承認で `articles.is_deleted=true` になり、URL が `rejected_article_urls` に保存される

### 9.3 E2E（Playwright）

- トップ → 記事詳細 → 用語詳細の遷移
- 管理ログイン → ソース登録（プレビュー 5 件） → 一覧反映
- 報告ボタン押下 → 管理画面に表示
- スマホビューポート（iPhone 12）で表示崩れがない

### 9.4 CI（GitHub Actions）

- `pull_request` トリガで `pnpm install` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → Playwright
- main マージで Vercel が自動デプロイ
- Supabase マイグレーションは `db.yml` で `supabase db push`

---

## 10. デザイン

- `DESIGN.md` の **Glassmorphism Minimal** を PressNote 全体に適用する:
  - 背景は淡いブルー / パープルのグラデーション
  - ヘッダー、通知バナー、カード、管理パネルは半透明のグラス面で階層化する
  - アクセントは青〜紫のグラデーション CTA を基本にする
  - **日本語フォントは Noto Sans JP 固定**（プロジェクト指示）。英数は `system-ui, -apple-system`
  - 記事カード・用語カードは角丸、薄い境界線、軽い影で読みやすさを優先する
  - アイコン操作は `aria-label` を付与し、キーボードフォーカスリングを青系で表示する
- 通知設定は大きなグラスパネル内に状態、ON/OFF 操作、テスト通知操作を行単位で配置する
- 管理画面は淡いサイドバー + グラスカードのダッシュボードとして統一する

---

## 11. リリース計画（参考）

1. **Phase 0**: リポジトリ初期化、CI、Supabase スキーマ、認証骨格
2. **Phase 1**: 管理画面（ソース・用語 CRUD）
3. **Phase 2**: クローラ + OpenAI 要約 + 用語抽出（Cron）
4. **Phase 3**: 公開ページ（記事 / 用語）と検索
5. **Phase 4**: Web Push 購読 + 毎朝通知
6. **Phase 5**: 報告フロー + 管理対応
7. **Phase 6**: E2E 整備、パフォーマンス計測、本番リリース

---

## 12. インフラ・無料枠の前提

本アプリは **個人用途** のため、LLM 利用料を除く全サービスを **Free Tier 内** で運用する。

| サービス     | プラン   | 主要な無料枠                                         | このアプリでの想定消費                                                                         |
| ------------ | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Vercel**   | Hobby    | 100GB 帯域 / Function 10秒 / **Cron は1日1回まで**   | 帯域は 10〜30 人想定で問題なし。Cron は使わず Supabase Cron 経由で起動するため制約に抵触しない |
| **Supabase** | Free     | DB 500MB / egress 2GB/月 / `pg_cron` `pg_net` 利用可 | DB は数年分の記事を見ても 200MB 以内、egress も問題なし                                        |
| **GitHub**   | Free     | public リポは Actions 無制限 / private は 2000 分/月 | CI のみで使用、月数十分程度                                                                    |
| **OpenAI**   | 従量課金 | （対象外、別途課金）                                 | `OPENAI_MODEL` で切替可能                                                                      |
| **Web Push** | -        | 無料                                                 | VAPID 鍵で運用                                                                                 |

### 制約への対応設計

- **Vercel Function 10 秒制限**: クロール API は「1 リクエスト = 1 ソース」設計。Supabase Cron 側で fanout する
- **Supabase 一時停止（7日無アクセス）**: 本アプリは日次 Cron が走り続けるため自動停止しない
- **個人用途前提**: 業務利用に転用する場合は Vercel Pro ($20/月) が規約上必要。要件変更時はインフラ章を見直すこと

## 13. 未定事項 / 将来拡張

- 多言語化（現状は日本語のみ）
- ソース登録時の URL からの構造自動推測（`sitemap.xml` 優先など）
- 用語の類義語マージ（AI による表記ゆれ統合）
- 記事ジャンルタグ（業界 / カテゴリ分類）
- 管理者複数化（現在は単一パスワード）
