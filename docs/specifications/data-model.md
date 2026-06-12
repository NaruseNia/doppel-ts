# データモデル仕様書: doppel-ts

## 概要

doppel-ts の内部データモデルとJSON出力スキーマを定義する。TS ↔ Rust 間の FFI 境界を含む。

## 内部データモデル

### ComponentInfo

コンポーネント検出結果。

```typescript
interface ComponentInfo {
  name: string; // コンポーネント名
  filePath: string; // ファイルパス
  line: number; // 定義開始行
  column: number; // 定義開始列
  exportType: "named" | "default"; // エクスポート種別
  wrappers: WrapperType[]; // ラッパー（memo, forwardRef, HOC）
  isLocal: boolean; // ローカルコンポーネントか
}

type WrapperType = "memo" | "forwardRef" | { hoc: string };
```

### PropsInfo

Props 型情報。

```typescript
interface PropsInfo {
  properties: PropProperty[];
  hasChildren: boolean; // children prop の有無
  hasRef: boolean; // ref prop の有無（forwardRef）
}

interface PropProperty {
  name: string; // プロパティ名
  type: TypeDescriptor; // 型情報
  optional: boolean; // オプショナルか
  defaultValue?: string; // デフォルト値（ある場合）
}

type TypeDescriptor =
  | { kind: "primitive"; name: string } // string, number, boolean
  | { kind: "literal"; value: string } // "dark" | "light"
  | { kind: "union"; members: TypeDescriptor[] } // A | B
  | { kind: "intersection"; members: TypeDescriptor[] } // A & B
  | { kind: "array"; element: TypeDescriptor } // T[]
  | { kind: "function"; params: TypeDescriptor[]; returnType: TypeDescriptor }
  | { kind: "object"; properties: PropProperty[] } // { key: value }
  | { kind: "reference"; name: string } // 外部型参照
  | { kind: "generic"; name: string; args: TypeDescriptor[] };
```

### NormalizedJSXTree

正規化された JSX ツリー。

```typescript
interface NormalizedJSXTree {
  root: JSXNode;
}

type JSXNode = JSXElementNode | JSXFragmentNode | JSXTextNode | JSXExpressionNode;

interface JSXElementNode {
  kind: "element";
  tag: string; // タグ名（div, Button 等）
  attributes: JSXAttribute[]; // 属性
  children: JSXNode[]; // 子要素
  isComponent: boolean; // カスタムコンポーネントか HTML 要素か
}

interface JSXFragmentNode {
  kind: "fragment";
  children: JSXNode[];
}

interface JSXTextNode {
  kind: "text";
}

interface JSXExpressionNode {
  kind: "expression";
  expressionType: "conditional" | "map" | "call" | "other";
  children: JSXNode[]; // 内部に含まれる JSX
}

interface JSXAttribute {
  name: string;
  valueType: "string" | "expression" | "spread" | "boolean";
}
```

### NormalizedComponentData

Rust に渡す正規化済みデータ。JSON シリアライズ可能。

```typescript
interface NormalizedComponentData {
  id: string; // 一意な識別子（filePath:name）
  name: string;
  filePath: string;
  line: number;
  props: NormalizedProps;
  jsxTree: NormalizedJSXTree;
  style?: NormalizedStyleInfo;
  behavior?: NormalizedBehaviorInfo;
}

interface NormalizedProps {
  properties: Array<{
    name: string;
    typeSignature: string; // 正規化された型シグネチャ文字列
    optional: boolean;
  }>;
  propertyCount: number;
}

interface NormalizedStyleInfo {
  classNames: string[];
  styledComponents: boolean;
  cssModules: boolean;
}

interface NormalizedBehaviorInfo {
  hooks: Array<{
    name: string; // useState, useEffect 等
    depsCount?: number; // 依存配列の要素数
  }>;
}
```

## Rust 側データ構造

### 特徴ベクトル

