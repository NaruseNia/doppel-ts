## TASK-001: monorepo 基盤構築

| 項目 | 内容 |
|------|------|
| ID | TASK-001 |
| 関連要件 | REQ-INFRA-001, REQ-INFRA-005 |
| 規模 | M |
| 依存タスク | なし |

### 実装概要

pnpm workspace による monorepo 構成を構築する。3パッケージ（core, native, cli）のスケルトン、ライセンスファイル、基本的なビルド設定を整える。

### 対象ファイル

- `pnpm-workspace.yaml`
- `package.json`（ルート）
- `packages/core/package.json`
- `packages/core/tsconfig.json`
- `packages/native/package.json`
- `packages/native/Cargo.toml`
- `packages/cli/package.json`
- `packages/cli/tsconfig.json`
- `LICENSE-MIT`
- `LICENSE-APACHE`

### 実装ステップ

1. pnpm-workspace.yaml に packages/* を定義
2. ルート package.json にワークスペーススクリプトを定義
3. 各パッケージの package.json を作成（依存関係含む）
4. TypeScript 設定（tsconfig.json）を作成
5. Cargo.toml（native パッケージ）を作成
6. ライセンスファイルを配置
7. `pnpm install` と `pnpm build` が通ることを確認
