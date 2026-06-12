# 設定 要件定義

## REQ-CONFIG-001: doppel.config.ts サポート

| 項目       | 内容           |
| ---------- | -------------- |
| ID         | REQ-CONFIG-001 |
| 優先度     | Must           |
| ステータス | Draft          |

### 説明

プロジェクトルートの `doppel.config.ts` による設定ファイルをサポートする。TypeScript 形式で型安全な設定を記述できる。

### 受入条件

- [ ] `doppel.config.ts` を自動検出して読み込む
- [ ] `doppel.config.js` / `doppel.config.mjs` もフォールバックとしてサポートする
- [ ] 設定ファイルが存在しない場合はデフォルト値で動作する
- [ ] 設定の型定義を `doppel-ts` パッケージからエクスポートする
- [ ] CLI フラグが設定ファイルより優先される

### 依存要件

- なし

---

## REQ-CONFIG-002: include/exclude 設定

| 項目       | 内容           |
| ---------- | -------------- |
| ID         | REQ-CONFIG-002 |
| 優先度     | Must           |
| ステータス | Draft          |

### 説明

設定ファイルでスキャン対象の include/exclude パターンを定義する。

### 受入条件

- [ ] `include` に glob パターンの配列を指定できる
- [ ] `exclude` に glob パターンの配列を指定できる
- [ ] CLI の位置引数が `include` を上書きする
- [ ] CLI の `--exclude` と設定ファイルの `exclude` がマージされる
- [ ] デフォルト exclude: `["**/*.test.*", "**/*.spec.*", "**/*.stories.*", "**/node_modules/**"]`

### 依存要件

- REQ-CONFIG-001（doppel.config.ts サポート）

---

## REQ-CONFIG-003: 閾値設定

| 項目       | 内容           |
| ---------- | -------------- |
| ID         | REQ-CONFIG-003 |
| 優先度     | Must           |
| ステータス | Draft          |

### 説明

類似度判定の閾値を設定ファイルで定義する。多段階レベルの定義も可能。

### 受入条件

- [ ] 単一の閾値を設定できる（`threshold: 0.7`）
- [ ] 多段階レベルを定義できる（`levels: { high: 0.9, medium: 0.7 }`）
- [ ] カスタムレベル名を定義できる
- [ ] デフォルト: `{ high: 0.9, medium: 0.7 }`

### 依存要件

- REQ-CONFIG-001（doppel.config.ts サポート）

---

## REQ-CONFIG-004: 類似度指標の重み付け設定

| 項目       | 内容           |
| ---------- | -------------- |
| ID         | REQ-CONFIG-004 |
| 優先度     | Must           |
| ステータス | Draft          |

### 説明

各類似度指標（Props、JSX、スタイル、振る舞い）の重み付けを設定する。

### 受入条件

- [ ] `weights: { props: 0.5, jsx: 0.3, style: 0.1, behavior: 0.1 }` 形式で指定できる
- [ ] 重みの合計が 1.0 になるようバリデーションする
- [ ] 重み 0 の指標は計算をスキップする（パフォーマンス最適化）
- [ ] デフォルト: `{ props: 0.5, jsx: 0.35, style: 0.1, behavior: 0.05 }`

### 依存要件

- REQ-CONFIG-001（doppel.config.ts サポート）

---

## REQ-CONFIG-005: suppress 設定（ペア除外）

| 項目       | 内容           |
| ---------- | -------------- |
| ID         | REQ-CONFIG-005 |
| 優先度     | Must           |
| ステータス | Draft          |

### 説明

意図的に類似しているコンポーネントペアを検出結果から除外する。設定ファイルによるペア単位の suppress と、ソースコード内の `// doppel-ignore` コメントの両方をサポート。

### 受入条件

- [ ] 設定ファイルで除外ペアを指定できる（`suppress: [["ComponentA", "ComponentB"]]`）
- [ ] glob パターンで除外できる（`suppress: [["*Button*", "*Btn*"]]`）
- [ ] コンポーネント定義の直前に `// doppel-ignore` コメントで個別に除外できる
- [ ] suppress されたペアは JSON 出力にも含まれない
- [ ] `--no-suppress` フラグで suppress を無効化できる

### 依存要件

- REQ-CONFIG-001（doppel.config.ts サポート）
