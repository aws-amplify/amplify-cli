"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendManagerNode = void 0;
class FrontendManagerNode {
    constructor(component, parent) {
        this.component = component;
        this.parent = parent;
    }
    isRoot() {
        return this.parent === undefined;
    }
    getComponentPathToRoot() {
        if (this.parent !== undefined) {
            return [this].concat(this.parent.getComponentPathToRoot());
        }
        return [this];
    }
    getOverrideIndex() {
        if (this.parent === undefined || this.parent.component.children === undefined) {
            return -1;
        }
        return this.parent.component.children
            .filter((child) => child.componentType === this.component.componentType)
            .findIndex((child) => child === this.component);
    }
    /**
     * Build the override path for a given element walking from the node to tree root, providing an index
     * for all but the top-level components.
     * Example:
     * <Flex> <-- returns 'Flex'
     *     <Button> <-- returns 'Flex.Button[0]'
     *     <Button> <-- returns 'Flex.Button[1]'
     *     <Flex> <-- returns 'Flex.Flex[0]'
     *         </Button> <-- returns 'Flex.Flex[0].Button[0]'
     *     </Flex>
     * </Flex>
     */
    getOverrideKey() {
        const [parentElement, ...childElements] = this.getComponentPathToRoot().reverse();
        const childPath = childElements.map((node) => `${node.component.componentType}[${node.getOverrideIndex()}]`);
        return [parentElement.component.componentType, ...childPath].join('.');
    }
}
exports.FrontendManagerNode = FrontendManagerNode;
//# sourceMappingURL=frontend-manager-node.js.map