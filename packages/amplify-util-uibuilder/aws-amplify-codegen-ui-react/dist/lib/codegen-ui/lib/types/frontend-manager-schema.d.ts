import { FixedFrontendManagerComponentProperty, BoundFrontendManagerComponentProperty } from './frontend-manager-types';
export declare type FixedOrBoundProps = {
    [propertyName: string]: FixedFrontendManagerComponentProperty | BoundFrontendManagerComponentProperty;
};
export declare type WrappedComponentProperties<TPropIn> = {
    [key in keyof TPropIn]: FixedFrontendManagerComponentProperty | BoundFrontendManagerComponentProperty;
};
