import { FrontendManagerComponent, FrontendManagerComponentChild, WrappedComponentProperties } from './types';
import { FrontendManagerNode } from './frontend-manager-node';
/**
 * Shared class for rendering components.
 * Mostly contains helper functions for mapping the FrontendManager schema to actual props.
 */
export declare abstract class CommonComponentRenderer<TPropIn> {
    protected component: FrontendManagerComponent | FrontendManagerComponentChild;
    protected parent?: FrontendManagerNode | undefined;
    protected inputProps: WrappedComponentProperties<TPropIn>;
    protected node: FrontendManagerNode;
    constructor(component: FrontendManagerComponent | FrontendManagerComponentChild, parent?: FrontendManagerNode | undefined);
}
