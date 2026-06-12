mod cosine;
mod jsx_compare;
mod props_compare;

use crate::types::*;
use crate::vector;

pub use cosine::cosine_similarity;

pub fn compute_all_similarities(
    components: &[NormalizedComponentData],
    config: &SimilarityConfig,
) -> Vec<SimilarityResult> {
    if components.len() < 2 {
        return vec![];
    }

    let vectors = vector::generate_all(components);
    let filter_threshold = config.filter_threshold.unwrap_or(0.3);

    let mut results = Vec::new();

    for i in 0..components.len() {
        for j in (i + 1)..components.len() {
            let cosine = cosine::cosine_similarity(&vectors[i].values, &vectors[j].values);
            if cosine < filter_threshold {
                continue;
            }

            let props_score = props_compare::compare_props(
                &components[i].props,
                &components[j].props,
            );
            let jsx_score = jsx_compare::compare_jsx(
                &components[i].jsx_tree.root,
                &components[j].jsx_tree.root,
            );
            let style_score = match (&components[i].style, &components[j].style) {
                (Some(a), Some(b)) => Some(compare_style(a, b)),
                _ => None,
            };
            let behavior_score = match (&components[i].behavior, &components[j].behavior) {
                (Some(a), Some(b)) => Some(compare_behavior(a, b)),
                _ => None,
            };

            let overall = weighted_score(
                props_score,
                jsx_score,
                style_score,
                behavior_score,
                &config.weights,
            );

            let level = classify_level(overall, &config.thresholds);
            if level.is_none() {
                continue;
            }

            results.push(SimilarityResult {
                pair: (components[i].id.clone(), components[j].id.clone()),
                overall_score: overall,
                breakdown: ScoreBreakdown {
                    props: props_score,
                    jsx: jsx_score,
                    style: style_score,
                    behavior: behavior_score,
                },
                level: level.unwrap(),
            });
        }
    }

    results.sort_by(|a, b| b.overall_score.partial_cmp(&a.overall_score).unwrap());
    results
}

fn weighted_score(
    props: f64,
    jsx: f64,
    style: Option<f64>,
    behavior: Option<f64>,
    weights: &Weights,
) -> f64 {
    let style_val = style.unwrap_or(0.0);
    let behavior_val = behavior.unwrap_or(0.0);

    let mut total_weight = weights.props + weights.jsx;
    let mut score = props * weights.props + jsx * weights.jsx;

    if style.is_some() {
        score += style_val * weights.style;
        total_weight += weights.style;
    }
    if behavior.is_some() {
        score += behavior_val * weights.behavior;
        total_weight += weights.behavior;
    }

    if total_weight > 0.0 {
        score / total_weight
    } else {
        0.0
    }
}

fn classify_level(score: f64, thresholds: &[ThresholdLevel]) -> Option<String> {
    let mut sorted: Vec<&ThresholdLevel> = thresholds.iter().collect();
    sorted.sort_by(|a, b| b.min_score.partial_cmp(&a.min_score).unwrap());

    for level in sorted {
        if score >= level.min_score {
            return Some(level.name.clone());
        }
    }
    None
}

fn compare_style(a: &NormalizedStyleInfo, b: &NormalizedStyleInfo) -> f64 {
    let mut score = 0.0;
    let mut count = 0.0;

    if !a.class_names.is_empty() || !b.class_names.is_empty() {
        let common = a.class_names.iter().filter(|c| b.class_names.contains(c)).count();
        let total = a.class_names.len().max(b.class_names.len());
        if total > 0 {
            score += common as f64 / total as f64;
        }
        count += 1.0;
    }

    if a.styled_components == b.styled_components {
        score += 1.0;
    }
    count += 1.0;

    if a.css_modules == b.css_modules {
        score += 1.0;
    }
    count += 1.0;

    if count > 0.0 { score / count } else { 0.0 }
}

