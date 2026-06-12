mod batch;
mod types;
pub mod vector;

use napi_derive::napi;
use types::{BatchInput, BatchOutput};

#[napi]
pub fn compute_similarity(input_json: String) -> napi::Result<String> {
    let input: BatchInput = serde_json::from_str(&input_json)
        .map_err(|e| napi::Error::from_reason(format!("Failed to parse input: {e}")))?;

    let output: BatchOutput = batch::process_batch(input);

    serde_json::to_string(&output)
        .map_err(|e| napi::Error::from_reason(format!("Failed to serialize output: {e}")))
}
