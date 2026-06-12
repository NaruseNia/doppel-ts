## TASK-008: 特徴ベクトル生成（Rust）

| 項目 | 内容 |
|------|------|
| ID | TASK-008 |
| 関連要件 | REQ-SIMIL-001, REQ-NATIVE-002 |
| 規模 | L |
| 依存タスク | TASK-007 |

### 実装概要

正規化構造データから特徴ベクトルを生成する Rust モジュール。Props のプロパティ名・型、JSX タグ名・属性、構造パターンを数値ベクトルにエンコードする。

### 対象ファイル

- `packages/native/src/vector.rs`
- `packages/native/src/vector/props_encoder.rs`
- `packages/native/src/vector/jsx_encoder.rs`

### 実装ステップ

1. 特徴ベクトルの次元設計（Props 特徴 + JSX 特徴 + メタ特徴）
2. Props プロパティ名のハッシュベースエンコーディング
3. Props 型シグネチャのエンコーディング
4. JSX タグ名のエンコーディング
5. JSX 構造パターン（深さ、分岐数）のエンコーディング
6. 決定論的なベクトル生成の検証
7. Rust ユニットテスト
