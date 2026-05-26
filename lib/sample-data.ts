import type { Article, Company, Source, Term } from "./types";

export const tagVocabulary = [
  "AI / 機械学習",
  "クラウド / SaaS",
  "セキュリティ",
  "半導体 / ハードウェア",
  "モバイル / アプリ",
  "Web / フロントエンド",
  "データ / アナリティクス",
  "通信 / 5G",
  "ロボティクス",
  "自動車 / モビリティ",
  "製造業",
  "ヘルスケア / 医療",
  "バイオ / 創薬",
  "金融 / フィンテック",
  "小売 / EC",
  "広告 / マーケティング",
  "メディア / エンタメ",
  "ゲーム",
  "教育",
  "人事 / HR",
  "ESG / サステナビリティ",
  "資金調達 / IPO",
  "M&A / 提携",
  "人事異動 / 組織変更"
] as const;

export const companies: Company[] = [
  {
    id: "cloudlink",
    name: "クラウドリンク株式会社",
    logoUrl: "https://www.google.com/s2/favicons?domain=cloud.google.com&sz=128",
    description: "AI プラットフォームが話題"
  },
  {
    id: "tohto-material",
    name: "東都マテリアル株式会社",
    logoUrl: "https://www.google.com/s2/favicons?domain=material.io&sz=128",
    description: "デジタルツインに注目"
  },
  {
    id: "mirai-robotics",
    name: "Mirai Robotics株式会社",
    logoUrl: "https://www.google.com/s2/favicons?domain=openai.com&sz=128",
    description: "新製品が高評価"
  },
  {
    id: "harumi-bio",
    name: "晴海バイオ株式会社",
    logoUrl: "https://www.google.com/s2/favicons?domain=nih.gov&sz=128",
    description: "臨床試験の進展に注目"
  },
  {
    id: "next-finance",
    name: "ネクストファイナンス株式会社",
    logoUrl: "https://www.google.com/s2/favicons?domain=stripe.com&sz=128",
    description: "FinTech 領域で急成長"
  }
];

const commonTerms: Term[] = [
  {
    word: "MLOps",
    reading: "エムエルオプス",
    meaning: "機械学習モデルの開発、運用、監視を継続的に回すための実践体系である。品質劣化の検知や再学習の自動化に使われる。",
    tags: ["AI / 機械学習", "クラウド / SaaS"]
  },
  {
    word: "デジタルツイン",
    reading: "でじたるついん",
    meaning: "現実の設備や工程を仮想空間に再現し、シミュレーションや分析を行う技術である。製造業の保全や生産計画で活用される。",
    tags: ["製造業", "データ / アナリティクス"]
  },
  {
    word: "ゼロトラスト",
    reading: "ぜろとらすと",
    meaning: "社内外を問わず全てのアクセスを検証するセキュリティの考え方である。クラウド利用やリモートワークの普及で重要度が高まった。",
    tags: ["セキュリティ", "クラウド / SaaS"]
  }
];

