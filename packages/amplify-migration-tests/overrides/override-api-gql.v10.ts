export function override(resource: Record<string, unknown>): void {
    resource.api['GraphQLAPI'].xrayEnabled = true;
}
