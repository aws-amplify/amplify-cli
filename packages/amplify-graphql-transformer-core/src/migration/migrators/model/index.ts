export function isModelType(node: any) {
    if (node.directives.find((dir: any) => dir.name.value === 'model')) {
        return true;
    }
    return false;
}