export const articles: Article[] = [
  {
    id: "cloudlink-ai-studio",
    companyId: "cloudlink",
    title: "AI開発プラットフォーム「CloudLink AI Studio」正式版を提供開始",
    summaryShort: "企業のAIモデル開発から本番運用までを一気通貫で支援する統合プラットフォームを提供開始。MLOps機能の強化により開発効率と再現性を向上。",
    summaryLong: "クラウドリンクは、企業向けAI開発基盤「CloudLink AI Studio」の正式版を発表した。データ管理、学習、評価、モデル監視までを単一画面で扱える点が特徴で、PoC後の本番運用に移れない課題を解消する。監査ログや権限管理も備え、金融や製造など統制が必要な領域での利用を見込む。",
    words: commonTerms,
    tags: ["AI / 機械学習", "クラウド / SaaS", "データ / アナリティクス"],
    sourceUrl: "https://example.com/releases/cloudlink-ai-studio",
    publishedAt: "2026-05-26T10:30:00+09:00",
    detectedAt: "2026-05-26T10:34:00+09:00",
    fetchMode: "rss",
    sourceItemId: "cloudlink-ai-studio",
    aiProcessedAt: "2026-05-26T10:35:00+09:00"
  },
  {
    id: "tohto-digital-twin",
    companyId: "tohto-material",
    title: "半導体製造ライン向け「デジタルツイン監視ソリューション」を発表",
    summaryShort: "製造ラインを仮想空間で再現し、異常検知や予兆保全をリアルタイムに実現。歩留まり向上とダウンタイム削減に貢献。",
    summaryLong: "東都マテリアルは、半導体製造ラインの状態を仮想空間に再現する監視ソリューションを発表した。センサー値と工程データを統合し、異常の兆候を早期に検知する。既存設備に後付けできる設計としており、導入時の停止時間を抑えながら品質安定化を支援する。",
    words: [commonTerms[1]],
    tags: ["半導体 / ハードウェア", "製造業", "データ / アナリティクス"],
    sourceUrl: "https://example.com/releases/tohto-digital-twin",
    publishedAt: "2026-05-26T09:15:00+09:00",
    detectedAt: "2026-05-26T09:22:00+09:00",
    fetchMode: "scrape",
    sourceItemId: "tohto-digital-twin",
    aiProcessedAt: "2026-05-26T09:25:00+09:00"
  },
  {
    id: "mirai-mrx10",
    companyId: "mirai-robotics",
    title: "次世代協働ロボット「MRX-10」を販売開始",
    summaryShort: "高精度な力制御とAIビジョンを搭載した協働ロボットを発売。製造・物流・医療分野での自動化ニーズに対応。",
    summaryLong: "Mirai Roboticsは、協働ロボットの新モデル「MRX-10」の販売を開始した。力制御とAIビジョンを組み合わせ、細かな部品組み立てや検品、搬送補助に対応する。安全柵なしで人と同じ作業空間に置ける設計で、中小規模の現場にも導入しやすい価格帯を打ち出した。",
    words: [
      {
        word: "協働ロボット",
        reading: "きょうどうろぼっと",
        meaning: "人と同じ空間で作業することを前提に設計されたロボットである。安全機能により製造や物流の省人化に使われる。",
        tags: ["ロボティクス", "製造業"]
      }
    ],
    tags: ["ロボティクス", "製造業", "AI / 機械学習"],
    sourceUrl: "https://example.com/releases/mirai-mrx10",
    publishedAt: "2026-05-26T08:45:00+09:00",
    detectedAt: "2026-05-26T08:49:00+09:00",
    fetchMode: "rss",
    sourceItemId: "mirai-mrx10",
    aiProcessedAt: "2026-05-26T08:50:00+09:00"
  },
  {
    id: "harumi-gene-editing-trial",
    companyId: "harumi-bio",
    title: "遺伝子編集技術を用いた希少疾患治療の臨床第相試験を開始",
    summaryShort: "自社開発の遺伝子編集技術を活用し、希少疾患の原因遺伝子を標的とした治療法の臨床試験を開始。安全性と有効性を検証。",
    summaryLong: "晴海バイオは、希少疾患を対象とする遺伝子編集治療の臨床試験開始を発表した。初期段階では安全性の確認を主目的とし、投与量や副作用の観察を進める。研究成果を医療機関と共有し、将来的な適応拡大も視野に入れる。",
    words: [
      {
        word: "遺伝子編集",
        reading: "いでんしへんしゅう",
        meaning: "DNA配列を狙った位置で改変する技術である。疾患原因となる遺伝子の修正や研究用途で利用される。",
        tags: ["バイオ / 創薬", "ヘルスケア / 医療"]
      }
    ],
    tags: ["バイオ / 創薬", "ヘルスケア / 医療"],
    sourceUrl: "https://example.com/releases/harumi-gene-editing-trial",
    publishedAt: "2026-05-26T07:50:00+09:00",
    detectedAt: "2026-05-26T07:59:00+09:00",
    fetchMode: "pdf_link",
    sourceItemId: "harumi-gene-editing-trial",
    aiProcessedAt: "2026-05-26T08:02:00+09:00"
  },
  {
    id: "next-finance-expense",
    companyId: "next-finance",
    title: "法人向け経費・請求管理SaaS「NX-Expense」提供開始",
    summaryShort: "AI-OCRと自動仕訳機能により、経費精算と請求処理を効率化。内部統制とコンプライアンス対応も強化。",
    summaryLong: "ネクストファイナンスは、法人向け経費・請求管理SaaS「NX-Expense」を提供開始した。領収書や請求書をAI-OCRで読み取り、会計システムへの仕訳連携までを自動化する。承認フローや証跡管理も備え、上場準備企業や複数拠点を持つ企業の統制強化を支援する。",
    words: [
      {
        word: "AI-OCR",
        reading: "エーアイオーシーアール",
        meaning: "AIを用いて紙や画像内の文字を読み取る技術である。請求書や領収書の入力作業を削減する用途で使われる。",
        tags: ["AI / 機械学習", "金融 / フィンテック"]
      }
    ],
    tags: ["金融 / フィンテック", "クラウド / SaaS", "データ / アナリティクス"],
    sourceUrl: "https://example.com/releases/next-finance-expense",
    detectedAt: "2026-05-26T07:20:00+09:00",
    fetchMode: "scrape",
    sourceItemId: "next-finance-expense",
    aiProcessedAt: "2026-05-26T07:25:00+09:00"
  }
];

export const sources: Source[] = [
  {
    id: "cloudlink-rss",
    companyId: "cloudlink",
    url: "https://example.com/cloudlink/feed.xml",
    mode: "rss",
    health: "ok",
    enabled: true,
    lastCrawledAt: "2026-05-26T10:34:00+09:00",
    sevenDayCount: 12,
    failureCount: 0
  },
  {
    id: "tohto-news",
    companyId: "tohto-material",
    url: "https://example.com/tohto/news",
    mode: "scrape",
    health: "degraded",
    enabled: true,
    lastCrawledAt: "2026-05-26T09:22:00+09:00",
    sevenDayCount: 8,
    failureCount: 2
  },
  {
    id: "harumi-ir",
    companyId: "harumi-bio",
    url: "https://example.com/harumi/ir",
    mode: "pdf_link",
    health: "ok",
    enabled: true,
    lastCrawledAt: "2026-05-26T07:59:00+09:00",
    sevenDayCount: 4,
    failureCount: 0
  }
];
