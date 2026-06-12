## TASK-005: JSX ツリー抽出・正規化

| 項目 | 内容 |
|------|------|
| ID | TASK-005 |
| 関連要件 | REQ-PARSE-003 |
| 規模 | L |
| 依存タスク | TASK-002, TASK-003 |

### 実装概要

コンポーネントの return 文から JSX ツリーを抽出し、正規化された NormalizedJSXTree に変換する。

### 対象ファイル

- `packages/core/src/extractor/jsx-tree.ts`
- `packages/core/src/normalizer/jsx-normalizer.ts`

### 実装ステップ

1. return 文の JSX 要素を再帰的に走査
2. JSX 要素のタグ名・属性・子要素を抽出
3. Fragment の処理
4. 条件付きレンダリング（三項演算子、&&）の検出と表現
5. map によるリストレンダリングの検出
6. NormalizedJSXTree への変換
7. テキストノードの正規化（内容は保持しない）
8. ユニットテスト
