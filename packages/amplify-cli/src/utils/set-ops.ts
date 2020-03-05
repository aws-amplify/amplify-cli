export function twoStringSetsAreEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }

  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }

  return true;
}

export function twoStringSetsAreDisjoint(a: Set<string>, b: Set<string>): boolean {
  if (a.size > b.size) {
    var temp = a;
    a = b;
    b = temp;
  }

  for (const item of a) {
    if (b.has(item)) {
      return false;
    }
  }

  return true;
}

export function findIntersections(a: Set<string>, b: Set<string>): Set<string> {
  const result = new Set<string>();

  if (a.size > b.size) {
    var temp = a;
    a = b;
    b = temp;
  }

  for (const item of a) {
    if (b.has(item)) {
      result.add(item);
    }
  }

  return result;
}
