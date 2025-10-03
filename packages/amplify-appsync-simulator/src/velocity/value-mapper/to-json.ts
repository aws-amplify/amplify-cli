export function toJSON(value) {
  if (typeof value === 'object' && value != null && 'toJSON' in value) {
    return value.toJSON();
  }
  return JSON.parse(JSON.stringify(value));
}
