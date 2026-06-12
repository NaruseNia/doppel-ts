# アーキテクチャ仕様書: doppel-ts

## 概要

doppel-ts は TypeScript + Rust ハイブリッドアーキテクチャを採用する。AST 解析・正規化は TypeScript（TypeScript Compiler API）が担当し、特徴ベクトル生成・類似度計算は Rust（napi-rs）が担当する。

## システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                      packages/cli                           │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Arg      │  │  Config  │  │  Output  │  │  Output   │  │
│  │  Parser   │  │  Loader  │  │  Terminal │  │  JSON     │  │
│  └─────┬─────┘  └────┬─────┘  └──────────┘  └───────────┘  │
│        │              │                                      │
└────────┼──────────────┼──────────────────────────────────────┘
         │              │
         ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                     packages/core                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Parser Abstraction Layer                │    │
│  │  ┌─────────────────┐   ┌──────────────────────┐     │    │
│  │  │  ParserInterface │   │  TS6 Compiler API    │     │    │
│  │  │  (abstract)      │   │  Implementation      │     │    │
│  │  └─────────────────┘   └──────────────────────┘     │    │
│  │            ▲                 ▲                        │    │
│  │            │   ┌─────────────┘   (future)            │    │
│  │            │   │   ┌─────────────────────┐           │    │
│  │            │   │   │  Strada / SWC impl  │           │    │
│  │            │   │   └─────────────────────┘           │    │
│  └────────────┼───┼─────────────────────────────────────┘    │
│               │   │                                          │
│  ┌────────────┼───┼─────────────────────────────────────┐    │
│  │            ▼   ▼         Analysis Pipeline           │    │
│  │                                                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │    │
│  │  │Component │  │  Props   │  │  JSX Tree         │  │    │
│  │  │Detector  │  │  Extrac- │  │  Extractor &      │  │    │
│  │  │          │  │  tor     │  │  Normalizer       │  │    │
│  │  └────┬─────┘  └────┬─────┘  └─────────┬─────────┘  │    │
│  │       │              │                  │            │    │
│  │       ▼              ▼                  ▼            │    │
│  │  ┌──────────────────────────────────────────────┐    │    │
│  │  │          Normalized Structure Data           │    │    │
│  │  │          (JSON-serializable)                 │    │    │
│  │  └────────────────────┬─────────────────────────┘    │    │
│  └───────────────────────┼──────────────────────────────┘    │
│                          │                                   │
│                          │ FFI (single batch call)           │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                  Native Bridge                       │    │
│  │          (napi-rs serialize/deserialize)              │    │
│  └──────────────────────┬───────────────────────────────┘    │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    packages/native                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Similarity Engine (Rust)                 │   │
│  │                                                      │   │
│  │  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │  Feature     │  │  Cosine     │  │  Tree Edit │  │   │
│  │  │  Vector      │  │  Similarity │  │  Distance  │  │   │
│  │  │  Generator   │  │  Filter     │  │  Calculator│  │   │
│  │  └──────┬───────┘  └──────┬──────┘  └─────┬──────┘  │   │
│  │         │                 │                │         │   │
│  │         ▼                 ▼                ▼         │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │              Batch Processor                 │    │   │
│  │  │  vectorize → filter → precise compare       │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## パッケージ構成

