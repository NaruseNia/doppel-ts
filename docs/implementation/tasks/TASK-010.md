## TASK-010: 多段階閾値判定・重み付け

| 項目 | 内容 |
|------|------|
| ID | TASK-010 |
| 関連要件 | REQ-SIMIL-008, REQ-CONFIG-003, REQ-CONFIG-004 |
| 規模 | S |
| 依存タスク | TASK-009 |

### 実装概要

類似度スコアに多段階レベル（high, medium 等）を付与し、設定可能な重み付けで総合スコアを算出する。

### 対象ファイル

- `packages/native/src/scoring.rs`
- `packages/core/src/config/weights.ts`

### 実装ステップ

1. 多段階レベル判定ロジック（Rust 側）
2. カスタム閾値の受け渡し（TS → Rust）
3. 重み付きスコア算出（props × w1 + jsx × w2 + style × w3 + behavior × w4）
4. 重み 0 の指標スキップ最適化
5. ユニットテスト
