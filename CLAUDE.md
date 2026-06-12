# doppel-ts

React コンポーネントの類似度測定・重複検知ライブラリ。TypeScript + Rust (napi-rs) ハイブリッド。

## プロジェクト構成

```
packages/core    — 解析エンジン（TS）: パーサー抽象レイヤー、コンポーネント検出、Props/JSX抽出
packages/native  — 類似度計算（Rust）: 特徴ベクトル生成、コサイン類似度、Tree Edit Distance
packages/cli     — CLI エントリポイント
```

## ツールチェイン

mise で管理。`mise install` で全ツールが揃う。

- Node.js 22 / pnpm 10 / Rust stable
- ビルド: tsup (TS), cargo (Rust)
- テスト: vitest (TS), cargo test (Rust)
- Lint: oxlint
- Format: oxfmt
- CI: Forgejo Actions + jdx/mise-action@v2

## コマンド

```bash
mise run ci          # 全チェック一括実行
mise run build       # core + cli ビルド
mise run build:native # Rust ビルド
mise run test        # TS テスト
mise run test:native # Rust テスト
mise run lint        # oxlint
mise run fmt         # oxfmt
mise run fmt:check   # フォーマット確認
mise run typecheck   # tsc --noEmit
```

## 実装フロー

タスク着手から完了までの標準フロー。

### 1. キックオフ (/kickoff)

- タスクの不明点・曖昧点を洗い出し、実装前に解消する
- git フローは確定済み: feature ブランチ + PR

### 2. ブランチ作成

```bash
git checkout -b feat/<task-name>
```

### 3. 実装

- `docs/specifications/` の仕様に準拠して実装
- テストを書く（TS: vitest, Rust: cargo test）

### 4. チェック

コミット前に必ず実行:

```bash
mise run fmt         # フォーマット適用
mise run lint        # lint 確認
mise run fmt:check   # フォーマット確認
```

TS を変更した場合:

```bash
mise run build       # ビルド確認
mise run test        # テスト確認
```

Rust を変更した場合:

```bash
mise run cargo:check # コンパイル確認
mise run test:native # テスト確認
```

### 5. コミット

- Conventional Commits: `feat:`, `fix:`, `docs:`, `style:`, `ci:`, `chore:`
- 論理単位で分割（フォーマット変更と機能変更は分ける）

### 6. PR 作成

```bash
git push -u origin feat/<task-name>
fj pr create --base main --head feat/<task-name> --body "..." "<title>"
```

PR 本文の形式:

```
## Summary
- 箇条書きで変更内容

## Test plan
- [x] チェック済み項目
```

### 7. 進行状況更新

マージ後、`docs/implementation/plan.md` のステータスと決定事項ログを更新。

## 注意事項

- `pnpm -r build` は native パッケージの Rust ビルドも含むため、TS のみビルドする場合は `pnpm --filter @doppel-ts/core --filter doppel-ts build`
- typecheck は core をビルドしてからでないと cli の型解決が失敗する（workspace 依存）
- Rust の dead_code 警告は未実装タスクのフィールドに起因するため、現時点では許容