```
doppel-ts/
├── packages/
│   ├── core/                    # 解析エンジン
│   │   ├── src/
│   │   │   ├── parser/          # パーサー抽象レイヤー
│   │   │   │   ├── interface.ts # ParserInterface 定義
│   │   │   │   └── ts-compiler/ # TS6 Compiler API 実装
│   │   │   ├── detector/        # コンポーネント検出
│   │   │   ├── extractor/       # Props / JSX 抽出
│   │   │   ├── normalizer/      # 構造データ正規化
│   │   │   └── index.ts         # public API
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── native/                  # Rust ネイティブアドオン
│   │   ├── src/
│   │   │   ├── lib.rs           # napi-rs エントリポイント
│   │   │   ├── vector.rs        # 特徴ベクトル生成
│   │   │   ├── similarity.rs    # コサイン類似度
│   │   │   ├── tree_edit.rs     # Tree Edit Distance
│   │   │   └── batch.rs         # バッチ処理
│   │   ├── Cargo.toml
│   │   └── package.json
│   └── cli/                     # CLI
│       ├── src/
│       │   ├── args.ts          # 引数パーサー
│       │   ├── config.ts        # 設定ファイルローダー
│       │   ├── output/          # 出力フォーマッター
│       │   │   ├── terminal.ts
│       │   │   └── json.ts
│       │   └── index.ts         # エントリポイント
│       ├── package.json
│       └── tsconfig.json
├── fixtures/                    # テスト用フィクスチャー
│   ├── small/                   # 小規模（~100 コンポーネント）
│   ├── medium/                  # 中規模（~500 コンポーネント）
│   └── large/                   # 大規模（~2000 コンポーネント）
├── pnpm-workspace.yaml
├── package.json
├── LICENSE-MIT
├── LICENSE-APACHE
├── README.md
└── README_ja.md
```

## データフロー

### 解析パイプライン

```
1. ファイル探索
   CLI 引数 / 設定ファイル → glob 展開 → 対象ファイルリスト

2. AST 解析（TypeScript）
   ファイルリスト → TS Compiler API → AST

3. コンポーネント検出（TypeScript）
   AST → エクスポート関数/クラス判定 → memo/forwardRef/HOC アンラップ → コンポーネントリスト

4. 構造抽出・正規化（TypeScript）
   コンポーネント → Props 型解決 + JSX ツリー抽出 → 正規化構造データ

5. FFI 転送
   正規化構造データ（全コンポーネント一括）→ napi-rs シリアライズ → Rust

6. ベクトル生成（Rust）
   正規化構造データ → 特徴ベクトル

7. フィルタリング（Rust）
   全ペアのコサイン類似度計算 → 閾値以上のペアを抽出

8. 精密比較（Rust）
   候補ペア → Tree Edit Distance + Props 構造比較 → スコア + 内訳

9. 結果返却
   Rust → napi-rs デシリアライズ → TypeScript → 出力フォーマット
```

### 設定の優先順位

```
CLI フラグ > doppel.config.ts > デフォルト値
```

## パーサー抽象レイヤー

```typescript
interface ParserInterface {
  // ファイルからコンポーネント一覧を抽出
  extractComponents(filePaths: string[]): ComponentInfo[];

  // コンポーネントの Props 型情報を取得
  extractProps(component: ComponentInfo): PropsInfo;

  // コンポーネントの JSX ツリーを取得
  extractJSXTree(component: ComponentInfo): NormalizedJSXTree;
}
```

初期実装は `TypeScript6CompilerParser` のみ。将来 `StradaParser` / `SWCParser` を追加する設計。

## FFI 境界設計

TS → Rust 間のデータ転送は1回のバッチ呼び出しに集約する。

```
入力: NormalizedComponentData[] （全コンポーネントの正規化データ）
出力: SimilarityResult[]         （閾値以上の全ペアのスコア + 内訳）
```

Rust 内部で以下を一貫して実行:
1. 特徴ベクトル生成
2. コサイン類似度によるペアフィルタリング
3. 候補ペアの精密比較（Tree Edit Distance + Props 比較）
4. 多段階閾値判定

## 制約・前提条件

- TypeScript 6 Compiler API に依存（tsgo / TypeScript 7 の Compiler API は利用不可）
- React コンポーネントのみ対応（v1）
- JSX/TSX ファイルのみ対象
- Rust ツールチェーンがビルド時に必要（プリビルドバイナリ提供で緩和）
- 決定論的な出力を保証（同一入力 → 同一出力、AI 連携は外部）

## 関連要件

- REQ-PARSE-005（パーサー抽象レイヤー）
- REQ-NATIVE-001〜004（Rust ネイティブアドオン）
- REQ-INFRA-001（pnpm monorepo 構成）
