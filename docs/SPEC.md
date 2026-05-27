# PressNote 仕様書

> 監視対象企業のプレスリリースを毎日収集し、AI による要約・単語帳とともに配信する Web アプリ。

- **対象開発者**: Codex
- **作成日**: 2026-05-26
- **バージョン**: 0.4.0
- **デザイン参照**: [assets/dev/mockup.png](../assets/dev/mockup.png)

---

## 1. プロダクト概要

### 1.1 目的

複数企業のプレスリリースサイト(公式サイト, IR ページ, PR TIMES などの配信サイト, PDF 配布形式)を横断的に監視し、その日に出たリリースをワンビューで把握できる Web サービスを提供する。AI による「100 文字要約 + 専門用語の解説」によって、業界知識が浅い読者でも一次情報を理解できる状態に底上げする。

### 1.2 想定ユーザー

- リサーチ担当 / 広報担当 / 営業企画 / 投資家など、特定企業のリリースを追う必要がある人。
- 想定同時アクセス数: **10〜30 名程度**(読み取り中心)。
- ユーザー登録は不要(全員が同じビューを閲覧)。管理画面のみパスワード認証で保護。

### 1.3 中核ユースケース

1. 朝、ブラウザ通知を受け取り PressNote を開く。
2. 当日(または直近)のプレスリリース一覧を確認する。
3. 興味のあるリリースをクリックし、AI 要約 + 単語帳で内容を理解する。
4. 必要に応じて本家リリースページ / 元 PDF へ遷移して詳細を確認する。
5. 管理者は新たに監視したい企業サイトを登録 → AI 補助で抽出方法を決定 → 公開する。

---

## 2. 機能要件

### 2.1 読み取り側(一般ユーザー向け)

#### 2.1.1 トップ画面 (今日のプレスリリース)

モック(`assets/dev/mockup.png`)準拠の **3 ペイン構成**:

```txt
┌────────┬────────────────────────────────────────┬──────────────┐
│ 左     │ ヘッダ (タイトル / 日付 / 検索 / nav)   │ 右ウィジェット │
│ ナビ   ├────────────────────────────────────────┤              │
│ レール │ フィルタチップ + 並び替え               │ 最新の単語     │
│        ├────────────────────────────────────────┤              │
│        │ プレスリリースカード(縦リスト)          │              │
│        │  - 企業ロゴ + 企業名 + 日付             │              │
│        │  - タイトル                            │              │
│        │  - AI 要約 (短)                        │              │
│        │  - カテゴリ/タグチップ                  │              │
│        │  - 取得モードバッジ / 外部リンク         │              │
│        ├────────────────────────────────────────┤              │
│        │ ページネーション                        │              │
└────────┴────────────────────────────────────────┴──────────────┘
```

- 左ナビ: アイコン + ラベル。「ホーム / 企業一覧 / 単語帳 / 通知設定 / ヘルプ」を主要導線とする。管理画面はユーザー設定と誤認しないよう、レール最下部に独立した管理者アイコンで配置する。未実装の「分析」「アラート」は表示しない。
- ヘッダ: ページタイトル「今日のプレスリリース」 + 日付ピッカー + 検索。通知アイコンと保存済みアイコンは表示しない。
- 中央リスト:
  - 1 カード 1 リリース。クリックで詳細画面へ遷移。
  - 表示要素: 企業ロゴ・企業名・公開日時・タイトル・AI 要約短(120 文字以内)・タグチップ最大 3 件・取得モードバッジ(RSS/SCRAPE/PDF)・本家リンクアイコン(`rel="noopener noreferrer" target="_blank"`)。
  - **日付表示ルール**: `published_at` があれば「公開 MM/DD HH:mm」、無ければ `detected_at` をフォールバックし「**検知** MM/DD HH:mm」とラベルを差別化して表示する。
  - フィルタチップ: 「すべて」「AI 関連」など、AI が抽出したタグの上位カテゴリ。
  - 並び替え: 新着順(既定) / 企業順。
  - ページング: 30 件ずつのページャ(モックに準拠)。無限スクロールは採用しない。
- 右ウィジェット(PC のみ表示、tablet 以下では下部へスタック):
  - **最新の単語**: 記事解析で登録された単語のうち最新 3 件。単語 / 読み / 意味を表示し、単語帳一覧へ遷移できる。

#### 2.1.2 リリース詳細画面 (`/articles/:id`)

- 表示要素:
  - リリースタイトル / 企業名 / 公開日時 / 取得元 URL / 取得モードバッジ
  - **AI 要約** (短 100 字 + 長 300 字)
  - **単語帳リスト** (単語 + 読み + 意味 + タグ)
  - **タグチップ**
  - 元リリースへのリンク / PDF へのリンク (存在する場合) — 本文抜粋は保持しないため、詳細を読みたい場合は本家へ誘導する CTA を強調表示。
- 共有用 OGP メタを設定 (タイトル + AI 要約短)。

#### 2.1.3 ブラウザ通知 (Web Push)

- **VAPID** ベースの Web Push。
- フロー:
  1. 初回訪問時にバナーで「通知を受け取りますか?」を案内。
  2. 許可を得たら Service Worker を登録し、サブスクリプションを `push_subscriptions` に保存。
  3. ユーザーは `/settings` の通知設定画面で **時刻 (HH:MM, 30 分単位 = `:00` / `:30` のみ)** を設定可。タイムゾーンはブラウザから自動取得(IANA 名で保存)。デフォルト 09:00。UI は 30 分刻みのセレクタで提示する。
  4. サーバー側スケジューラ(後述)が **30 分ごと**(各時の `:00` / `:30`)に動き、`(timezone, notify_local_time)` が現在時刻に一致するサブスクリプションへ Push 配信。
  5. 通知本文:
     - 当日(ユーザー TZ の 00:00 以降)に新着 1 件以上 → `タイトル: 「PressNote: 本日のリリース N 件」` / `本文: 「例: 〈先頭リリースのタイトル〉」`。クリックでトップ画面 (`/?date=today`) を開く。
     - **当日の新着が 0 件のときは通知を送らない**(ノイズ回避)。`last_notified_on` も更新しない。
