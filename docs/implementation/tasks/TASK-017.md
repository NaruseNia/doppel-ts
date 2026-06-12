## TASK-017: npm 配布・CI 設定

| 項目 | 内容 |
|------|------|
| ID | TASK-017 |
| 関連要件 | REQ-INFRA-002, REQ-INFRA-003, REQ-INFRA-004 |
| 規模 | M |
| 依存タスク | TASK-015 |

### 実装概要

npm パッケージとしての配布設定、プリビルドバイナリ、CI/CD パイプラインを構築する。

### 対象ファイル

- `packages/cli/package.json`（bin フィールド）
- `packages/native/package.json`（napi 設定）
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `packages/native/npm/*/package.json`（プラットフォーム別）

### 実装ステップ

1. cli パッケージの bin フィールド設定
2. core パッケージの exports 設定（プログラマティック API）
3. napi-rs のプリビルド設定（linux-x64, darwin-x64, darwin-arm64, win32-x64）
4. CI ワークフロー（lint, test, build の Node.js v20/v22 + Bun マトリクス）
5. リリースワークフロー（バージョニング、npm publish、プリビルドアップロード）
6. README のバッジ設定
