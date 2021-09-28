export function overrideProps(props: any): void {
  props.authRole.roleName = 'mockRole';
  return props;
}