- 同日中の二重通知を防ぐため `push_subscriptions.last_notified_on` (date) を配信成功時のみ更新。
- 配信失敗 (HTTP 404/410) は `disabled_at` を立てて以後送らない。
- **再購読の重複防止**: 同一ブラウザで `endpoint` が再発行された場合に備え、購読登録時に `(origin, p256dh)` の組で既存レコードを検索し、見つかれば古い行を `disabled_at` で閉じてから新規行を作る。
- ユーザー設定 UI: サイドナビの歯車アイコンから `/settings` を開き、通知時刻を設定する。トップ画面右上には通知アイコンを置かない。

### 2.2 収集パイプライン

#### 2.2.1 取得モード

| モード     | 説明                                                   | 優先順位         |
| ---------- | ------------------------------------------------------ | ---------------- |
| `rss`      | RSS / Atom フィードを取得                              | 最優先           |
| `scrape`   | HTML を CSS セレクタで抽出                             | RSS がない場合   |
| `pdf_link` | リリースページ内の PDF リンクを辿り PDF テキストを解析 | 上記と組み合わせ |

- 差分検知: `Last-Modified` / `ETag` / コンテンツハッシュ。
- スケジュール: **30 分間隔** で全ソースをラウンドロビン処理(後述の Vercel 無料枠制約に合わせチャンク化)。
- 同一ホストへは 1 並列・1〜3 秒の sleep。
- `User-Agent`: `PressNoteBot/0.1 (+https://<deploy-host>/about)`。
- `robots.txt` を取得し Disallow パスはスキップ(`crawl_logs` に「robots block」で記録)。

#### 2.2.2 PDF 取得

- `unpdf` (Edge / Node 両対応) を採用。`pdfjs-dist` フォールバック。
- 20MB 超 / 100 ページ超は処理をスキップし管理ダッシュボードに警告。
- 抽出テキストは **AI 解析にのみ使用し、解析完了後に破棄**(永続化しない)。差分検知は `content_hash` のみで行う。

#### 2.2.3 AI 要約 / 単語帳登録

- **LLM**: **OpenAI `gpt-5.5`** をデフォルトとする。`OPENAI_MODEL` 環境変数で差し替え可能(`gpt-5.5` が利用不可な環境では `gpt-4o-mini` 等にフォールバック)。
- 環境変数 `OPENAI_API_KEY` 必須。
- 入力: タイトル + 取得本文(HTML タグ除去後、最大 8000 文字までトリム)。
- Structured Outputs (`response_format: { type: "json_schema" }`) で固定スキーマ:

  ```json
  {
    "summary_short": "100文字程度の要約",
    "summary_long": "300文字程度の詳細要約",
    "words": [{ "word": "単語", "reading": "読み(可能な場合)", "meaning": "記事文脈に依存しない独立した意味", "tags": ["業界タグ"] }],
    "tags": ["業界タグ", "..."]
  }
  ```

- 同一リリースに対して 1 度のみ実行(`articles.ai_processed_at` が NULL の行のみ対象)。失敗時は最大 3 回の指数バックオフ。
- LLM 呼び出しは Zod でスキーマ検証してから保存。
- **出力言語**: 入力が英語など日本語以外であっても、`summary_short` / `summary_long` / `words[].meaning` は **常に日本語** で生成する(プロンプトで強制)。元の `title` は原文のまま保持する(UI で原文タイトルを表示)。
- **タグ語彙制約**: `tags` は §17.2 の固定タグ辞書からのみ最大 3 件を選ぶようプロンプトで指示。辞書外を返したらサーバー側で除外する。
- **単語帳登録**:
  - 記事解析時に、読者が理解に詰まりやすい業界用語・略語・技術名・規格名・固有サービス名を `words` として抽出する。
  - 各単語は `word` / `reading`(可能であれば) / `meaning` / `tags` を持つ。
  - `meaning` はその記事の内容を加味せず、単語単体で読める独立した定義にする。
  - 既に登録済みかどうかは `words.word` の完全一致で検索する。同じ単語で別の意味というケースは v1 では考慮しない。
  - 既存単語が見つかれば単語本体は更新せず、記事との紐付け(`article_words`)だけを追加する。新規単語の場合のみ `words` に登録する。
  - 単語帳ページでは各単語に紐づく記事のうち、最新 3 件のみを表示する。

#### 2.2.4 重複検知

- `(source_id, source_item_id)` ユニーク制約。
- `source_item_id` 候補:
  1. RSS の `<guid>` / Atom の `<id>`
  2. 詳細ページの正規 URL (`<link rel="canonical">`)
  3. URL + タイトルの SHA-256
- 同一 URL の更新(再公開)は `updated_at` を進めるが新規通知扱いにしない。本文差分 30% 以上で再 AI 解析(切替可)。

#### 2.2.5 ヘルスチェック / セレクタ崩壊検知

- 各ソースに `health` 状態(`ok` / `degraded` / `down`)を持つ。
- 判定ルール:
  - 直近 3 回連続で `crawl_logs.items_found = 0` かつ前回成功時に > 0 だった → `degraded`。
  - 直近 3 回連続で `crawl_logs.status = 'error'` → `down`。
  - 1 回でも `items_found > 0` または `status = 'ok'` が返れば `ok` に復帰。
