## TASK-003: React コンポーネント検出

| 項目       | 内容                         |
| ---------- | ---------------------------- |
| ID         | TASK-003                     |
| 関連要件   | REQ-PARSE-001, REQ-PARSE-004 |
| 規模       | L                            |
| 依存タスク | TASK-002                     |

### 実装概要

AST からエクスポートされた React コンポーネントを検出する。関数コンポーネント、クラスコンポーネント、memo/forwardRef/HOC ラップを処理する。

### 対象ファイル

- `packages/core/src/detector/index.ts`
- `packages/core/src/detector/function-component.ts`
- `packages/core/src/detector/class-component.ts`
- `packages/core/src/detector/wrapper-unwrap.ts`

### 実装ステップ

1. エクスポートされた関数宣言/式からJSXを返すものを検出
2. クラスコンポーネント（extends React.Component）を検出
3. `React.memo()` ラップの検出とアンラップ
4. `React.forwardRef()` ラップの検出とアンラップ
5. HOC パターン（`withXxx(Component)` 形式）の検出
6. ネストしたラップ（`memo(forwardRef(...))`）の処理
7. フィクスチャーを使ったテスト作成
