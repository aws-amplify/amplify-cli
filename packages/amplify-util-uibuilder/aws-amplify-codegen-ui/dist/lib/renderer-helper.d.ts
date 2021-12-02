import { FrontendManagerComponent, FrontendManagerComponentChild, FrontendManagerComponentDataPropertyBinding, FrontendManagerComponentAuthPropertyBinding, FrontendManagerComponentStoragePropertyBinding, FrontendManagerComponentEventPropertyBinding, FrontendManagerComponentSimplePropertyBinding } from './types';
export declare const FrontendManagerRendererConstants: {
    unknownName: string;
};
export declare function isFrontendManagerComponentWithBinding(component: FrontendManagerComponent | FrontendManagerComponentChild): component is FrontendManagerComponent;
/**
 * Verify if this is 1) a type that has the collectionProperties, and 2) that the collection
 * properties object is set. Then provide the typehint back to the compiler that this attribute exists.
 */
export declare function isFrontendManagerComponentWithCollectionProperties(component: FrontendManagerComponent | FrontendManagerComponentChild): component is FrontendManagerComponent & Required<Pick<FrontendManagerComponent, 'collectionProperties'>>;
export declare function isFrontendManagerComponentWithVariants(component: FrontendManagerComponent | FrontendManagerComponentChild): component is FrontendManagerComponent & Required<Pick<FrontendManagerComponent, 'variants'>>;
export declare function isFrontendManagerComponentWithActions(component: FrontendManagerComponent | FrontendManagerComponentChild): component is FrontendManagerComponent & Required<Pick<FrontendManagerComponent, 'actions'>>;
export declare function isDataPropertyBinding(prop: FrontendManagerComponentDataPropertyBinding | FrontendManagerComponentAuthPropertyBinding | FrontendManagerComponentStoragePropertyBinding | FrontendManagerComponentEventPropertyBinding | FrontendManagerComponentSimplePropertyBinding): prop is FrontendManagerComponentDataPropertyBinding;
export declare function isAuthPropertyBinding(prop: FrontendManagerComponentDataPropertyBinding | FrontendManagerComponentAuthPropertyBinding | FrontendManagerComponentStoragePropertyBinding | FrontendManagerComponentEventPropertyBinding | FrontendManagerComponentSimplePropertyBinding): prop is FrontendManagerComponentAuthPropertyBinding;
export declare function isStoragePropertyBinding(prop: FrontendManagerComponentDataPropertyBinding | FrontendManagerComponentAuthPropertyBinding | FrontendManagerComponentStoragePropertyBinding | FrontendManagerComponentEventPropertyBinding | FrontendManagerComponentSimplePropertyBinding): prop is FrontendManagerComponentStoragePropertyBinding;
export declare function isSimplePropertyBinding(prop: FrontendManagerComponentDataPropertyBinding | FrontendManagerComponentAuthPropertyBinding | FrontendManagerComponentStoragePropertyBinding | FrontendManagerComponentEventPropertyBinding | FrontendManagerComponentSimplePropertyBinding): prop is FrontendManagerComponentSimplePropertyBinding;
