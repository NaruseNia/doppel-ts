use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

use crate::types::{
    FeatureVector, JSXNode, NormalizedComponentData,
};

const PROPS_HASH_DIMS: usize = 64;
const PROPS_TYPE_HASH_DIMS: usize = 32;
const JSX_TAG_HASH_DIMS: usize = 64;
const JSX_STRUCTURE_DIMS: usize = 8;
const META_DIMS: usize = 4;

pub const VECTOR_DIMS: usize =
    PROPS_HASH_DIMS + PROPS_TYPE_HASH_DIMS + JSX_TAG_HASH_DIMS + JSX_STRUCTURE_DIMS + META_DIMS;

pub fn generate_feature_vector(component: &NormalizedComponentData) -> FeatureVector {
    let mut values = vec![0.0_f64; VECTOR_DIMS];
    let mut offset = 0;

    encode_props_names(&component.props.properties, &mut values[offset..offset + PROPS_HASH_DIMS]);
    offset += PROPS_HASH_DIMS;

    encode_props_types(&component.props.properties, &mut values[offset..offset + PROPS_TYPE_HASH_DIMS]);
    offset += PROPS_TYPE_HASH_DIMS;

    encode_jsx_tags(&component.jsx_tree.root, &mut values[offset..offset + JSX_TAG_HASH_DIMS]);
    offset += JSX_TAG_HASH_DIMS;

    encode_jsx_structure(&component.jsx_tree.root, &mut values[offset..offset + JSX_STRUCTURE_DIMS]);
    offset += JSX_STRUCTURE_DIMS;

    encode_meta(component, &mut values[offset..offset + META_DIMS]);

    normalize(&mut values);

    FeatureVector {
        component_id: component.id.clone(),
        values,
    }
}

pub fn generate_all(components: &[NormalizedComponentData]) -> Vec<FeatureVector> {
    components.iter().map(generate_feature_vector).collect()
}

fn encode_props_names(props: &[crate::types::PropEntry], dims: &mut [f64]) {
    for prop in props {
        let idx = hash_to_index(&prop.name, dims.len());
        dims[idx] += if prop.optional { 0.5 } else { 1.0 };
    }
}

fn encode_props_types(props: &[crate::types::PropEntry], dims: &mut [f64]) {
    for prop in props {
        let idx = hash_to_index(&prop.type_signature, dims.len());
        dims[idx] += 1.0;
    }
}

fn encode_jsx_tags(node: &JSXNode, dims: &mut [f64]) {
    match node {
        JSXNode::Element { tag, children, .. } => {
            let idx = hash_to_index(tag, dims.len());
            dims[idx] += 1.0;
            for child in children {
                encode_jsx_tags(child, dims);
            }
        }
        JSXNode::Fragment { children } => {
            for child in children {
                encode_jsx_tags(child, dims);
            }
        }
        JSXNode::Expression { children, .. } => {
            for child in children {
                encode_jsx_tags(child, dims);
            }
        }
        JSXNode::Text => {}
    }
}

fn encode_jsx_structure(node: &JSXNode, dims: &mut [f64]) {
    let (depth, node_count, leaf_count, branch_count) = tree_stats(node, 0);
    let attr_count = count_attributes(node);
    let component_count = count_component_tags(node);
    let expression_count = count_expressions(node);
    let text_count = count_text_nodes(node);

    if dims.len() >= 8 {
        dims[0] = depth as f64;
        dims[1] = node_count as f64;
        dims[2] = leaf_count as f64;
        dims[3] = branch_count as f64;
        dims[4] = attr_count as f64;
        dims[5] = component_count as f64;
        dims[6] = expression_count as f64;
        dims[7] = text_count as f64;
    }
}

fn encode_meta(component: &NormalizedComponentData, dims: &mut [f64]) {
    if dims.len() >= 4 {
        dims[0] = component.props.property_count as f64;
        dims[1] = if component.style.is_some() { 1.0 } else { 0.0 };
        dims[2] = if component.behavior.is_some() { 1.0 } else { 0.0 };
        dims[3] = component.behavior.as_ref().map_or(0.0, |b| b.hooks.len() as f64);
    }
}

fn hash_to_index(s: &str, dim: usize) -> usize {
    let mut hasher = DefaultHasher::new();
    s.hash(&mut hasher);
    (hasher.finish() as usize) % dim
}

fn normalize(values: &mut [f64]) {
    let magnitude: f64 = values.iter().map(|v| v * v).sum::<f64>().sqrt();
    if magnitude > 0.0 {
        for v in values.iter_mut() {
            *v /= magnitude;
        }
    }
}

fn tree_stats(node: &JSXNode, depth: usize) -> (usize, usize, usize, usize) {
    match node {
        JSXNode::Element { children, .. } | JSXNode::Fragment { children } | JSXNode::Expression { children, .. } => {
            if children.is_empty() {
                return (depth, 1, 1, 0);
            }
            let mut max_depth = depth;
            let mut total_nodes = 1;
            let mut total_leaves = 0;
            let branch = if children.len() > 1 { 1 } else { 0 };
            let mut total_branches = branch;
            for child in children {
                let (d, n, l, b) = tree_stats(child, depth + 1);
                max_depth = max_depth.max(d);
                total_nodes += n;
                total_leaves += l;
                total_branches += b;
            }
            (max_depth, total_nodes, total_leaves, total_branches)
        }
        JSXNode::Text => (depth, 1, 1, 0),
    }
}

