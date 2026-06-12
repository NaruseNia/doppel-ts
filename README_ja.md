# doppel-ts

React コンポーネントの重複・類似を検知するツール。

doppel-ts はプロジェクト内の React コンポーネントを静的解析し、構造的な類似度を測定して統合候補を報告します。完全に決定論的なツールであり、内部に AI を組み込みません。出力されるリッチな構造化 JSON は、AI エージェントが下流で消費することを想定して設計されています。

## 特徴

- **Props + JSX 類似度** — コンポーネントのインターフェース（Props 型）とレンダリング構造（JSX ツリー）を主要な類似度指標として比較
- **2段階アルゴリズム** — 特徴ベクトルによる高速フィルタリングで O(N²) のペアを絞り込み、候補のみ Tree Edit Distance で精密比較
- **Rust 高速エンジン** — 類似度計算エンジンは Rust（napi-rs）で実装し高パフォーマンスを実現
- **リッチ JSON 出力** — Props 詳細、正規化 JSX ツリー、差分データを含む構造化データ — AI エージェントでの活用を想定
- **カスタマイズ可能な閾値** — 多段階の重要度レベル（high / medium）と、類似度指標ごとの重み付け設定
- **偽陽性の抑制** — 設定ファイルまたは `// doppel-ignore` コメントで意図的な類似ペアを除外

## インストール

```bash
npm install -D doppel-ts
```

## クイックスタート

```bash
# コンポーネントディレクトリをスキャン
npx doppel-ts src/components

# 複数ディレクトリ
npx doppel-ts src/components src/ui

# 閾値を指定
npx doppel-ts src/components --threshold 0.8

# JSON 出力（CI や AI 連携向け）
npx doppel-ts src/components --format json

# リッチ JSON（Props, JSXツリー, 差分付き）
npx doppel-ts src/components --format json --detail

# 詳細内訳を表示
npx doppel-ts src/components --detail
```

## 出力例

```
doppel-ts v1.0.0 — scanning 142 components...

 HIGH (≥90%)
  PrimaryButton ↔ SubmitButton     92%   src/components/PrimaryButton.tsx ↔ src/components/SubmitButton.tsx
  UserCard      ↔ ProfileCard      91%   src/components/UserCard.tsx ↔ src/components/ProfileCard.tsx

 MEDIUM (≥70%)
  SearchInput   ↔ FilterInput      78%   src/components/SearchInput.tsx ↔ src/components/FilterInput.tsx

Found 3 similar pairs (2 high, 1 medium) across 142 components.
```

## 設定

プロジェクトルートに `doppel.config.ts` を作成:

```typescript
import { defineConfig } from "doppel-ts";

export default defineConfig({
  include: ["src/components/**/*.tsx"],
  exclude: ["**/*.test.tsx", "**/*.stories.tsx"],

  threshold: {
    high: 0.9,
    medium: 0.7,
  },

  weights: {
    props: 0.5,
    jsx: 0.35,
    style: 0.1,
    behavior: 0.05,
  },

  suppress: [
    ["BaseButton", "IconButton"],
    ["*Layout*", "*Container*"],
  ],
});
```

### 設定の優先順位

```
CLI フラグ > doppel.config.ts > デフォルト値
```

## CLI オプション

| フラグ                 | 説明                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| `[paths...]`           | スキャン対象のディレクトリまたは glob パターン（デフォルト: cwd） |
| `--exclude <pattern>`  | 除外パターン（複数指定可）                                        |
| `--threshold <number>` | 最小類似度スコア（0.0-1.0）                                       |
| `--detail`             | 内訳表示（terminal）/ リッチJSON（json モード）                   |
| `--format <type>`      | 出力形式: `terminal`（デフォルト）または `json`                   |
| `--include-local`      | エクスポートされていないローカルコンポーネントも対象に含める      |
| `--no-suppress`        | suppress ルールを無効化                                           |
| `--help`               | ヘルプ表示                                                        |
| `--version`            | バージョン表示                                                    |

## JSON 出力

デフォルトの JSON 出力は軽量版（名前・パス・スコアのみ）:

```json
{
  "meta": {
    "version": "1.0.0",
    "totalComponents": 142,
    "totalPairs": 3
  },
  "pairs": [
    {
      "score": 0.92,
      "level": "high",
      "a": { "name": "PrimaryButton", "path": "src/components/PrimaryButton.tsx" },
      "b": { "name": "SubmitButton", "path": "src/components/SubmitButton.tsx" }
    }
  ]
}
```

`--detail` を使用すると、Props・JSXツリー・内訳スコア・差分を含むリッチ版を出力します。

## 結果の抑制

### 設定ファイルで

```typescript
export default defineConfig({
  suppress: [
    ["BaseButton", "IconButton"], // 名前指定
    ["*Layout*", "*Container*"], // glob パターン
  ],
});
```

### ソースコードで

```tsx
// doppel-ignore
export function SpecialButton(props: ButtonProps) {
  // ...
}
```

## アーキテクチャ

doppel-ts は TypeScript + Rust のハイブリッドアーキテクチャを採用しています:

- **TypeScript** — TypeScript Compiler API による AST 解析、コンポーネント検出、Props/JSX 抽出、正規化
- **Rust**（napi-rs）— 特徴ベクトル生成、コサイン類似度フィルタリング、Tree Edit Distance 計算

パーサー層は抽象化されており、将来のバックエンド（Strada API, SWC/oxc）への対応を見据えています。

## 動作要件

- Node.js ≥ 20 または Bun ≥ 1.x
- TypeScript を使用した React プロジェクト（.tsx ファイル）

## ロードマップ

- [ ] Vue / Svelte / Web Components 対応（プラグインシステム）
- [ ] コンポーネントクラスタリング（類似コンポーネントのグループ化）
- [ ] HTML ビジュアルレポート
- [ ] CI Bot 連携（PR コメント）
- [ ] SWC / oxc 高速パーサーバックエンド
- [ ] Strada API 対応（TypeScript 7.1+）

## ライセンス

以下のいずれかのライセンスのもとで利用できます:

- MIT License ([LICENSE-MIT](LICENSE-MIT))
- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE))
