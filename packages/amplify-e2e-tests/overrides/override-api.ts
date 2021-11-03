export function overrideProps(props: any): any {
  props.api.GraphQLAPI.xrayEnabled = true;
  return props;
}
