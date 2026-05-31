# DESIGN.md

## 1. Design Direction

このデザインシステムは、情報閲覧型 Web アプリケーション向けの **Glassmorphism Minimal** UI を定義する。

目的は、日常的に読む画面を「軽く、静かに、読みやすく」保ちながら、半透明パネル・淡いグラデーション・控えめなブルー/パープルのアクセントで、現代的な印象を与えること。

特定サービス専用ではなく、以下のようなプロダクトに再利用できる。

- ニュース / 記事一覧
- ダッシュボード
- ナレッジベース
- 通知・レポート系 SaaS
- 社内ポータル
- AI 要約 / 情報収集ツール

---

## 2. Principles

### 2.1 Calm First

画面全体は、視覚的な主張よりも読解負荷の低さを優先する。

- 背景は淡いグラデーション
- 強い原色は使わない
- 影は薄く、境界線は柔らかく
- テキストの可読性を最優先する

### 2.2 Glass, Not Decoration

グラス表現は装飾ではなく、情報の階層化に使う。

- ヘッダー、通知バナー、カードなどの主要面に限定する
- 透明度を上げすぎない
- 背景が透けても文字のコントラストを損なわない
- blur は控えめにする

### 2.3 Reading Rhythm

一覧画面では、カードの密度よりも読み進めるリズムを重視する。

- 1 カード 1 トピック
- 見出し、メタ情報、本文、アクションを一定の順序で配置
- カード間の余白を十分に取る
- 主要 CTA は 1 画面に多く置きすぎない

### 2.4 Responsive by Default

デスクトップでは横幅を活かし、スマホでは縦方向に自然に積む。

- PC: 最大幅を制限して読みやすくする
- タブレット: 余白を圧縮しすぎない
- スマホ: 1 カラム前提
- 重要アクションは右端固定に依存しない

---

## 3. Design Tokens

### 3.1 Color

#### Primitive Tokens

```css
:root {
  --color-white: #ffffff;
  --color-black: #0f172a;

  --color-slate-50: #f8fafc;
  --color-slate-100: #f1f5f9;
  --color-slate-200: #e2e8f0;
  --color-slate-400: #94a3b8;
  --color-slate-500: #64748b;
  --color-slate-700: #334155;
  --color-slate-900: #0f172a;

  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  --color-purple-500: #8b5cf6;
  --color-purple-600: #7c3aed;

  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger: #dc2626;
}
```

#### Semantic Tokens

```css
:root {
  --color-bg-page: linear-gradient(135deg, #f8fbff 0%, #eef4ff 42%, #f3ecff 100%);

  --color-bg-surface: rgba(255, 255, 255, 0.58);
  --color-bg-surface-strong: rgba(255, 255, 255, 0.76);
  --color-bg-surface-muted: rgba(248, 250, 252, 0.62);

  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #64748b;
  --color-text-inverse: #ffffff;

  --color-border-glass: rgba(255, 255, 255, 0.62);
  --color-border-subtle: rgba(148, 163, 184, 0.22);

  --color-accent-primary: #2563eb;
  --color-accent-secondary: #7c3aed;
  --color-accent-gradient: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}
```

### 3.2 Typography

日本語 UI を前提に、本文は Noto Sans JP 相当を使用する。英数字は system-ui にフォールバックする。

```css
:root {
  --font-sans: "Noto Sans JP", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

| Token | Size | Line Height | Weight | Use |
| --- | ---: | ---: | ---: | --- |
| `--text-display` | 48px | 1.15 | 700 | ページ最上位の見出し |
| `--text-heading-1` | 36px | 1.25 | 700 | 主要ページ見出し |
| `--text-heading-2` | 28px | 1.35 | 600 | セクション見出し |
| `--text-title` | 18px | 1.5 | 600 | カードタイトル |
| `--text-body` | 15px | 1.8 | 400 | 本文 |
| `--text-body-compact` | 14px | 1.7 | 400 | カード本文 |
| `--text-label` | 13px | 1.5 | 500 | メタ情報、ラベル |
| `--text-caption` | 12px | 1.5 | 400 | 補足情報 |

```css
:root {
  --text-display-size: 48px;
  --text-display-line: 1.15;
  --text-heading-1-size: 36px;
  --text-heading-1-line: 1.25;
  --text-heading-2-size: 28px;
  --text-heading-2-line: 1.35;
  --text-title-size: 18px;
  --text-title-line: 1.5;
  --text-body-size: 15px;
  --text-body-line: 1.8;
  --text-body-compact-size: 14px;
  --text-body-compact-line: 1.7;
  --text-label-size: 13px;
  --text-label-line: 1.5;
  --text-caption-size: 12px;
  --text-caption-line: 1.5;
}
```

### 3.3 Spacing

8px ベースのスペーシングを使う。

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
```

### 3.4 Radius

```css
:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
}
```

### 3.5 Shadow / Blur

影は存在感を出すためではなく、半透明面の境界を自然に見せるために使う。

