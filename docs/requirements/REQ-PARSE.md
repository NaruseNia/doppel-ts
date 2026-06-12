# AST 解析・コンポーネント検出 要件定義

## REQ-PARSE-001: React コンポーネント検出

| 項目 | 内容 |
|------|------|
| ID | REQ-PARSE-001 |
| 優先度 | Must |
| ステータス | Draft |

### 説明

指定されたディレクトリ内の TSX/JSX ファイルから、React コンポーネントを自動検出する。エクスポートされた関数コンポーネント・クラスコンポーネントを対象とする。

### 受入条件

- [ ] `export function Component()` 形式を検出できる
- [ ] `export default function()` 形式を検出できる
- [ ] `export const Component = () => {}` 形式を検出できる
- [ ] `export class Component extends React.Component` 形式を検出できる
- [ ] JSX を返さない関数はコンポーネントとして検出しない
- [ ] `.tsx` / `.jsx` ファイルを対象とする

### 依存要件

- なし

---

## REQ-PARSE-002: Props 型抽出

| 項目 | 内容 |
|------|------|
| ID | REQ-PARSE-002 |
| 優先度 | Must |
| ステータス | Draft |

### 説明

検出した各コンポーネントの Props 型情報を TypeScript Compiler API の型解決を用いて抽出する。interface、type alias、インライン型のいずれの定義方法にも対応する。

### 受入条件

- [ ] `interface Props { ... }` 形式の Props を抽出できる
- [ ] `type Props = { ... }` 形式の Props を抽出できる
- [ ] インライン型 `({ name, age }: { name: string; age: number })` を抽出できる
- [ ] ジェネリクスを含む Props を解決できる
- [ ] extends / intersection による合成型を展開できる
- [ ] 各プロパティの名前・型・オプショナル有無を取得できる

### 依存要件

- REQ-PARSE-001（コンポーネント検出）

---

## REQ-PARSE-003: JSX ツリー抽出

| 項目 | 内容 |
|------|------|
| ID | REQ-PARSE-003 |
| 優先度 | Must |
| ステータス | Draft |

### 説明

検出した各コンポーネントの return 文から JSX ツリーを抽出し、正規化された木構造として表現する。条件分岐による複数の return パスも考慮する。

### 受入条件

- [ ] JSX 要素のタグ名・属性・子要素を再帰的に取得できる
- [ ] Fragment（`<>...</>` / `<React.Fragment>`）を正しく処理できる
- [ ] 条件付きレンダリング（三項演算子、&& 演算子）を検出できる
- [ ] map によるリストレンダリングを検出できる
- [ ] 正規化されたツリー構造として出力できる

### 依存要件

- REQ-PARSE-001（コンポーネント検出）

---

## REQ-PARSE-004: memo/forwardRef/HOC ラップ検出

| 項目 | 内容 |
|------|------|
| ID | REQ-PARSE-004 |
| 優先度 | Must |
| ステータス | Draft |

### 説明

`React.memo()`、`React.forwardRef()`、カスタム HOC でラップされたコンポーネントを検出し、内部のコンポーネント定義を正しく抽出する。

### 受入条件

- [ ] `export const Button = memo(ButtonInner)` を検出できる
- [ ] `export const Input = forwardRef((props, ref) => ...)` を検出できる
- [ ] `export const Enhanced = withStyles(Component)` のような HOC パターンを検出できる
- [ ] ネストしたラップ `memo(forwardRef(...))` を正しく処理できる
- [ ] ラップ元のコンポーネント定義から Props と JSX を抽出できる

### 依存要件

- REQ-PARSE-001（コンポーネント検出）
- REQ-PARSE-002（Props 型抽出）
- REQ-PARSE-003（JSX ツリー抽出）

---

## REQ-PARSE-005: パーサー抽象レイヤー

| 項目 | 内容 |
|------|------|
| ID | REQ-PARSE-005 |
| 優先度 | Must |
| ステータス | Draft |

### 説明

AST 解析エンジンを差し替え可能にするインターフェース層を設計・実装する。初期実装は TypeScript 6 Compiler API のみだが、将来の SWC/oxc/Strada API への移行を見据える。

### 受入条件

- [ ] パーサーインターフェースが定義されている
- [ ] TypeScript 6 Compiler API による実装が存在する
- [ ] インターフェースを満たす別のパーサー実装を追加できる設計になっている
- [ ] コア解析ロジックがパーサー実装に直接依存していない

### 依存要件

- なし

---

## REQ-PARSE-006: ローカルコンポーネント検出

| 項目 | 内容 |
|------|------|
| ID | REQ-PARSE-006 |
| 優先度 | Could |
| ステータス | Draft |

### 説明

エクスポートされていないファイル内部のローカルコンポーネントも検出対象に含めるオプション。`--include-local` フラグまたは設定ファイルで有効化する。

### 受入条件

- [ ] `--include-local` フラグで有効化できる
- [ ] `doppel.config.ts` の設定で有効化できる
- [ ] デフォルトでは無効
- [ ] ローカルコンポーネントも他のコンポーネントと同様に類似度比較される

### 依存要件

- REQ-PARSE-001（コンポーネント検出）
- REQ-CLI-007（--include-local フラグ）
