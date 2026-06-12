use napi_derive::napi;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NormalizedComponentData {
    pub id: String,
    pub name: String,
    pub file_path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SimilarityResult {
    pub pair: (String, String),
    pub overall_score: f64,
    pub level: String,
}

#[napi]
pub fn compute_similarity(components_json: String) -> napi::Result<String> {
    let _components: Vec<NormalizedComponentData> =
        serde_json::from_str(&components_json).map_err(|e| {
            napi::Error::from_reason(format!("Failed to parse components: {e}"))
        })?;

    let results: Vec<SimilarityResult> = vec![];
    serde_json::to_string(&results)
        .map_err(|e| napi::Error::from_reason(format!("Failed to serialize results: {e}")))
}
