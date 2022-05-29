export function override(resource: any): any {
  resource.api.GraphQLAPI.xrayEnabled = true;
}
