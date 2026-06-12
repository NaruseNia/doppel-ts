## TASK-006: 構造データ正規化

| 項目 | 内容 |
|------|------|
| ID | TASK-006 |
| 関連要件 | REQ-PARSE-002, REQ-PARSE-003, REQ-NATIVE-004 |
| 規模 | M |
| 依存タスク | TASK-004, TASK-005 |

### 実装概要

Props 型情報と JSX ツリーを NormalizedComponentData に統合し、Rust 側に渡せる JSON シリアライズ可能な形式にする。

### 対象ファイル

- `packages/core/src/normalizer/index.ts`
- `packages/core/src/normalizer/props-normalizer.ts`
- `packages/core/src/normalizer/style-extractor.ts`
- `packages/core/src/normalizer/behavior-extractor.ts`

### 実装ステップ

1. PropsInfo → NormalizedProps 変換（型シグネチャの文字列化）
2. スタイル情報の抽出（className, styled-components, CSS Modules）
3. 振る舞い情報の抽出（hooks パターン）
4. NormalizedComponentData への統合
5. JSON シリアライズの確認
6. ユニットテスト
