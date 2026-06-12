## TASK-014: suppress 機能

| 項目 | 内容 |
|------|------|
| ID | TASK-014 |
| 関連要件 | REQ-CONFIG-005 |
| 規模 | S |
| 依存タスク | TASK-011, TASK-009 |

### 実装概要

設定ファイルのペア除外と `// doppel-ignore` コメントによるコンポーネント単位の除外を実装する。

### 対象ファイル

- `packages/core/src/suppress/index.ts`
- `packages/core/src/suppress/comment-parser.ts`
- `packages/core/src/suppress/pattern-matcher.ts`

### 実装ステップ

1. 設定ファイルの suppress パターンマッチング（名前一致、glob）
2. `// doppel-ignore` コメントのパース（コンポーネント定義直前）
3. suppress 対象ペアのフィルタリング
4. `--no-suppress` フラグの処理
5. ユニットテスト
