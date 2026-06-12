use crate::types::NormalizedProps;

pub fn compare_props(a: &NormalizedProps, b: &NormalizedProps) -> f64 {
    if a.properties.is_empty() && b.properties.is_empty() {
        return 1.0;
    }
    if a.properties.is_empty() || b.properties.is_empty() {
        return 0.0;
    }

    let name_score = name_similarity(a, b);
    let type_score = type_similarity(a, b);
    let optional_score = optional_similarity(a, b);

    name_score * 0.5 + type_score * 0.35 + optional_score * 0.15
}

fn name_similarity(a: &NormalizedProps, b: &NormalizedProps) -> f64 {
    let a_names: Vec<&str> = a.properties.iter().map(|p| p.name.as_str()).collect();
    let b_names: Vec<&str> = b.properties.iter().map(|p| p.name.as_str()).collect();

    let common = a_names.iter().filter(|n| b_names.contains(n)).count();
    let total = a_names.len().max(b_names.len());

    if total > 0 { common as f64 / total as f64 } else { 0.0 }
}

fn type_similarity(a: &NormalizedProps, b: &NormalizedProps) -> f64 {
    let a_sigs: Vec<&str> = a.properties.iter().map(|p| p.type_signature.as_str()).collect();
    let b_sigs: Vec<&str> = b.properties.iter().map(|p| p.type_signature.as_str()).collect();

    let mut matched = 0;
    let mut used = vec![false; b_sigs.len()];

    for a_sig in &a_sigs {
        for (j, b_sig) in b_sigs.iter().enumerate() {
            if !used[j] && a_sig == b_sig {
                matched += 1;
                used[j] = true;
                break;
            }
        }
    }

    let total = a_sigs.len().max(b_sigs.len());
    if total > 0 { matched as f64 / total as f64 } else { 0.0 }
}

fn optional_similarity(a: &NormalizedProps, b: &NormalizedProps) -> f64 {
    let a_names: Vec<&str> = a.properties.iter().map(|p| p.name.as_str()).collect();
    let b_map: std::collections::HashMap<&str, bool> =
        b.properties.iter().map(|p| (p.name.as_str(), p.optional)).collect();

    let mut matches = 0;
    let mut total = 0;

    for prop in &a.properties {
        if let Some(&b_optional) = b_map.get(prop.name.as_str()) {
            total += 1;
            if prop.optional == b_optional {
                matches += 1;
            }
        }
    }

    // Count props only in b
    for prop in &b.properties {
        if !a_names.contains(&prop.name.as_str()) {
            total += 1;
        }
    }

    if total > 0 { matches as f64 / total as f64 } else { 1.0 }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::PropEntry;

    fn make_props(entries: &[(&str, &str, bool)]) -> NormalizedProps {
        let properties: Vec<PropEntry> = entries
            .iter()
            .map(|(name, sig, opt)| PropEntry {
                name: name.to_string(),
                type_signature: sig.to_string(),
                optional: *opt,
            })
            .collect();
        let count = properties.len();
        NormalizedProps { properties, property_count: count }
    }

    #[test]
    fn identical_props_score_one() {
        let props = make_props(&[("onClick", "() => void", false), ("children", "ReactNode", false)]);
        assert!((compare_props(&props, &props) - 1.0).abs() < 1e-10);
    }

    #[test]
    fn completely_different_props() {
        let a = make_props(&[("onClick", "() => void", false)]);
        let b = make_props(&[("title", "string", false)]);
        let score = compare_props(&a, &b);
        assert!(score < 0.5);
    }

    #[test]
    fn partially_overlapping_props() {
        let a = make_props(&[("onClick", "() => void", false), ("children", "ReactNode", false)]);
        let b = make_props(&[("onClick", "() => void", false), ("label", "string", false)]);
        let score = compare_props(&a, &b);
        assert!(score > 0.3 && score < 0.8);
    }

    #[test]
    fn empty_props_score_one() {
        let a = make_props(&[]);
        assert!((compare_props(&a, &a) - 1.0).abs() < 1e-10);
    }
}
