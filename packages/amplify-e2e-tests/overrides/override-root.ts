export function override(props: any): void {
  props.authRole.roleName = 'mockRole';
  return props;
}