```css
:root {
  --shadow-glass: 0 20px 60px rgba(15, 23, 42, 0.08);
  --shadow-card: 0 12px 36px rgba(15, 23, 42, 0.06);
  --shadow-button: 0 8px 20px rgba(37, 99, 235, 0.22);

  --blur-glass: blur(18px);
  --blur-glass-strong: blur(24px);
}
```

### 3.6 Layout

```css
:root {
  --layout-max-width: 1280px;
  --layout-content-width: 1080px;
  --layout-readable-width: 760px;

  --header-height: 72px;
  --page-padding-x-desktop: 40px;
  --page-padding-x-tablet: 28px;
  --page-padding-x-mobile: 20px;
}
```

---

## 4. Base Layout

### 4.1 Page

```css
.page {
  min-height: 100vh;
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}
```

### 4.2 Content Container

```css
.container {
  width: min(100% - 80px, var(--layout-max-width));
  margin-inline: auto;
}

@media (max-width: 834px) {
  .container {
    width: calc(100% - 48px);
  }
}

@media (max-width: 640px) {
  .container {
    width: calc(100% - 32px);
  }
}
```

---

## 5. Components

## 5.1 App Header

### Purpose

主要ナビゲーションとブランド識別を担う。画面上部に固定してもよいが、スクロール時の圧迫感を避ける。

### Structure

- 左: ロゴ + サービス名
- 右: ナビゲーションリンク
- モバイル: ナビゲーションはメニュー化または横スクロール

### Style

```css
.app-header {
  height: var(--header-height);
  margin: 16px auto 0;
  padding: 0 32px;
  border: 1px solid var(--color-border-glass);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.52);
  backdrop-filter: var(--blur-glass);
  box-shadow: var(--shadow-glass);
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.02em;
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 32px;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}
```

### Guidelines

- ヘッダー背景は完全な白にしない
- ロゴ周辺の余白は広めに取る
- ナビゲーションリンクは 3〜5 個程度まで
- 重要な CTA をヘッダーに常設しすぎない

---

## 5.2 Hero / Page Title

### Purpose

ページの目的を瞬時に伝える。

### Style

```css
.hero {
  padding-block: 56px 24px;
}

.hero__title {
  margin: 0;
  font-size: var(--text-display-size);
  line-height: var(--text-display-line);
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
}

.hero__subtitle {
  margin-top: 8px;
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .hero {
    padding-block: 40px 20px;
  }

  .hero__title {
    font-size: 34px;
    letter-spacing: -0.03em;
  }

  .hero__subtitle {
    font-size: 14px;
  }
}
```

---

## 5.3 Notification Banner

### Purpose

通知、購読、アップデートなど、軽い促進アクションを提示する。

### Structure

- 左: アイコン + メッセージ
- 右: CTA ボタン

### Style

```css
.notification-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 24px;
  border: 1px solid var(--color-border-glass);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: var(--blur-glass);
}

.notification-banner__message {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}
```

### Guidelines

- バナーは 1 画面に 1 本まで
- 常時表示する場合は淡く、閉じられる場合は右端に閉じるボタンを置く
- CTA は 1 つに絞る

---

## 5.4 Button

### Primary

```css
.button-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding-inline: 22px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-accent-gradient);
  color: var(--color-text-inverse);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-button);
}
```

### Secondary

```css
.button-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding-inline: 20px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.52);
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
}
```

### States

```css
.button-primary:hover {
  filter: brightness(1.04);
}

.button-primary:active {
  transform: translateY(1px);
}

.button-primary:focus-visible,
.button-secondary:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.28);
  outline-offset: 2px;
}
```

---

## 5.5 Content Card

### Purpose

一覧画面で 1 件の情報を読みやすく表示する。

### Structure

- アイコンまたはカテゴリ
- メタ情報
- タイトル
- 要約または説明文
- アクションアイコン

### Style

```css
.content-card {
  display: grid;
  grid-template-columns: 220px 1fr auto;
  gap: 24px;
  align-items: center;
  padding: 18px 22px;
  border: 1px solid var(--color-border-glass);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.56);
  backdrop-filter: var(--blur-glass);
  box-shadow: var(--shadow-card);
}

.content-card__meta {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.content-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(139, 92, 246, 0.1);
  color: var(--color-accent-secondary);
}

.content-card__source {
  font-size: var(--text-label-size);
  line-height: var(--text-label-line);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.content-card__time {
  margin-top: 3px;
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-line);
  color: var(--color-text-muted);
}

.content-card__body {
  min-width: 0;
  padding-left: 24px;
  border-left: 1px solid var(--color-border-subtle);
}

.content-card__title {
  margin: 0;
  font-size: var(--text-title-size);
  line-height: var(--text-title-line);
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.content-card__summary {
  margin: 4px 0 0;
  font-size: var(--text-body-compact-size);
  line-height: var(--text-body-compact-line);
  color: var(--color-text-secondary);
}

.content-card__actions {
  display: flex;
  gap: 10px;
}
```

### Action Icon