- `degraded` / `down` になった瞬間に **管理者向け Web Push** を 1 回送る(後述 §2.3.1 で管理者購読を別管理)。
- 管理画面ダッシュボードでも赤バッジで一覧化。一般ユーザー向けの通知には含めない。

#### 2.2.6 法令・運用上の配慮

- 取得は公開情報のみ。ログインや CAPTCHA を要するページは対象外。
- `robots.txt` / `noindex` / `Crawl-delay` を尊重。
- 利用規約上スクレイピング禁止のサイトは登録時に管理画面で警告し無効化を推奨。
- 同一ホストへは 30 分間隔・最低 1 秒の sleep。
- AI 要約 + 抜粋(引用範囲)のみ表示し、必ず本家リンクを併記(著作権法 32 条の引用要件を満たす形)。
- `crawl_logs` を 90 日保持。苦情時の調査根拠とする。
- サイト説明ページ `/about` を公開し、収集方針とサービス概要を明示。

#### 2.2.7 `robots.txt` キャッシュ

- ホスト単位で **24 時間** のサーバープロセス内メモリキャッシュ(LRU、容量 256 ホスト)を持つ。期限切れまたはエビクション時に再取得。DB には保存しない。

### 2.3 管理画面

#### 2.3.1 認証

- **単一の管理者パスワード**。
  - 環境変数 `ADMIN_PASSWORD` と照合。
  - 成功時 HTTP-only / Secure / SameSite=Lax な署名付きセッション Cookie を 7 日有効で発行 (`iron-session`)。
  - レート制限: 同一 IP から 5 回連続失敗で 15 分ロック(`admin_login_attempts` で管理)。
- 全 `/admin/*` ルートと `/api/admin/*` を Next.js middleware で保護。
- **管理者通知購読**: 管理画面にも Web Push 購読ボタンを置き、`push_subscriptions.role = 'admin'` で識別。ソースが `degraded` / `down` に落ちた瞬間に管理者購読へだけ通知を送る(一般ユーザー購読は `role = 'user'`)。

#### 2.3.2 ソース登録ウィザード

1. **URL 入力**: 管理者が監視したい URL を貼り付け。
2. **AI 解析**: サーバーが URL を取得し、LLM に渡して以下を判定:
   - RSS / Atom リンク (`<link rel="alternate">`) の有無
   - 一覧ページかリリース本体か
   - PDF リンクの主体率
   - 推奨抽出方式 (`rss` / `scrape` / `pdf_link`)
   - 推奨 CSS セレクタ(タイトル, 公開日, 本文, リンク, PDF リンク)
   - LLM レスポンスは JSON スキーマで強制。
3. **プレビュー**: 推奨セレクタで実際に抽出した直近 5 件をテーブル表示。
4. **編集 + 保存**: セレクタ / フィールドマッピング / 企業名 / ロゴ / 頻度を確認・修正して保存。
   - **ロゴ自動取得**: 入力 URL から `https://www.google.com/s2/favicons?domain=<host>&sz=128` を初期値としてセット。管理者は任意の URL に上書き可能(Supabase Storage は使わず外部参照)。
   - **初期バックフィル**: 既定では「登録時点以降の新着のみ」を対象とする。ウィザード最終ステップに「直近 N 件を初期取り込み(0〜20、既定 0)」入力欄を置き、設定値ぶんだけ即時取得 → AI 解析する。
5. **テスト実行**: 「今すぐ取得テスト」ボタンで 1 回取得 → AI 要約まで通す。失敗ログを表示。

#### 2.3.3 ソース管理

- 一覧: 企業名 / モード / 最終取得時刻 / 直近 7 日の検知件数 / 失敗件数 / `health` バッジ / 有効トグル。
- 個別編集: セレクタ / スケジュール / 有効無効 / 「再取得 + 再 AI 解析」ボタン(本文を再取得し AI 解析をやり直す)。
- 削除: 論理削除 (`deleted_at`)、関連記事は残置。

#### 2.3.4 記事モデレーション

- 記事一覧画面(管理画面)から個別記事を **1 クリックで非公開化**(`articles.hidden_at` を立てる)。
- 公開 API は `hidden_at IS NULL` でフィルタするため、非公開化は即座に反映。
- 誤検知 / 企業からの削除要請 / 重複 などのユースケースを想定。

#### 2.3.5 単語帳管理

- 管理画面から単語を **追加 / 編集 / 削除** できる。
- 編集対象: `word` / `reading` / `meaning` / `tags`。
- `word` は一意。既存単語と同一の `word` は登録できない。
- `tags` は §17.2 の固定タグ辞書から選ぶマルチセレクト UI とし、記事解析時と同じく最大 3 件まで登録できる。
- 削除は論理削除 (`words.deleted_at`) とし、既存記事との紐付けは監査のため保持する。
- 記事との紐付けは `article_words` で管理し、AI 解析時に自動追加する。管理画面では紐付く記事数と最新記事を確認できる。

#### 2.3.6 ダッシュボード

- 24h / 7d の処理状況: 取得件数 / AI 成功率 / 平均処理時間 / エラー Top 5。
- 通知購読者数。
- ストレージ使用量(Supabase Free 枠の使用率を可視化、警告ライン 80%)。

### 2.4 公開 API(読み取りのみ)

- `GET /api/articles?date=YYYY-MM-DD&source=...&q=...&cursor=...`
- `GET /api/articles/:id`
- `GET /api/sources`
- `GET /api/words`
- いずれも認証不要・キャッシュ可能 (`s-maxage=60, stale-while-revalidate=300`)。

---

## 3. 非機能要件

