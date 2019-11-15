export function sortFields(a: { name: string }, b: { name: string }) {
  if (a.name > b.name) return 1;
  if (a.name == b.name) return 0;
  return -1;
}