fn count_attributes(node: &JSXNode) -> usize {
    match node {
        JSXNode::Element { attributes, children, .. } => {
            attributes.len() + children.iter().map(count_attributes).sum::<usize>()
        }
        JSXNode::Fragment { children } | JSXNode::Expression { children, .. } => {
            children.iter().map(count_attributes).sum()
        }
        JSXNode::Text => 0,
    }
}

fn count_component_tags(node: &JSXNode) -> usize {
    match node {
        JSXNode::Element { is_component, children, .. } => {
            (if *is_component { 1 } else { 0 }) + children.iter().map(count_component_tags).sum::<usize>()
        }
        JSXNode::Fragment { children } | JSXNode::Expression { children, .. } => {
            children.iter().map(count_component_tags).sum()
        }
        JSXNode::Text => 0,
    }
}

fn count_expressions(node: &JSXNode) -> usize {
    match node {
        JSXNode::Expression { children, .. } => {
            1 + children.iter().map(count_expressions).sum::<usize>()
        }
        JSXNode::Element { children, .. } | JSXNode::Fragment { children } => {
            children.iter().map(count_expressions).sum()
        }
        JSXNode::Text => 0,
    }
}

fn count_text_nodes(node: &JSXNode) -> usize {
    match node {
        JSXNode::Text => 1,
        JSXNode::Element { children, .. } | JSXNode::Fragment { children } | JSXNode::Expression { children, .. } => {
            children.iter().map(count_text_nodes).sum()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::*;

    fn make_component(props: Vec<PropEntry>, root: JSXNode) -> NormalizedComponentData {
        NormalizedComponentData {
            id: "test:Comp".into(),
            name: "Comp".into(),
            file_path: "test.tsx".into(),
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
        PropEntry {
            name: name.into(),
            type_signature: sig.into(),
            optional: false,
        }
    }

    #[test]
    fn vector_has_correct_dimensions() {
        let comp = make_component(vec![], JSXNode::Fragment { children: vec![] });
        let vec = generate_feature_vector(&comp);
        assert_eq!(vec.values.len(), VECTOR_DIMS);
    }

    #[test]
    fn empty_component_has_minimal_nonzero_dims() {
        let comp = make_component(vec![], JSXNode::Fragment { children: vec![] });
        let vec = generate_feature_vector(&comp);
        // Hash-based dims (props, types, jsx tags) should be zero
        let hash_dims = PROPS_HASH_DIMS + PROPS_TYPE_HASH_DIMS + JSX_TAG_HASH_DIMS;
        let hash_sum: f64 = vec.values[..hash_dims].iter().sum();
        assert_eq!(hash_sum, 0.0);
    }

    #[test]
    fn identical_components_produce_identical_vectors() {
        let props = vec![make_prop("onClick", "() => void")];
        let root = JSXNode::Element {
            tag: "button".into(),
            attributes: vec![],
            children: vec![JSXNode::Text],
            is_component: false,
        };
        let a = generate_feature_vector(&make_component(props.clone(), root.clone()));
        let b = generate_feature_vector(&make_component(props, root));
        assert_eq!(a.values, b.values);
    }

    #[test]
    fn different_components_produce_different_vectors() {
        let a = generate_feature_vector(&make_component(
            vec![make_prop("onClick", "() => void")],
            JSXNode::Element {
                tag: "button".into(),
                attributes: vec![],
                children: vec![],
                is_component: false,
            },
        ));
        let b = generate_feature_vector(&make_component(
            vec![make_prop("title", "string")],
            JSXNode::Element {
                tag: "h1".into(),
                attributes: vec![],
                children: vec![],
                is_component: false,
            },
        ));
        assert_ne!(a.values, b.values);
    }

    #[test]
    fn vector_is_normalized() {
        let comp = make_component(
            vec![make_prop("a", "string"), make_prop("b", "number")],
            JSXNode::Element {
                tag: "div".into(),
                attributes: vec![],
                children: vec![JSXNode::Text],
                is_component: false,
            },
        );
        let vec = generate_feature_vector(&comp);
        let magnitude: f64 = vec.values.iter().map(|v| v * v).sum::<f64>().sqrt();
        assert!((magnitude - 1.0).abs() < 1e-10);
    }

    #[test]
    fn generate_all_preserves_order() {
        let comps = vec![
            make_component(vec![make_prop("a", "string")], JSXNode::Text),
            make_component(vec![make_prop("b", "number")], JSXNode::Text),
        ];
        let vecs = generate_all(&comps);
        assert_eq!(vecs.len(), 2);
        assert_eq!(vecs[0].component_id, "test:Comp");
    }
}
