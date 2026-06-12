# 実装計画: doppel-ts

## 概要

doppel-ts v1 の実装を5フェーズに分けて進行する。フェーズ1で基盤、フェーズ2で解析パイプライン、フェーズ3で類似度エンジン、フェーズ4で CLI・出力、フェーズ5で統合・品質保証を行う。フェーズ内のタスクは並行実行可能。

## 実装順序

| フェーズ | タスク                                       | 依存                                             | 規模 | ステータス |
| -------- | -------------------------------------------- | ------------------------------------------------ | ---- | ---------- |
| 1        | TASK-001: monorepo 基盤構築                  | -                                                | M    | ✅ Done    |
| 2        | TASK-002: パーサー抽象レイヤー設計・実装     | TASK-001                                         | M    | ✅ Done    |
| 2        | TASK-007: Rust ネイティブアドオン基盤        | TASK-001                                         | M    | ✅ Done    |
| 2        | TASK-011: 設定ファイルローダー               | TASK-001                                         | M    | ✅ Done    |
| 3        | TASK-003: React コンポーネント検出           | TASK-002                                         | L    | ✅ Done    |
| 3        | TASK-008: 特徴ベクトル生成（Rust）           | TASK-007                                         | L    | ✅ Done    |
| 3        | TASK-004: Props 型抽出                       | TASK-002, TASK-003                               | L    | ✅ Done    |
| 3        | TASK-005: JSX ツリー抽出・正規化             | TASK-002, TASK-003                               | L    | ✅ Done    |
| 3        | TASK-009: 類似度計算エンジン（Rust）         | TASK-008                                         | L    | 🔲 Ready   |
| 4        | TASK-006: 構造データ正規化                   | TASK-004, TASK-005                               | M    | ⏳ Blocked |
| 4        | TASK-010: 多段階閾値判定・重み付け           | TASK-009                                         | S    | ⏳ Blocked |
| 4        | TASK-012: CLI 実装                           | TASK-011                                         | M    | 🔲 Ready   |
| 4        | TASK-014: suppress 機能                      | TASK-011, TASK-009                               | S    | ⏳ Blocked |
| 5        | TASK-013: 出力フォーマッター                 | TASK-009, TASK-012                               | M    | ⏳ Blocked |
| 5        | TASK-015: パイプライン統合・E2E テスト       | TASK-006, TASK-009, TASK-012, TASK-013, TASK-014 | L    | ⏳ Blocked |
| 5        | TASK-016: ベンチマーク・パフォーマンス最適化 | TASK-015                                         | M    | ⏳ Blocked |
| 5        | TASK-017: npm 配布・CI 設定                  | TASK-015                                         | M    | ⏳ Blocked |

### 決定事項ログ

| 日付       | 決定内容                                                  |
| ---------- | --------------------------------------------------------- |
| 2026-06-12 | TS ビルドツール: tsup（ESM + CJS デュアル）               |
| 2026-06-12 | Linter/Formatter: oxlint + oxfmt                          |
| 2026-06-12 | ブランチ戦略: main 直接コミット、論理単位分割、PRなし     |
| 2026-06-12 | フェーズ2以降: タスクごとにfeatureブランチ+PR             |
| 2026-06-12 | Config loader: jiti                                       |
| 2026-06-12 | ツールチェイン管理: mise（Node 22, pnpm 10, Rust stable） |
| 2026-06-12 | CI: jdx/mise-action@v2 に統一                             |

## トレーサビリティマトリクス