| 区分             | 要件                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| パフォーマンス   | トップページ TTFB < 800ms、LCP < 2.5s on 4G。10〜30 同時アクセスで安定稼働。                                                                      |
| スケーラビリティ | 監視ソース数 ~50 / 1 日の記事数 ~200 を無料枠で運用可能とする。超過時のスケール方針は §11 を参照。                                                |
| 信頼性           | クロールジョブは冪等。失敗してもデータが壊れない(トランザクション + ユニーク制約)。                                                               |
| セキュリティ     | OWASP Top 10 を意識。XSS は React の自動エスケープ + 保存時サニタイズ。SQLi は Supabase クライアント経由で防止。管理 API は middleware 保護必須。 |
| 可観測性         | 主要処理に構造化ログ(pino)。Vercel Logs に集約。`crawl_logs` テーブルで監査。                                                                     |
| プライバシー     | 個人情報を扱わない。アナリティクスは導入しない。サーバーログは 30 日で削除。                                                                      |
| アクセシビリティ | WCAG 2.1 AA を努力目標。コントラスト比 4.5:1 以上、ランドマーク、キーボード操作対応。                                                             |
| 国際化           | 日本語 UI のみ。文言は i18n キー化し後日対応可能に。                                                                                              |
| 法令遵守         | §2.2.5 を遵守。                                                                                                                                   |

---

## 4. 技術スタック (無料枠厳守 / LLM のみ有料)

| レイヤ           | 採用                                                               | 無料枠の制約 / 注意                                                                                                                          |
| ---------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| フレームワーク   | **Next.js 15 (App Router) + React 19 + TypeScript**                | —                                                                                                                                            |
| UI               | **Tailwind CSS** + **shadcn/ui** (Radix ベース) + **lucide-react** | —                                                                                                                                            |
| ホスティング     | **Vercel Hobby (無料)**                                            | 関数タイムアウト **10s**、Cron は **日次のみ**、帯域 100GB/月。**長時間処理はチャンク化**、**スケジューラは Vercel Cron を使わない**。       |
| DB               | **Supabase Free**                                                  | Postgres 500MB / 2GB egress / 50K MAU。`articles` 本文は Storage に逃がす。                                                                  |
| ストレージ       | (不使用)                                                           | `raw_text` を持たないため Supabase Storage は採用しない。ロゴ画像は外部 URL 参照のみ。                                                       |
| **スケジューラ** | **Supabase `pg_cron` + `pg_net`**                                  | `pg_cron` で 10 分 / 30 分 / 日次ジョブを起こし、`pg_net.http_post` で Vercel の API Route を叩く構成。Vercel Hobby の Cron 日次制限を回避。 |
| Web Push         | **`web-push`** (Node) + VAPID 鍵                                   | 完全無料。                                                                                                                                   |
| HTML 解析        | **`cheerio`** + **`@mozilla/readability`**                         | —                                                                                                                                            |
| PDF 解析         | **`unpdf`**                                                        | Edge / Node 両対応。                                                                                                                         |
| AI クライアント  | **`openai`** 公式 SDK / モデル `gpt-5.5` (環境変数で上書き可)      | **LLM のみ有料**。                                                                                                                           |
| 認証             | **`iron-session`**                                                 | —                                                                                                                                            |
| バリデーション   | **Zod**                                                            | API 入出力 / LLM 出力 / 環境変数。                                                                                                           |
| テスト           | **Vitest** + **Playwright**                                        | —                                                                                                                                            |
| Lint / Format    | ESLint + Prettier + TypeScript strict + lint-staged                | —                                                                                                                                            |
| ロガー           | pino                                                               | —                                                                                                                                            |
| CI               | **GitHub Actions** (無料枠)                                        | type-check / lint / test / Playwright を PR 毎に実行。                                                                                       |
| CD               | Vercel Git Integration                                             | `main` → production、他 → preview。                                                                                                          |

### 4.1 Vercel Hobby 制約への対処

- **関数 10 秒**: 1 リクエストで処理するソース数を最大 3 に絞り、残りは次の cron tick に持ち越す。各 HTTP 取得は 5 秒タイムアウト。
- **Cron 日次制限**: Vercel Cron を使わず、**Supabase `pg_cron`** が `pg_net.http_post` で Vercel API を呼ぶ方式に統一。
- **帯域 100GB/月**: 画像はロゴ程度。OG 画像は静的生成、`raw_text` はクライアントへ送らない。

---

## 5. データモデル (Supabase / Postgres)

> `id` は `uuid default gen_random_uuid()`、全テーブルに `created_at`, `updated_at`。

### `sources`

| col               | type                 | note                                       |
| ----------------- | -------------------- | ------------------------------------------ |
| id                | uuid PK              |                                            |
| name              | text                 | 表示用企業名                               |
| site_url          | text                 | トップ URL                                 |
| feed_url          | text nullable        | RSS/Atom URL                               |
| mode              | text                 | `rss` / `scrape` / `pdf_link`              |
| selector_config   | jsonb                | CSS セレクタ等                             |
| schedule_minutes  | int default 30       | 取得間隔(分)                               |
| logo_url          | text nullable        | 既定値は Google s2 favicons から自動セット |
| enabled           | bool default true    |                                            |
| health            | text default 'ok'    | `ok` / `degraded` / `down`                 |
| consecutive_empty | int default 0        | items_found=0 連続回数                     |
| consecutive_error | int default 0        | status=error 連続回数                      |
| last_crawled_at   | timestamptz nullable |                                            |
| deleted_at        | timestamptz nullable | 論理削除                                   |

### `articles` (永続保持、本文は保持しない)

