## TASK-013: 出力フォーマッター

| 項目       | 内容                                               |
| ---------- | -------------------------------------------------- |
| ID         | TASK-013                                           |
| 関連要件   | REQ-CLI-008, REQ-CLI-005, REQ-CLI-006, REQ-CLI-009 |
| 規模       | M                                                  |
| 依存タスク | TASK-009, TASK-012                                 |

### 実装概要

ターミナル出力（色付きテーブル）、リッチ JSON、ミニマル JSON の3つの出力フォーマッターを実装する。

### 対象ファイル

- `packages/cli/src/output/terminal.ts`
- `packages/cli/src/output/json.ts`
- `packages/cli/src/output/format.ts`

### 実装ステップ

1. 出力フォーマッターのインターフェース定義
2. ターミナル出力: 色付きペアリスト、サマリー、NO_COLOR / TTY 検出
3. ターミナル出力: --detail 時の内訳表示
4. リッチ JSON: meta + pairs + diff 構造の組み立て
5. ミニマル JSON: 軽量版の組み立て
6. stdout / stderr の分離（JSON 時の進捗は stderr）
7. スナップショットテスト