| 要件ID         | タイトル                       | 関連タスク         | カバレッジ   |
| -------------- | ------------------------------ | ------------------ | ------------ |
| REQ-PARSE-001  | React コンポーネント検出       | TASK-003           | Full         |
| REQ-PARSE-002  | Props 型抽出                   | TASK-004, TASK-006 | Full         |
| REQ-PARSE-003  | JSX ツリー抽出                 | TASK-005, TASK-006 | Full         |
| REQ-PARSE-004  | memo/forwardRef/HOC ラップ検出 | TASK-003           | Full         |
| REQ-PARSE-005  | パーサー抽象レイヤー           | TASK-002           | Full         |
| REQ-PARSE-006  | ローカルコンポーネント検出     | -                  | v2           |
| REQ-SIMIL-001  | 特徴ベクトル生成               | TASK-008           | Full         |
| REQ-SIMIL-002  | コサイン類似度フィルタリング   | TASK-009           | Full         |
| REQ-SIMIL-003  | Tree Edit Distance 精密比較    | TASK-009           | Full         |
| REQ-SIMIL-004  | Props 型類似度                 | TASK-009           | Full         |
| REQ-SIMIL-005  | JSX ツリー類似度               | TASK-009           | Full         |
| REQ-SIMIL-006  | スタイル類似度（補助）         | TASK-006, TASK-009 | Full         |
| REQ-SIMIL-007  | 振る舞い類似度（補助）         | TASK-006, TASK-009 | Full         |
| REQ-SIMIL-008  | 多段階閾値判定                 | TASK-010           | Full         |
| REQ-SIMIL-009  | クラスタリング                 | -                  | v2           |
| REQ-CLI-001    | 位置引数によるスキャン対象指定 | TASK-012           | Full         |
| REQ-CLI-002    | --exclude フラグ               | TASK-012           | Full         |
| REQ-CLI-003    | --threshold フラグ             | TASK-012           | Full         |
| REQ-CLI-004    | --detail フラグ                | TASK-012, TASK-013 | Full         |
| REQ-CLI-005    | JSON 出力                      | TASK-013           | Full         |
| REQ-CLI-006    | --minimal フラグ               | TASK-013           | Full         |
| REQ-CLI-007    | --include-local フラグ         | TASK-012           | Partial (v2) |
| REQ-CLI-008    | ターミナル出力                 | TASK-013           | Full         |
| REQ-CLI-009    | リッチ JSON 出力               | TASK-013           | Full         |
| REQ-CLI-010    | HTML レポート出力              | -                  | v2           |
| REQ-CONFIG-001 | doppel.config.ts サポート      | TASK-011           | Full         |
| REQ-CONFIG-002 | include/exclude 設定           | TASK-011           | Full         |
| REQ-CONFIG-003 | 閾値設定                       | TASK-011, TASK-010 | Full         |
| REQ-CONFIG-004 | 重み付け設定                   | TASK-011, TASK-010 | Full         |
| REQ-CONFIG-005 | suppress 設定                  | TASK-011, TASK-014 | Full         |
| REQ-NATIVE-001 | napi-rs 基盤                   | TASK-007           | Full         |
| REQ-NATIVE-002 | 特徴ベクトル生成（Rust）       | TASK-008           | Full         |
| REQ-NATIVE-003 | 類似度計算（Rust）             | TASK-009           | Full         |
| REQ-NATIVE-004 | バッチ処理インターフェース     | TASK-007           | Full         |
| REQ-INFRA-001  | pnpm monorepo 構成             | TASK-001           | Full         |
| REQ-INFRA-002  | npm パッケージ配布             | TASK-017           | Full         |
| REQ-INFRA-003  | Node.js ランタイム対応         | TASK-017           | Full         |
| REQ-INFRA-004  | Bun ランタイム対応             | TASK-017           | Full         |
| REQ-INFRA-005  | デュアルライセンス             | TASK-001           | Full         |
| REQ-INFRA-006  | ユニットテスト                 | TASK-015           | Full         |
| REQ-INFRA-007  | スナップショットテスト         | TASK-015           | Full         |
| REQ-INFRA-008  | フィクスチャープロジェクト     | TASK-015           | Full         |
| REQ-PERF-001   | 小規模パフォーマンス目標       | TASK-016           | Full         |
| REQ-PERF-002   | 中規模パフォーマンス目標       | TASK-016           | Full         |
| REQ-PERF-003   | 大規模パフォーマンス目標       | TASK-016           | Full         |
| REQ-PERF-004   | ベンチマーク回帰検知           | TASK-016           | Full         |

## マイルストーン

| マイルストーン       | 含まれるタスク                         | 完了条件                                                                        |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| M1: 基盤構築         | TASK-001, TASK-002, TASK-007, TASK-011 | monorepo ビルド成功、パーサー IF 定義完了、napi-rs ロード成功、設定読み込み動作 |
| M2: 解析パイプライン | TASK-003, TASK-004, TASK-005, TASK-006 | React コンポーネントの検出 → Props/JSX 抽出 → 正規化データ生成が動作            |
| M3: 類似度エンジン   | TASK-008, TASK-009, TASK-010           | 正規化データ → ベクトル化 → フィルタ → 精密比較 → スコア出力が動作              |
| M4: CLI・出力        | TASK-012, TASK-013, TASK-014           | `npx doppel-ts src/` でターミナル/JSON 出力が得られる                           |
| M5: v1 リリース      | TASK-015, TASK-016, TASK-017           | E2E テスト合格、ベンチマーク基準達成、npm publish 完了                          |
