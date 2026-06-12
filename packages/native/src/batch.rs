use crate::similarity;
use crate::types::{BatchInput, BatchOutput};

pub fn process_batch(input: BatchInput) -> BatchOutput {
    let results = similarity::compute_all_similarities(&input.components, &input.config);
    BatchOutput { results }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::*;

    fn make_config() -> SimilarityConfig {
        SimilarityConfig {
            weights: Weights {
                props: 0.5,
                jsx: 0.35,
                style: 0.1,
                behavior: 0.05,
            },
            thresholds: vec![
                ThresholdLevel {
                    name: "high".to_string(),
                    min_score: 0.9,
                },
                ThresholdLevel {
                    name: "medium".to_string(),
                    min_score: 0.7,
                },
            ],
            filter_threshold: None,
        }
    }

    fn make_component(id: &str, name: &str) -> NormalizedComponentData {
        NormalizedComponentData {
            id: id.to_string(),
            name: name.to_string(),
            file_path: format!("src/{name}.tsx"),
            line: 1,
            props: NormalizedProps {
                properties: vec![],
                property_count: 0,
            },
            jsx_tree: NormalizedJSXTree {
                root: JSXNode::Fragment {
                    children: vec![],
                },
            },
            style: None,
            behavior: None,
        }
    }

    #[test]
    fn empty_input_returns_empty_results() {
        let input = BatchInput {
            components: vec![],
            config: make_config(),
        };
        let output = process_batch(input);
        assert!(output.results.is_empty());
    }

    #[test]
    fn single_component_returns_empty_results() {
        let input = BatchInput {
            components: vec![make_component("a:Button", "Button")],
            config: make_config(),
        };
        let output = process_batch(input);
        assert!(output.results.is_empty());
    }

    #[test]
    fn batch_input_deserializes_from_json() {
        let json = r#"{
            "components": [
                {
                    "id": "src/Button.tsx:Button",
                    "name": "Button",
                    "filePath": "src/Button.tsx",
                    "line": 5,
                    "props": {
                        "properties": [
                            {"name": "onClick", "typeSignature": "() => void", "optional": false}
                        ],
                        "propertyCount": 1
                    },
                    "jsxTree": {
                        "root": {
                            "kind": "element",
                            "tag": "button",
                            "attributes": [{"name": "onClick", "valueType": "expression"}],
                            "children": [{"kind": "text"}],
                            "isComponent": false
                        }
                    }
                }
            ],
            "config": {
                "weights": {"props": 0.5, "jsx": 0.35, "style": 0.1, "behavior": 0.05},
                "thresholds": [{"name": "high", "minScore": 0.9}]
            }
        }"#;

        let input: BatchInput = serde_json::from_str(json).unwrap();
        assert_eq!(input.components.len(), 1);
        assert_eq!(input.components[0].name, "Button");
        assert_eq!(input.components[0].props.property_count, 1);
    }

    #[test]
    fn batch_output_serializes_to_json() {
        let output = BatchOutput {
            results: vec![SimilarityResult {
                pair: ("a".to_string(), "b".to_string()),
                overall_score: 0.92,
                breakdown: ScoreBreakdown {
                    props: 0.95,
                    jsx: 0.88,
                    style: Some(0.9),
                    behavior: None,
                },
                level: "high".to_string(),
            }],
        };
        let json = serde_json::to_string(&output).unwrap();
        assert!(json.contains("\"overallScore\":0.92"));
        assert!(json.contains("\"level\":\"high\""));
        assert!(!json.contains("\"behavior\""));
    }
}
