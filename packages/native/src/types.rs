use serde::{Deserialize, Serialize};

// --- Input types (TS → Rust) ---

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NormalizedComponentData {
    pub id: String,
    pub name: String,
    pub file_path: String,
    pub line: u32,
    pub props: NormalizedProps,
    pub jsx_tree: NormalizedJSXTree,
    #[serde(default)]
    pub style: Option<NormalizedStyleInfo>,
    #[serde(default)]
    pub behavior: Option<NormalizedBehaviorInfo>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NormalizedProps {
    pub properties: Vec<PropEntry>,
    pub property_count: usize,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PropEntry {
    pub name: String,
    pub type_signature: String,
    pub optional: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NormalizedJSXTree {
    pub root: JSXNode,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum JSXNode {
    Element {
        tag: String,
        attributes: Vec<JSXAttribute>,
        children: Vec<JSXNode>,
        #[serde(rename = "isComponent")]
        is_component: bool,
    },
    Fragment {
        children: Vec<JSXNode>,
    },
    Text,
    Expression {
        #[serde(rename = "expressionType")]
        expression_type: String,
        children: Vec<JSXNode>,
    },
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JSXAttribute {
    pub name: String,
    pub value_type: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NormalizedStyleInfo {
    pub class_names: Vec<String>,
    pub styled_components: bool,
    pub css_modules: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NormalizedBehaviorInfo {
    pub hooks: Vec<HookEntry>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HookEntry {
    pub name: String,
    #[serde(default)]
    pub deps_count: Option<u32>,
}

// --- Config types (TS → Rust) ---

#[derive(Debug, Clone, Deserialize)]
pub struct SimilarityConfig {
    pub weights: Weights,
    pub thresholds: Vec<ThresholdLevel>,
    #[serde(default)]
    pub filter_threshold: Option<f64>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Weights {
    pub props: f64,
    pub jsx: f64,
    pub style: f64,
    pub behavior: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThresholdLevel {
    pub name: String,
    pub min_score: f64,
}

// --- Output types (Rust → TS) ---

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SimilarityResult {
    pub pair: (String, String),
    pub overall_score: f64,
    pub breakdown: ScoreBreakdown,
    pub level: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ScoreBreakdown {
    pub props: f64,
    pub jsx: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub behavior: Option<f64>,
}

// --- Internal types ---

#[derive(Debug, Clone)]
pub struct FeatureVector {
    pub component_id: String,
    pub values: Vec<f64>,
}

// --- Batch I/O ---

#[derive(Debug, Deserialize)]
pub struct BatchInput {
    pub components: Vec<NormalizedComponentData>,
    pub config: SimilarityConfig,
}

#[derive(Debug, Serialize)]
pub struct BatchOutput {
    pub results: Vec<SimilarityResult>,
}
