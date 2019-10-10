/**
 * Get a value at the path in the object.
 * @param obj The object to look in.
 * @param path The path.
 */
export default function getIn(obj: any, path: string[]): any {
  let val = obj;
  for (const elem of path) {
    if (val[elem]) {
      val = val[elem];
    } else {
      return null;
    }
  }
  return val;
}