```rust
pub struct FeatureVector {
    pub component_id: String,
    pub values: Vec<f64>,          // 固定次元の特徴ベクトル
}
```

### 類似度結果

```rust
pub struct SimilarityResult {
    pub pair: (String, String),     // (component_id_a, component_id_b)
    pub overall_score: f64,         // 総合類似度 (0.0-1.0)
    pub breakdown: ScoreBreakdown,  // 指標別内訳
    pub level: String,              // "high" | "medium" 等
}

pub struct ScoreBreakdown {
    pub props: f64,
    pub jsx: f64,
    pub style: Option<f64>,
    pub behavior: Option<f64>,
}
```

## JSON 出力スキーマ

### リッチ JSON（デフォルト）

```json
{
  "meta": {
    "version": "1.0.0",
    "timestamp": "2026-06-12T10:00:00Z",
    "scanPaths": ["src/components"],
    "config": {
      "threshold": { "high": 0.9, "medium": 0.7 },
      "weights": { "props": 0.5, "jsx": 0.35, "style": 0.1, "behavior": 0.05 }
    },
    "totalComponents": 150,
    "totalPairs": 12
  },
  "pairs": [
    {
      "score": 0.92,
      "level": "high",
      "breakdown": {
        "props": 0.95,
        "jsx": 0.88,
        "style": 0.9,
        "behavior": 0.85
      },
      "componentA": {
        "name": "PrimaryButton",
        "filePath": "src/components/PrimaryButton.tsx",
        "line": 5,
        "props": [
          { "name": "onClick", "type": "() => void", "optional": false },
          { "name": "children", "type": "ReactNode", "optional": false },
          { "name": "disabled", "type": "boolean", "optional": true }
        ],
        "jsxTree": { "...": "normalized tree structure" }
      },
      "componentB": {
        "name": "SubmitButton",
        "filePath": "src/components/SubmitButton.tsx",
        "line": 8,
        "props": [
          { "name": "onSubmit", "type": "() => void", "optional": false },
          { "name": "children", "type": "ReactNode", "optional": false },
          { "name": "disabled", "type": "boolean", "optional": true }
        ],
        "jsxTree": { "...": "normalized tree structure" }
      },
      "diff": {
        "commonProps": ["children", "disabled"],
        "uniqueToA": ["onClick"],
        "uniqueToB": ["onSubmit"],
        "jsxDiffSummary": "Root structure identical, 1 attribute name difference"
      }
    }
  ]
}
```

### ミニマル JSON（--minimal）

```json
{
  "meta": {
    "version": "1.0.0",
    "totalComponents": 150,
    "totalPairs": 12
  },
  "pairs": [
    {
      "score": 0.92,
      "level": "high",
      "a": { "name": "PrimaryButton", "path": "src/components/PrimaryButton.tsx" },
      "b": { "name": "SubmitButton", "path": "src/components/SubmitButton.tsx" }
    }
  ]
}
```

## 設定ファイルスキーマ

### doppel.config.ts

```typescript
import { defineConfig } from "doppel-ts";

export default defineConfig({
  include: ["src/components/**/*.tsx"],
  exclude: ["**/*.test.tsx", "**/*.stories.tsx"],

  threshold: {
    high: 0.9,
    medium: 0.7,
  },

  weights: {
    props: 0.5,
    jsx: 0.35,
    style: 0.1,
    behavior: 0.05,
  },

  suppress: [
    ["BaseButton", "IconButton"], // 名前指定
    ["*Layout*", "*Container*"], // glob パターン
  ],

  includeLocal: false,
});
```

## 関連要件

- REQ-PARSE-002（Props 型抽出）
- REQ-PARSE-003（JSX ツリー抽出）
- REQ-CLI-009（リッチ JSON 出力）
- REQ-CLI-006（--minimal フラグ）
- REQ-NATIVE-004（バッチ処理インターフェース）
- REQ-CONFIG-001〜005（設定全般）
