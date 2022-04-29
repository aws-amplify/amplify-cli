/**
 * Deeply set a value in an object.
 * @param obj The object to look in.
 * @param path The path.
 */
export default function setIn(obj: any, path: string[], value: any): any {
  let val = obj;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (val[key] && i === path.length - 1) {
      val[key] = value;
    } else if (val[key]) {
      val = val[key];
    }
  }
}
