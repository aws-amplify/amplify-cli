import { FrontendManagerComponent, FrontendManagerComponentChild } from './types';
export declare class FrontendManagerNode {
    component: FrontendManagerComponent | FrontendManagerComponentChild;
    parent?: FrontendManagerNode;
    constructor(component: FrontendManagerComponent | FrontendManagerComponentChild, parent?: FrontendManagerNode);
    isRoot(): boolean;
    getComponentPathToRoot(): FrontendManagerNode[];
    getOverrideIndex(): number;
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
    getOverrideKey(): string;
}
