use crate::types::JSXNode;

pub fn compare_jsx(a: &JSXNode, b: &JSXNode) -> f64 {
    let a_size = tree_size(a);
    let b_size = tree_size(b);

    if a_size == 0 && b_size == 0 {
        return 1.0;
    }
    if a_size == 0 || b_size == 0 {
        return 0.0;
    }

    let distance = tree_edit_distance(a, b);
    let max_size = a_size.max(b_size) as f64;

    (1.0 - distance as f64 / max_size).max(0.0)
}

fn tree_edit_distance(a: &JSXNode, b: &JSXNode) -> usize {
    match (a, b) {
        (JSXNode::Text, JSXNode::Text) => 0,

        (
            JSXNode::Element { tag: tag_a, children: ch_a, attributes: attr_a, .. },
            JSXNode::Element { tag: tag_b, children: ch_b, attributes: attr_b, .. },
        ) => {
            let rename_cost = if tag_a == tag_b { 0 } else { 1 };
            let attr_dist = attribute_distance(attr_a, attr_b);
            let children_dist = children_edit_distance(ch_a, ch_b);
            rename_cost + attr_dist + children_dist
        }

        (JSXNode::Fragment { children: ch_a }, JSXNode::Fragment { children: ch_b }) => {
            children_edit_distance(ch_a, ch_b)
        }

        (
            JSXNode::Expression { expression_type: t_a, children: ch_a },
            JSXNode::Expression { expression_type: t_b, children: ch_b },
        ) => {
            let type_cost = if t_a == t_b { 0 } else { 1 };
            type_cost + children_edit_distance(ch_a, ch_b)
        }

        _ => {
            let a_size = tree_size(a);
            let b_size = tree_size(b);
            a_size + b_size
        }
    }
}

fn children_edit_distance(a: &[JSXNode], b: &[JSXNode]) -> usize {
    let m = a.len();
    let n = b.len();

    if m == 0 { return n; }
    if n == 0 { return m; }

    let mut dp = vec![vec![0usize; n + 1]; m + 1];

    for i in 0..=m {
        dp[i][0] = (0..i).map(|k| tree_size(&a[k])).sum();
    }
    for j in 0..=n {
        dp[0][j] = (0..j).map(|k| tree_size(&b[k])).sum();
    }

    for i in 1..=m {
        for j in 1..=n {
            let del = dp[i - 1][j] + tree_size(&a[i - 1]);
            let ins = dp[i][j - 1] + tree_size(&b[j - 1]);
            let sub = dp[i - 1][j - 1] + tree_edit_distance(&a[i - 1], &b[j - 1]);
            dp[i][j] = del.min(ins).min(sub);
        }
    }

    dp[m][n]
}

fn attribute_distance(a: &[crate::types::JSXAttribute], b: &[crate::types::JSXAttribute]) -> usize {
    let a_names: Vec<&str> = a.iter().map(|attr| attr.name.as_str()).collect();
    let b_names: Vec<&str> = b.iter().map(|attr| attr.name.as_str()).collect();

    let common = a_names.iter().filter(|n| b_names.contains(n)).count();
    let total = a_names.len() + b_names.len();

    if total == 0 { return 0; }
    total - 2 * common
}

fn tree_size(node: &JSXNode) -> usize {
    match node {
        JSXNode::Text => 1,
        JSXNode::Element { children, attributes, .. } => {
            1 + attributes.len() + children.iter().map(tree_size).sum::<usize>()
        }
        JSXNode::Fragment { children } | JSXNode::Expression { children, .. } => {
            1 + children.iter().map(tree_size).sum::<usize>()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::JSXAttribute;

    fn el(tag: &str, children: Vec<JSXNode>) -> JSXNode {
        JSXNode::Element {
            tag: tag.into(),
            attributes: vec![],
            children,
            is_component: tag.chars().next().map_or(false, |c| c.is_uppercase()),
        }
    }

    fn el_with_attrs(tag: &str, attrs: Vec<&str>, children: Vec<JSXNode>) -> JSXNode {
        JSXNode::Element {
            tag: tag.into(),
            attributes: attrs.iter().map(|a| JSXAttribute { name: a.to_string(), value_type: "expression".into() }).collect(),
            children,
            is_component: false,
        }
    }

    #[test]
    fn identical_trees_score_one() {
        let tree = el("div", vec![el("span", vec![JSXNode::Text])]);
        assert!((compare_jsx(&tree, &tree) - 1.0).abs() < 1e-10);
    }

    #[test]
    fn completely_different_trees() {
        let a = el("div", vec![el("span", vec![])]);
        let b = el("section", vec![el("h1", vec![el("strong", vec![JSXNode::Text])])]);
        let score = compare_jsx(&a, &b);
        assert!(score < 0.5);
    }

    #[test]
    fn same_structure_different_tags() {
        let a = el("div", vec![JSXNode::Text]);
        let b = el("span", vec![JSXNode::Text]);
        let score = compare_jsx(&a, &b);
        assert!(score > 0.0 && score < 1.0);
    }

    #[test]
    fn attribute_difference_lowers_score() {
        let a = el_with_attrs("button", vec!["onClick", "disabled"], vec![]);
        let b = el_with_attrs("button", vec!["onClick"], vec![]);
        let score = compare_jsx(&a, &b);
        assert!(score < 1.0);
    }

    #[test]
    fn empty_trees() {
        let a = JSXNode::Fragment { children: vec![] };
        let b = JSXNode::Fragment { children: vec![] };
        assert!((compare_jsx(&a, &b) - 1.0).abs() < 1e-10);
    }
}
