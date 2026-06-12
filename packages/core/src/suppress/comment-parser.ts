import ts from "typescript";

export function getIgnoredComponents(sourceFile: ts.SourceFile): Set<string> {
  const ignored = new Set<string>();
  const text = sourceFile.getFullText();

  ts.forEachChild(sourceFile, function visit(node) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isVariableStatement(node) ||
      ts.isClassDeclaration(node)
    ) {
      const leadingComments = ts.getLeadingCommentRanges(text, node.getFullStart());
      if (leadingComments) {
        for (const comment of leadingComments) {
          const commentText = text.slice(comment.pos, comment.end);
          if (commentText.includes("doppel-ignore")) {
            const name = extractName(node);
            if (name) ignored.add(name);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  });

  return ignored;
}

function extractName(node: ts.Node): string | null {
  if (ts.isFunctionDeclaration(node) && node.name) {
    return node.name.text;
  }
  if (ts.isClassDeclaration(node) && node.name) {
    return node.name.text;
  }
  if (ts.isVariableStatement(node)) {
    const decl = node.declarationList.declarations[0];
    if (decl && ts.isIdentifier(decl.name)) {
      return decl.name.text;
    }
  }
  return null;
}
