## TASK-009: 類似度計算エンジン（Rust）

| 項目 | 内容 |
|------|------|
| ID | TASK-009 |
| 関連要件 | REQ-SIMIL-002, REQ-SIMIL-003, REQ-SIMIL-004, REQ-SIMIL-005, REQ-NATIVE-003 |
| 規模 | L |
| 依存タスク | TASK-008 |

### 実装概要

コサイン類似度によるフィルタリングと Tree Edit Distance による精密比較を Rust で実装する。Props 型類似度と JSX ツリー類似度の個別計算も含む。

### 対象ファイル

- `packages/native/src/similarity.rs`
- `packages/native/src/similarity/cosine.rs`
- `packages/native/src/similarity/tree_edit.rs`
- `packages/native/src/similarity/props_compare.rs`
- `packages/native/src/similarity/jsx_compare.rs`

### 実装ステップ

1. コサイン類似度計算の実装
2. 全ペアのコサイン類似度一括計算（O(N²) 最適化）
3. 閾値フィルタリング
4. Tree Edit Distance アルゴリズムの実装（Zhang-Shasha or APTED）
5. Props 構造比較（名前一致、型一致、部分一致）
6. JSX ツリー比較（タグ一致、構造パターン一致）
7. 重み付き総合スコアの算出
8. Rust ユニットテスト