| col                                | type                 | note                                                           |
| ---------------------------------- | -------------------- | -------------------------------------------------------------- |
| id                                 | uuid PK              |                                                                |
| source_id                          | uuid FK              |                                                                |
| source_item_id                     | text                 | dedup key                                                      |
| title                              | text                 |                                                                |
| url                                | text                 | 一次情報 URL **(永続)**                                        |
| pdf_url                            | text nullable        |                                                                |
| published_at                       | timestamptz nullable | 取得元の公開日時                                               |
| detected_at                        | timestamptz          | 検知日時                                                       |
| content_hash                       | text                 | 差分検知用 (本文の SHA-256 のみ保持。本文そのものは保持しない) |
| ai_processed_at                    | timestamptz nullable |                                                                |
| summary_short                      | text nullable        | **永続** ≤120 chars                                            |
| summary_long                       | text nullable        | **永続** ≤400 chars                                            |
| tags                               | jsonb nullable       | **永続** `[string]`、§17.2 の固定辞書から最大 3 件             |
| hidden_at                          | timestamptz nullable | 非公開化(モデレーション)                                       |
| unique (source_id, source_item_id) |                      |                                                                |

> **保持ポリシー**: 上記カラムはすべて **永続**。本文 (`raw_text`) は保持せず、AI 解析が完了した時点で破棄する。詳細を読みたいユーザーは `url` / `pdf_url` から本家へ遷移する。

### `words`

| col        | type                 | note                                     |
| ---------- | -------------------- | ---------------------------------------- |
| id         | uuid PK              |                                          |
| word       | text unique          | 登録済み判定キー。同一語の別意味は扱わない |
| reading    | text nullable        | 読み。AI が推定できる場合のみ登録         |
| meaning    | text                 | 記事文脈に依存しない独立した定義          |
| tags       | text[]               | §17.2 の固定辞書から最大 3 件             |
| deleted_at | timestamptz nullable | 論理削除                                 |

### `article_words`

| col        | type    | note                         |
| ---------- | ------- | ---------------------------- |
| article_id | uuid FK |                              |
| word_id    | uuid FK |                              |
| primary key (article_id, word_id) | | 同一記事への重複紐付け防止 |

### `push_subscriptions`

| col               | type                 | note                              |
| ----------------- | -------------------- | --------------------------------- |
| id                | uuid PK              |                                   |
| endpoint          | text unique          |                                   |
| origin            | text                 | 再購読の論理一意キーに使用        |
| p256dh            | text                 |                                   |
| auth              | text                 |                                   |
| role              | text default 'user'  | `user` / `admin`                  |
| timezone          | text                 | IANA TZ                           |
| notify_local_time | text                 | `HH:MM` (`:00` または `:30` のみ) |
| last_notified_on  | date nullable        | 同日二重配信防止                  |
| disabled_at       | timestamptz nullable |                                   |

### `crawl_logs` (90 日で削除)

| col         | type                 | note                       |
| ----------- | -------------------- | -------------------------- |
| id          | uuid PK              |                            |
| source_id   | uuid FK              |                            |
| started_at  | timestamptz          |                            |
| finished_at | timestamptz nullable |                            |
| status      | text                 | `ok` / `error` / `skipped` |
| http_status | int nullable         |                            |
| message     | text nullable        |                            |
| items_found | int                  |                            |
| items_new   | int                  |                            |

### `admin_login_attempts` (30 日で削除)

| col          | type        | note |
| ------------ | ----------- | ---- |
| id           | uuid PK     |      |
| ip           | text        |      |
| attempted_at | timestamptz |      |
| success      | bool        |      |

### Row Level Security

- anon ロールは `articles(hidden_at IS NULL)` / `sources(enabled=true, deleted_at IS NULL)` / `words(deleted_at IS NULL)` / `article_words` の `SELECT` のみ許可。
- 書き込みはすべて service role キー経由 (サーバーのみ保持)。

### データ保持まとめ

| 対象                                                   | 保持期間                        |
| ------------------------------------------------------ | ------------------------------- |
| 記事 URL / AI 要約 / 単語帳 / タグ / タイトル / 公開日時 | **無期限(永続)**                |
| 記事本文 (`raw_text`)                                  | **保持しない**(AI 解析後に破棄) |
| `crawl_logs`                                           | 90 日                           |
| `admin_login_attempts`                                 | 30 日                           |
| サーバーログ (Vercel)                                  | 30 日                           |

---

## 6. アーキテクチャ

```txt
[ ブラウザ ]
   |  HTTPS
   v
[ Vercel Hobby (Next.js App Router) ] ----- OpenAI API (gpt-5.5)
   |
   |  service role
   v
[ Supabase Postgres ]
   |
   |  pg_cron (毎10分 / 毎30分 / 日次)
   v
[ pg_net.http_post ] --HMAC署名+CRON_SECRET--> Vercel API Route
                                                  ├─ /api/cron/crawl   (毎 10 分: 3 ソースずつ)
                                                  ├─ /api/cron/ai      (毎 10 分: 未処理 5 件)
                                                  ├─ /api/cron/notify  (毎 30 分: HH:00 / HH:30)
                                                  └─ /api/cron/prune   (日次 03:00 UTC)

[ Web Push ] <----- /api/cron/notify から配信
```

- **スケジューラ責務は Supabase 側**(`pg_cron` + `pg_net`)。Vercel は HTTP リクエストを受けて処理するだけのステートレス Function。
- Cron リクエストは `X-Cron-Secret` ヘッダ + HMAC で認証。漏えい対策として 5 分以上ずれた `X-Cron-Timestamp` を拒否。
- 1 リクエスト 10 秒を超えない設計:
  - `crawl`: 1 tick につき最大 3 ソース。各取得 5 秒タイムアウト。
  - `ai`: 1 tick につき未処理 5 件。LLM の応答待ち含め 9 秒以内。
  - `notify`: 1 tick で当該 30 分枠の対象購読者を全配信(キュー処理。エラーは個別ログ)。
  - `prune`: `crawl_logs` (90 日超) と `admin_login_attempts` (30 日超) を 1000 件ずつ削除。続行が必要なら次日に持ち越し。

