# 要件定義書: doppel-ts

## プロジェクト概要

doppel-ts は、React コンポーネントの類似度を測定し重複定義を検知する TypeScript + Rust ハイブリッドライブラリである。Doppelgänger（分身）の名の通り、プロジェクト内に潜む「ほぼ同じコンポーネント」を機械的・決定論的に発見し、リファクタリングの判断材料を提供する。

doppel-ts 自体は deterministic なツールであり、AI を内部に組み込まない。出力される構造化 JSON は AI エージェントが消費することを想定し、リッチな構造データを含む。

## スコープ

### 対象範囲（v1）

- React コンポーネント（JSX/TSX）の検出と解析
- Props 型 + JSX ツリーに基づく類似度計算
- スタイル・振る舞いの補助的類似度指標
- CLI によるスキャンとレポート出力（ターミナル + JSON）
- 設定ファイル（doppel.config.ts）による挙動カスタマイズ
- TypeScript 6 Compiler API によるパーサー実装
- パーサー抽象レイヤーの導入
- Rust ネイティブアドオン（napi-rs）による高速類似度計算
- pnpm monorepo 構成（core / native / cli）

### 対象外（v2 以降）

- Vue / Svelte / Web Components 等の他フレームワーク対応
- クラスタリング出力
- HTML レポート
- CI Bot 連携（GitHub / GitLab）
- SWC / oxc による高速パーサー
- Strada API 対応
- ローカル（非エクスポート）コンポーネントの検出
- ESLint / Biome プラグイン

## 要件一覧

| ID | タイトル | 優先度 | ステータス |
|----|---------|--------|-----------|
| REQ-PARSE-001 | React コンポーネント検出 | Must | Draft |
| REQ-PARSE-002 | Props 型抽出 | Must | Draft |
| REQ-PARSE-003 | JSX ツリー抽出 | Must | Draft |
| REQ-PARSE-004 | memo/forwardRef/HOC ラップ検出 | Must | Draft |
| REQ-PARSE-005 | パーサー抽象レイヤー | Must | Draft |
| REQ-PARSE-006 | ローカルコンポーネント検出 | Could | Draft |
| REQ-SIMIL-001 | 特徴ベクトル生成 | Must | Draft |
| REQ-SIMIL-002 | コサイン類似度フィルタリング | Must | Draft |
| REQ-SIMIL-003 | Tree Edit Distance 精密比較 | Must | Draft |
| REQ-SIMIL-004 | Props 型類似度 | Must | Draft |
| REQ-SIMIL-005 | JSX ツリー類似度 | Must | Draft |
| REQ-SIMIL-006 | スタイル類似度（補助） | Should | Draft |
| REQ-SIMIL-007 | 振る舞い類似度（補助） | Should | Draft |
| REQ-SIMIL-008 | 多段階閾値判定 | Must | Draft |
| REQ-SIMIL-009 | クラスタリング | Could | Draft |
| REQ-CLI-001 | 位置引数によるスキャン対象指定 | Must | Draft |
| REQ-CLI-002 | --exclude フラグ | Must | Draft |
| REQ-CLI-003 | --threshold フラグ | Must | Draft |
| REQ-CLI-004 | --detail フラグ | Must | Draft |
| REQ-CLI-005 | JSON 出力（--format json） | Must | Draft |
| REQ-CLI-006 | --minimal フラグ | Must | Draft |
| REQ-CLI-007 | --include-local フラグ | Should | Draft |
| REQ-CLI-008 | ターミナル出力（デフォルト） | Must | Draft |
| REQ-CLI-009 | リッチ JSON 出力（AI 消費向け） | Must | Draft |
| REQ-CLI-010 | HTML レポート出力 | Could | Draft |
| REQ-CONFIG-001 | doppel.config.ts サポート | Must | Draft |
| REQ-CONFIG-002 | include/exclude 設定 | Must | Draft |
| REQ-CONFIG-003 | 閾値設定 | Must | Draft |
| REQ-CONFIG-004 | 類似度指標の重み付け設定 | Must | Draft |
| REQ-CONFIG-005 | suppress 設定（ペア除外） | Must | Draft |
| REQ-NATIVE-001 | napi-rs Rust アドオン基盤 | Must | Draft |
| REQ-NATIVE-002 | 特徴ベクトル生成（Rust） | Must | Draft |
| REQ-NATIVE-003 | 類似度計算（Rust） | Must | Draft |
| REQ-NATIVE-004 | バッチ処理インターフェース | Must | Draft |
| REQ-INFRA-001 | pnpm monorepo 構成 | Must | Draft |
| REQ-INFRA-002 | npm パッケージ配布 | Must | Draft |
| REQ-INFRA-003 | Node.js ランタイム対応 | Must | Draft |
| REQ-INFRA-004 | Bun ランタイム対応 | Must | Draft |
| REQ-INFRA-005 | MIT + Apache 2.0 デュアルライセンス | Must | Draft |
| REQ-INFRA-006 | ユニットテスト | Must | Draft |
| REQ-INFRA-007 | スナップショットテスト | Must | Draft |
| REQ-INFRA-008 | フィクスチャープロジェクト | Must | Draft |
| REQ-PERF-001 | 小規模パフォーマンス目標 | Should | Draft |
| REQ-PERF-002 | 中規模パフォーマンス目標 | Should | Draft |
| REQ-PERF-003 | 大規模パフォーマンス目標 | Should | Draft |
| REQ-PERF-004 | ベンチマーク回帰検知 | Must | Draft |

## 用語集

| 用語 | 定義 |
|------|------|
| コンポーネント | JSX/TSX を返すエクスポートされた React 関数またはクラス |
| Props 型 | コンポーネントが受け取る引数の TypeScript 型定義 |
| JSX ツリー | コンポーネントが返す JSX 要素の木構造 |
| 特徴ベクトル | コンポーネントの構造的特徴を数値ベクトルとして表現したもの |
| Tree Edit Distance | 2つの木構造間の編集距離（挿入・削除・置換の最小回数） |
| 類似度スコア | 0.0〜1.0 の範囲でコンポーネント間の類似度を表す数値 |
| suppress | 意図的に類似している特定ペアを検出結果から除外する設定 |
| パーサー抽象レイヤー | AST 解析エンジンを差し替え可能にするインターフェース層 |
| napi-rs | Rust で Node.js ネイティブアドオンを構築するフレームワーク |
| Strada API | TypeScript 7.1 で予定されている新しいプログラマティック API |
| フィクスチャープロジェクト | テスト用に構成された模擬 React プロジェクト |
