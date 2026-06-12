## TASK-004: Props 型抽出

| 項目 | 内容 |
|------|------|
| ID | TASK-004 |
| 関連要件 | REQ-PARSE-002 |
| 規模 | L |
| 依存タスク | TASK-002, TASK-003 |

### 実装概要

TypeScript Compiler API の型チェッカーを用いて、各コンポーネントの Props 型情報を正確に抽出する。interface、type alias、インライン型、ジェネリクス、合成型に対応。

### 対象ファイル

- `packages/core/src/extractor/props.ts`
- `packages/core/src/extractor/type-resolver.ts`

### 実装ステップ

1. コンポーネントの第一引数から Props 型を特定
2. TypeChecker でinterface / type alias を解決
3. 各プロパティの名前・型・オプショナル有無を抽出
4. ジェネリクスを含む型のインスタンス化
5. extends / intersection の展開
6. TypeDescriptor への正規化
7. ユニットテスト（各型パターン）