---

## 7. API 設計 (抜粋)

### 公開 (anon)

| Method | Path                    | 概要                                                        |
| ------ | ----------------------- | ----------------------------------------------------------- |
| GET    | `/api/articles`         | 一覧 (date / source / q / cursor)                           |
| GET    | `/api/articles/:id`     | 単体                                                        |
| GET    | `/api/sources`          | 公開ソース一覧                                              |
| GET    | `/api/words`            | 単語帳一覧。各単語の紐付き記事は最新 3 件のみ返す           |
| POST   | `/api/push/subscribe`   | Web Push 登録 (endpoint, keys, timezone, notify_local_time) |
| POST   | `/api/push/unsubscribe` | 解除                                                        |
| POST   | `/api/push/preferences` | 通知時刻の更新                                              |

### 管理 (要セッション)

| Method | Path                          | 概要                         |
| ------ | ----------------------------- | ---------------------------- |
| POST   | `/api/admin/login`            | パスワード認証 → Cookie 発行 |
| POST   | `/api/admin/logout`           | Cookie 破棄                  |
| POST   | `/api/admin/sources/analyze`  | URL を AI 解析し抽出案を返す |
| POST   | `/api/admin/sources`          | 新規ソース登録               |
| PATCH  | `/api/admin/sources/:id`      | 編集                         |
| DELETE | `/api/admin/sources/:id`      | 論理削除                     |
| POST   | `/api/admin/sources/:id/test` | テスト取得 + AI 解析         |
| GET    | `/api/admin/words`            | 単語帳一覧                   |
| POST   | `/api/admin/words`            | 単語追加                     |
| PATCH  | `/api/admin/words/:id`        | 単語編集                     |
| DELETE | `/api/admin/words/:id`        | 単語論理削除                 |
| GET    | `/api/admin/dashboard`        | 統計                         |

### Cron (Supabase pg_cron → Vercel、`X-Cron-Secret` で保護)

| Method | Path               | スケジュール (pg_cron)          |
| ------ | ------------------ | ------------------------------- |
| POST   | `/api/cron/crawl`  | `*/10 * * * *`                  |
| POST   | `/api/cron/ai`     | `*/10 * * * *`                  |
| POST   | `/api/cron/notify` | `0,30 * * * *` (毎時 :00 / :30) |
| POST   | `/api/cron/prune`  | `0 18 * * *` (= JST 03:00)      |

すべての API は Zod でリクエスト / レスポンスを検証する。

---

## 8. デザインシステム (モック準拠)

参照: `assets/dev/mockup.png`

### 8.1 トーン & マナー

- 業務 SaaS ダッシュボード調。**白基調 + ブルー差し色**、薄い境界線、角丸 8〜12px のソフトなカード。
- 情報量は多いが、行間と余白で読みやすさを担保。

### 8.2 レイアウト

- **デスクトップ (≥1024px)**: 3 ペイン (左ナビ 72px / 中央可変 / 右ウィジェット 280px)。
- **タブレット (768–1023px)**: 2 ペイン (左ナビ + 中央)、右ウィジェットは下部にスタック。
- **モバイル (<768px)**: 1 カラム。左ナビはハンバーガーで開閉、右ウィジェットは下部。
- 中央コンテンツ最大幅 1080px。

### 8.3 カラーパレット (Tailwind カスタム)

| トークン         | 用途          | 値 (目安) |
| ---------------- | ------------- | --------- |
| `bg/base`        | アプリ背景    | `#F7F9FC` |
| `bg/surface`     | カード        | `#FFFFFF` |
| `border/subtle`  | 境界線        | `#E5EAF2` |
| `text/primary`   | 本文          | `#0F172A` |
| `text/secondary` | 補助          | `#475569` |
| `accent/primary` | ブランド      | `#2563EB` |
| `accent/soft`    | バッジ背景    | `#DBEAFE` |
| `success`        | RSS バッジ等  | `#10B981` |
| `warning`        | SCRAPE バッジ | `#F59E0B` |
| `danger`         | エラー        | `#EF4444` |

ダークモード対応は v1 ではスコープ外(後日)。

### 8.4 タイポグラフィ

- 日本語: `Inter` + `Noto Sans JP`、フォールバック `system-ui`。
- スケール: 12 / 14 / 16 / 18 / 20 / 24 / 32px。
- 本文 14px / 行高 1.6。タイトル 18〜20px / 1.4。

### 8.5 コンポーネント (shadcn/ui ベース)

- `Card` / `Badge` / `Chip` / `Avatar` / `Button` / `Dialog` / `Tabs` / `Pagination` / `Skeleton` / `Toast` / `Tooltip` / `DropdownMenu`。
- `PressCard`、`NavRail`、`WidgetPanel`、`SourceLogo` は独自コンポーネント。

### 8.6 画面一覧

- `/` トップ (今日のプレスリリース) — モック通り。
- `/articles/:id` 詳細。
- `/companies` 企業一覧 (将来)。初期はサイドナビからリンクのみ。
- `/terms` 単語帳。AI が登録した単語・読み・意味・タグを表示し、各単語に紐づく最新記事 3 件を表示。
- `/settings` ユーザー向け通知時刻設定。
- `/about` サイト説明ページ。
- `/admin/login` ログイン。
- `/admin` ダッシュボード。
- `/admin/sources` ソース一覧。
- `/admin/sources/new` 登録ウィザード。
- `/admin/sources/:id` 編集。
- `/admin/words` 単語帳管理。

