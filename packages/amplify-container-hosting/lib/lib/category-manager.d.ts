export function getCategoryStatus(context: any): {
    availableServices: any[];
    enabledServices: string[];
    disabledServices: any[];
};
export function runServiceAction(context: any, service: any, action: any, args: any): any;
export function migrate(context: any): Promise<void>;
export function getIAMPolicies(resourceName: any, crudOptions: any): {
    policy: {};
    attributes: any[];
};
//# sourceMappingURL=category-manager.d.ts.map