```css
.icon-button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border-glass);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.54);
  color: var(--color-accent-primary);
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.78);
}
```

### Responsive

```css
@media (max-width: 834px) {
  .content-card {
    grid-template-columns: 1fr auto;
    gap: 16px;
  }

  .content-card__meta {
    grid-column: 1 / -1;
  }

  .content-card__body {
    padding-left: 0;
    border-left: 0;
  }
}

@media (max-width: 640px) {
  .content-card {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .content-card__actions {
    justify-content: flex-end;
  }
}
```

### Guidelines

- タイトルは最大 2 行を推奨
- 要約は最大 2〜3 行を推奨
- アクションは原則 2〜3 個まで
- カード全体クリックと個別アイコンのクリック範囲が競合しないようにする

---

## 5.6 Empty State

### Purpose

データがない状態を、エラーではなく通常状態として表示する。

```css
.empty-state {
  padding: 56px 24px;
  border: 1px solid var(--color-border-glass);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.46);
  backdrop-filter: var(--blur-glass);
  text-align: center;
}

.empty-state__title {
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.empty-state__description {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-muted);
}
```

---

## 5.7 Footer

```css
.footer {
  padding-block: 36px;
  text-align: center;
  font-size: var(--text-caption-size);
  color: var(--color-text-muted);
}
```

---

## 6. Responsive Breakpoints

| Token | Width | Purpose |
| --- | ---: | --- |
| `sm` | 640px | スマホ横 / 小型タブレット |
| `md` | 834px | タブレット |
| `lg` | 1068px | 小型デスクトップ |
| `xl` | 1440px | 大型デスクトップ |

---

## 7. Accessibility

### 7.1 Contrast

- 本文テキストは背景に対して十分なコントラストを確保する
- 半透明カード上では `--color-text-primary` と `--color-text-secondary` を基本にする
- 装飾的な淡色テキストを本文に使わない

### 7.2 Focus

- キーボード操作時は `:focus-visible` を必ず表示する
- フォーカスリングは青系で統一する
- アイコンボタンにも `aria-label` を設定する

### 7.3 Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 8. Implementation Notes

### 8.1 Tailwind CSS Token Mapping

Tailwind CSS を使う場合、上記 CSS Variables を `globals.css` に定義し、ユーティリティでは semantic token を優先する。

```tsx
<div className="rounded-[var(--radius-lg)] border border-[var(--color-border-glass)] bg-[var(--color-bg-surface)] backdrop-blur-[18px]">
  ...
</div>
```

### 8.2 Component Naming

```txt
components/
├── layout/
│   ├── AppHeader.tsx
│   ├── PageShell.tsx
│   └── Footer.tsx
├── ui/
│   ├── Button.tsx
│   ├── IconButton.tsx
│   ├── GlassPanel.tsx
│   └── EmptyState.tsx
└── content/
    ├── ContentCard.tsx
    └── NotificationBanner.tsx
```

### 8.3 GlassPanel Primitive

半透明面は各コンポーネントで個別実装せず、共通プリミティブに寄せる。

```tsx
type GlassPanelProps = {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
};

export function GlassPanel({
  as: Component = "div",
  className,
  children,
}: GlassPanelProps) {
  return (
    <Component
      className={[
        "border border-[var(--color-border-glass)]",
        "bg-[var(--color-bg-surface)]",
        "backdrop-blur-[18px]",
        "shadow-[var(--shadow-card)]",
        className,
      ].join(" ")}
    >
      {children}
    </Component>
  );
}
```

---

## 9. Do / Don't

### Do

- 余白を広めに取る
- 背景とカードの透明度差で階層を作る
- CTA はグラデーションで明確にする
- アイコンは線幅を揃える
- 日本語本文は行間を広めにする

### Don't

- 透明度を上げすぎて文字を読みにくくする
- 複数の強いグラデーションを同時に使う
- カードに重い影を付ける
- テキストを薄い紫や水色にしすぎる
- 1 画面に過剰な装飾アイコンを置く

---

## 10. Page Template

```tsx
export function IndexPageTemplate() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      <AppHeader />

      <section className="container hero">
        <h1 className="hero__title">ページタイトル</h1>
        <p className="hero__subtitle">ページの補足説明</p>
      </section>

      <section className="container">
        <NotificationBanner message="通知メッセージ" actionLabel="有効にする" />
      </section>

      <section className="container mt-6 space-y-3">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </section>

      <Footer />
    </main>
  );
}
```

---

## 11. Quality Checklist

- [ ] 主要な色が semantic token 経由で使われている
- [ ] 直書きの hex color がコンポーネント内に散らばっていない
- [ ] スマホ幅でカードが 1 カラムに崩れる
- [ ] アイコンボタンに `aria-label` がある
- [ ] `focus-visible` が見える
- [ ] 半透明カード上の本文が読みやすい
- [ ] hover / active / disabled 状態が定義されている
- [ ] 空状態が用意されている
- [ ] 主要コンポーネントが再利用可能な単位に分割されている