---

## 9. テスト戦略

### 9.1 ユニット (Vitest)

- HTML 抽出 / 重複判定 / 日付正規化 / AI レスポンス検証 (Zod) / RSS パーサ / `notify` の時刻マッチング。
- カバレッジ目標 **80%**。

### 9.2 統合

- API route handler を Supabase ローカル(`supabase` CLI)で叩く。

### 9.3 E2E (Playwright、Preview デプロイに対して実行)

1. トップ描画 / 一覧表示。
2. 詳細から本家リンクへの遷移。
3. 通知購読フロー (Service Worker をモック)。
4. 管理者ログイン → ソース登録ウィザード → 一覧反映。
5. 認証なしで `/admin` にアクセスするとログインへリダイレクト。

### 9.4 外部依存

- OpenAI API は `msw` でモック化。
- Supabase は GitHub Actions 内で `supabase` CLI を起動。

---

## 10. CI / CD

### 10.1 GitHub Actions (必須)

- ワークフロー `ci.yml`:
  - トリガ: `pull_request`, `push: main`。
  - jobs:
    1. `install` (pnpm + cache)
    2. `lint` (`pnpm lint`)
    3. `typecheck` (`pnpm typecheck`)
    4. `test` (`pnpm test --coverage`)
    5. `e2e` (`pnpm playwright test`、Vercel Preview Deploy 完了後)
  - すべて green でないと merge 不可 (branch protection)。
- ワークフロー `db.yml`:
  - `supabase/migrations/**` 変更時に `supabase db push --linked` を実行(prod は手動承認)。

### 10.2 デプロイ

- Vercel Git Integration:
  - `main` → Production
  - 他ブランチ → Preview
- 環境変数 (Vercel + GitHub Secrets):
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL` (デフォルト `gpt-5.5`)
  - `NEXT_PUBLIC_APP_URL`
  - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `ADMIN_PASSWORD` / `SESSION_PASSWORD` (32 文字以上)
  - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`
  - `CRON_SECRET` (Supabase 側にも保存)

### 10.3 マイグレーション

- `supabase/migrations/` に SQL を置き PR で履歴管理。
- 初期マイグレーションで `pg_cron` / `pg_net` 拡張を有効化し、上記スケジュールを登録する SQL を含める。

---

## 11. 無料枠と将来のスケール

| 指標          | Supabase Free | Vercel Hobby | 想定使用                                       |
| ------------- | ------------- | ------------ | ---------------------------------------------- |
| DB 容量       | 500MB         | —            | 記事 1 行 ~2KB × 永続 → 25 万件で 500MB に到達 |
| Storage       | 不使用        | —            | `raw_text` を保持しないため Storage は使わない |
| Egress        | 2GB / 100GB   | 100GB        | 読取 30 人 / 日想定で余裕                      |
| Function 時間 | —             | 100GB-Hours  | チャンク化で十分                               |

- **超過時のスケール手順**:
  1. `crawl_logs` の保持期間を 90 → 30 日に短縮。
  2. それでも厳しければ Supabase Pro ($25/月) に切替。
  3. Vercel Cron が必要になった段階で Pro に上げる(`pg_cron` 不要化)。

### 11.1 AI コスト見積もり (gpt-5.5、仮定)

- 想定: **200 記事 / 日 × 30 日 = 6,000 記事 / 月**。
- 1 記事あたり 入力 ~4,000 tok + 出力 ~600 tok = 約 4,600 tok。
- 月間トークン: ~2,760 万 tok / 月。
- 単価は契約により変動するため SPEC では固定しないが、**月予算上限を環境変数 `OPENAI_DAILY_BUDGET_TOKENS` (例: 1,000,000) で設定**し、ジョブ実行ごとに当日消費 tok を `crawl_logs` 集計で確認、超過分は翌日まで AI キュー待ちにする。
- ソース解析 (ウィザード) は 1 回 ~6,000 tok 程度。頻度が低いので予算には含めない。

---

## 12. ロギング / 監視

- pino で構造化ログ。trace_id をリクエストごとに付与。
- Vercel Logs に集約。失敗多発は管理ダッシュボードで可視化。

---

## 13. 開発フロー

1. Issue ベースで作業 (GitHub Issues)。
2. ブランチ命名: `feat/...`, `fix/...`, `chore/...`。
3. PR テンプレートにテスト計画とスクリーンショット必須。
4. `main` ブランチは GitHub branch protection で保護:
   - **PR 必須**(直 push 禁止)
   - **CI green 必須**
   - **1 approve 必須**(セルフ approve 可、1 人運用前提)
5. main マージ後 Vercel が自動 production デプロイ。

### 13.1 リポジトリ運用

- **Private repository** 前提(社内利用)。
- ライセンスファイルは置かない(公開予定なし)。

---

## 14. マイルストーン (推奨)

| フェーズ           | 内容                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| M1: 骨組み         | Next.js / Supabase / Vercel セットアップ、認証、CI/CD、空のトップ・管理画面、`pg_cron`/`pg_net` 配線 |
| M2: 収集基盤       | RSS / Scrape / PDF パイプライン、`articles` 保存、重複検知、`crawl_logs`、チャンク化処理             |
| M3: AI 解析        | OpenAI `gpt-5.5` 連携、要約・単語帳登録・タグ保存、再試行                                            |
| M4: 読み取り UI    | モック準拠の 3 ペイン、一覧/詳細/検索/フィルタ、モバイル対応                                         |
| M5: 通知           | Web Push、30 分単位時刻設定、`notify` を毎時 :00 / :30 で cron                                       |
| M6: 管理ウィザード | URL → AI 解析 → セレクタ提案 → プレビュー → 保存                                                     |
| M7: 仕上げ         | アクセシビリティ、ダッシュボード、保持期間ジョブ、E2E 拡充                                           |

