## TASK-012: CLI 実装

| 項目       | 内容                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| ID         | TASK-012                                                                                               |
| 関連要件   | REQ-CLI-001, REQ-CLI-002, REQ-CLI-003, REQ-CLI-004, REQ-CLI-005, REQ-CLI-006, REQ-CLI-007, REQ-CLI-008 |
| 規模       | M                                                                                                      |
| 依存タスク | TASK-011                                                                                               |

### 実装概要

CLI のエントリポイント、引数パーサー、ファイル探索を実装する。位置引数、各フラグ、設定ファイルとの統合。

### 対象ファイル

- `packages/cli/src/index.ts`
- `packages/cli/src/args.ts`
- `packages/cli/src/scanner.ts`

### 実装ステップ

1. 引数パーサーの実装（位置引数 + フラグ）
2. glob 展開とファイル探索
3. --exclude フラグと設定 exclude のマージ
4. --threshold / --detail / --format / --minimal / --include-local フラグの処理
5. 設定ファイルローダーとの統合
6. エントリポイント（bin フィールド設定）
7. `--help` / `--version` の実装
8. テスト
