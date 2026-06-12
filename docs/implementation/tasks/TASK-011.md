## TASK-011: 設定ファイルローダー

| 項目       | 内容                                                                           |
| ---------- | ------------------------------------------------------------------------------ |
| ID         | TASK-011                                                                       |
| 関連要件   | REQ-CONFIG-001, REQ-CONFIG-002, REQ-CONFIG-003, REQ-CONFIG-004, REQ-CONFIG-005 |
| 規模       | M                                                                              |
| 依存タスク | TASK-001                                                                       |

### 実装概要

doppel.config.ts / .js / .mjs の読み込み、バリデーション、デフォルト値マージを実装する。設定型定義のエクスポートも含む。

### 対象ファイル

- `packages/core/src/config/loader.ts`
- `packages/core/src/config/schema.ts`
- `packages/core/src/config/defaults.ts`
- `packages/core/src/config/index.ts`

### 実装ステップ

1. 設定スキーマの型定義（DoppelConfig）
2. デフォルト値の定義
3. 設定ファイルの探索と読み込み（.ts, .js, .mjs）
4. バリデーション（重み合計 = 1.0、閾値範囲等）
5. CLI フラグとのマージ（CLI 優先）
6. `defineConfig` ヘルパー関数のエクスポート
7. suppress 設定のパース（名前指定、glob パターン）
8. ユニットテスト
