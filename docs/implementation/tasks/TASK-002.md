## TASK-002: パーサー抽象レイヤー設計・実装

| 項目 | 内容 |
|------|------|
| ID | TASK-002 |
| 関連要件 | REQ-PARSE-005 |
| 規模 | M |
| 依存タスク | TASK-001 |

### 実装概要

パーサーインターフェースを定義し、TypeScript 6 Compiler API による初期実装を作成する。将来の SWC/Strada 対応を見据えた抽象化。

### 対象ファイル

- `packages/core/src/parser/interface.ts`
- `packages/core/src/parser/ts-compiler/index.ts`
- `packages/core/src/parser/ts-compiler/program.ts`

### 実装ステップ

1. `ParserInterface` の型定義を設計
2. 入出力となるデータ型（ComponentInfo, PropsInfo, NormalizedJSXTree）を定義
3. TypeScript 6 Compiler API を用いた `TS6CompilerParser` クラスを実装
4. `ts.createProgram` によるプログラム生成と型チェッカー取得
5. ユニットテスト作成