fn compare_behavior(a: &NormalizedBehaviorInfo, b: &NormalizedBehaviorInfo) -> f64 {
    if a.hooks.is_empty() && b.hooks.is_empty() {
        return 1.0;
    }
    if a.hooks.is_empty() || b.hooks.is_empty() {
        return 0.0;
    }

    let a_names: Vec<&str> = a.hooks.iter().map(|h| h.name.as_str()).collect();
    let b_names: Vec<&str> = b.hooks.iter().map(|h| h.name.as_str()).collect();

    let common = a_names.iter().filter(|n| b_names.contains(n)).count();
    let total = a_names.len().max(b_names.len());

    if total > 0 { common as f64 / total as f64 } else { 0.0 }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_config() -> SimilarityConfig {
        SimilarityConfig {
            weights: Weights { props: 0.5, jsx: 0.35, style: 0.1, behavior: 0.05 },
            thresholds: vec![
                ThresholdLevel { name: "high".into(), min_score: 0.9 },
                ThresholdLevel { name: "medium".into(), min_score: 0.7 },
            ],
            filter_threshold: Some(0.0),
        }
    }

    fn make_component(id: &str, props: Vec<PropEntry>, root: JSXNode) -> NormalizedComponentData {
        NormalizedComponentData {
            id: id.into(),
            name: id.into(),
            file_path: format!("{id}.tsx"),
            line: 1,
            props: NormalizedProps {
                properties: props.clone(),
                property_count: props.len(),
            },
            jsx_tree: NormalizedJSXTree { root },
            style: None,
            behavior: None,
        }
    }

    fn make_prop(name: &str, sig: &str) -> PropEntry {
        PropEntry { name: name.into(), type_signature: sig.into(), optional: false }
    }

    fn button_component(id: &str) -> NormalizedComponentData {
        make_component(
            id,
            vec![
                make_prop("onClick", "() => void"),
                make_prop("children", "ReactNode"),
            ],
            JSXNode::Element {
                tag: "button".into(),
                attributes: vec![JSXAttribute { name: "onClick".into(), value_type: "expression".into() }],
                children: vec![JSXNode::Text],
                is_component: false,
            },
        )
    }

    #[test]
    fn identical_components_score_high() {
        let components = vec![button_component("a"), button_component("b")];
        let results = compute_all_similarities(&components, &make_config());
        assert_eq!(results.len(), 1);
        assert!(results[0].overall_score > 0.9);
        assert_eq!(results[0].level, "high");
    }

    #[test]
    fn different_components_score_lower() {
        let components = vec![
            button_component("button"),
            make_component(
                "header",
                vec![make_prop("title", "string")],
                JSXNode::Element {
                    tag: "h1".into(),
                    attributes: vec![],
                    children: vec![JSXNode::Text],
                    is_component: false,
                },
            ),
        ];
        let results = compute_all_similarities(&components, &make_config());
        // May or may not pass threshold, but score should be lower
        if !results.is_empty() {
            assert!(results[0].overall_score < 0.9);
        }
    }

    #[test]
    fn empty_input_returns_empty() {
        assert!(compute_all_similarities(&[], &make_config()).is_empty());
    }

    #[test]
    fn single_component_returns_empty() {
        let results = compute_all_similarities(&[button_component("a")], &make_config());
        assert!(results.is_empty());
    }

    #[test]
    fn results_sorted_by_score_descending() {
        let components = vec![
            button_component("a"),
            button_component("b"),
            make_component(
                "c",
                vec![make_prop("onClick", "() => void")],
                JSXNode::Element {
                    tag: "button".into(),
                    attributes: vec![],
                    children: vec![],
                    is_component: false,
                },
            ),
        ];
        let results = compute_all_similarities(&components, &make_config());
        for w in results.windows(2) {
            assert!(w[0].overall_score >= w[1].overall_score);
        }
    }

    #[test]
    fn classify_level_picks_highest_matching() {
        let thresholds = vec![
            ThresholdLevel { name: "high".into(), min_score: 0.9 },
            ThresholdLevel { name: "medium".into(), min_score: 0.7 },
        ];
        assert_eq!(classify_level(0.95, &thresholds), Some("high".into()));
        assert_eq!(classify_level(0.8, &thresholds), Some("medium".into()));
        assert_eq!(classify_level(0.5, &thresholds), None);
    }

    #[test]
    fn weighted_score_normalizes_without_optional() {
        let w = Weights { props: 0.5, jsx: 0.35, style: 0.1, behavior: 0.05 };
        let score = weighted_score(1.0, 1.0, None, None, &w);
        assert!((score - 1.0).abs() < 1e-10);
    }
}
