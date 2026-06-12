export function matchesSuppressPattern(name: string, pattern: string): boolean {
  if (!pattern.includes("*")) {
    return name === pattern;
  }
  const regex = new RegExp(
    "^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
  );
  return regex.test(name);
}

export function isPairSuppressed(
  nameA: string,
  nameB: string,
  suppressList: [string, string][],
): boolean {
  for (const [patternA, patternB] of suppressList) {
    if (
      (matchesSuppressPattern(nameA, patternA) && matchesSuppressPattern(nameB, patternB)) ||
      (matchesSuppressPattern(nameA, patternB) && matchesSuppressPattern(nameB, patternA))
    ) {
      return true;
    }
  }
  return false;
}