> **初期登録企業**: ローンチ時の企業リストは Codex 側では用意しない。プロダクトオーナー(運用者)が M6 完了後に管理画面から手動で 5〜10 社を登録する前提とする。

---

## 15. 既知のリスク / 留意点

- スクレイピング先のサイト構造変更で抽出が壊れる → `crawl_logs` のエラー多発をダッシュボードで早期検知 + 管理者へ通知。
- LLM の出力ばらつき → JSON スキーマ強制 + Zod 検証 + リトライ。
- `gpt-5.5` が当該リージョン/契約で利用不可な場合 → `OPENAI_MODEL` で `gpt-4o-mini` 等に切替。
- Vercel Hobby の関数 10 秒上限 → チャンク化で対処、ジョブが詰まる場合は cron 頻度を上げて吸収。
- `pg_cron` / `pg_net` は Supabase 側で拡張有効化が必要 → 初期マイグレーション SQL に含める。
- 永続保存の容量見積もり → §11 参照。25 万記事で DB 500MB なので、その手前で Pro 検討。
- 本文を保持しないため、AI 解析の再実行はできない(やり直したい場合は本家から再取得が必要)。要約品質に問題があった場合の対処として、管理画面の「再取得 + 再 AI 解析」ボタンを用意する。

---

## 16. 用語

- **ソース**: 監視対象のサイト or フィード (1 行 = 1 ソース)。
- **記事 (article)**: 1 件のプレスリリース。
- **取得モード**: `rss` / `scrape` / `pdf_link`。
- **単語帳**: AI 解析または管理画面で登録される `word` / `reading` / `meaning` / `tags` を持つ語彙。記事とは `article_words` で紐づく。
- **AI 解析**: 要約 + 単語帳登録 + タグ抽出の一連処理。

---

## 17. 付録

### 17.1 AI プロンプト草案

#### 記事要約 / 用語抽出 / タグ付け (`/api/cron/ai` 内部処理)

**system プロンプト**:

```txt
あなたは日本語のビジネスニュース編集者です。与えられたプレスリリース本文を読み、
以下の制約を守って JSON で要約・単語帳候補・タグを返してください。

【出力ルール】
- 出力は必ず日本語(常体ではなく「です・ます」も使わず、中立的な常体「〜である」「〜した」)。
- 入力が英語などの場合も、要約・単語帳候補の意味は日本語に翻訳して書く。
- 数字・固有名詞(企業名・製品名・サービス名・人名)は原文の表記をそのまま残す。
- 推測や誇張はしない。本文に書かれていない事実を書かない。

【summary_short】
- 100 文字程度 (最大 120 文字)。誰が何を発表したか / 何の数値変化か、を 1〜2 文で。

【summary_long】
- 300 文字程度 (最大 400 文字)。背景・目的・主要な数値・今後の予定を簡潔に。

【words】
- 読者が「ググりたくなる」業界用語・略語・技術名・規格名・固有のサービス名を最大 5 件。
- 一般語(会社、発表、市場、など)は含めない。
- 各単語は word / reading / meaning / tags を返す。
- reading は可能な場合のみ返す。推定が難しい場合は空文字または省略する。
- meaning は 1〜2 文で、記事の文脈に依存しない独立した定義として説明する。記事内での用途や今回の発表内容を混ぜない。
- tags は後述の固定タグ辞書の中から、その単語自体に合うものを最大 3 件選ぶ。

【tags】
- 後述の固定タグ辞書の中から、本文の主題に合うものを最大 3 件選ぶ。
- 辞書外の語を返してはならない。該当が無ければ空配列。
```

**user プロンプト** (テンプレート):

```txt
# 固定タグ辞書
{TAGS_VOCABULARY_JSON}

# タイトル
{ARTICLE_TITLE}

# 本文
{ARTICLE_BODY_MAX_8000_CHARS}
```

**response_format** は §2.2.3 の JSON Schema を `json_schema` モードで強制。

#### ソース解析 (`/api/admin/sources/analyze`)

**system プロンプト**:

```txt
あなたは Web スクレイピングの設定アシスタントです。与えられた HTML から
プレスリリース一覧として扱えるかを判定し、抽出方法を JSON で提案してください。

【判定項目】
- mode: "rss" / "scrape" / "pdf_link" のいずれか。RSS/Atom リンクがあれば最優先。
- feed_url: RSS/Atom が見つかった場合の URL。
- selectors: scrape モード時、{item, title, url, published_at, body, pdf_link} の CSS セレクタ。
- confidence: 0.0〜1.0。
- notes: 人間が確認すべき注意点(例: ログイン必須、規約上スクレイピング禁止と明記、など)。
```

### 17.2 固定タグ辞書 (v1)

タグはこの 24 件から選ぶ。新規追加は管理画面の「タグ辞書」編集 UI から(M7 以降)。

```txt
AI / 機械学習
クラウド / SaaS
セキュリティ
半導体 / ハードウェア
モバイル / アプリ
Web / フロントエンド
データ / アナリティクス
通信 / 5G
ロボティクス
自動車 / モビリティ
製造業
ヘルスケア / 医療
バイオ / 創薬
金融 / フィンテック
小売 / EC
広告 / マーケティング
メディア / エンタメ
ゲーム
教育
人事 / HR
ESG / サステナビリティ
資金調達 / IPO
M&A / 提携
人事異動 / 組織変更
```

サーバー側は LLM 出力タグを上記リスト(完全一致)でフィルタし、辞書外は破棄する。
