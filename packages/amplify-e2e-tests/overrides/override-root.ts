function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
export function override(props: any): void {
  props.authRole.roleName = `mockRole-${getRandomInt(10000)}`;
  return props;
}
