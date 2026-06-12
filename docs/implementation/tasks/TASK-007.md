## TASK-007: Rust ネイティブアドオン基盤

| 項目       | 内容                           |
| ---------- | ------------------------------ |
| ID         | TASK-007                       |
| 関連要件   | REQ-NATIVE-001, REQ-NATIVE-004 |
| 規模       | M                              |
| 依存タスク | TASK-001                       |

### 実装概要

napi-rs を用いた Rust ネイティブアドオンの基盤を構築する。TS ↔ Rust 間のデータ受け渡しとバッチ処理インターフェースを実装する。

### 対象ファイル

- `packages/native/src/lib.rs`
- `packages/native/src/batch.rs`
- `packages/native/src/types.rs`
- `packages/native/Cargo.toml`
- `packages/native/build.rs`

### 実装ステップ

1. napi-rs プロジェクトの初期設定
2. NormalizedComponentData に対応する Rust 構造体を定義
3. napi-rs の serde デシリアライズによる入力受け取り
4. バッチ処理エントリポイント関数の定義
5. 結果の SimilarityResult をシリアライズして返却
6. Node.js / Bun からのロードテスト
7. プリビルド設定（napi-rs の GitHub Actions テンプレート）
