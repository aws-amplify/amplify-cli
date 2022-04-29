export function isModelType(node: any) {
    return node.directives.find((dir: any) => dir.name.value === 'model');
}
