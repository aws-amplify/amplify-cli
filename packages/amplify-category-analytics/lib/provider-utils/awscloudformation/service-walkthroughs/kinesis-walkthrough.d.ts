import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
export declare const addWalkthrough: (context: $TSContext, defaultValuesFilename: string, serviceMetadata: $TSAny) => Promise<$TSContext>;
export declare const migrate: () => void;
interface IKinesisCRUDPolicy {
    Effect: string;
    Action: $TSAny;
    Resource: $TSAny;
}
interface IKinesisPolicyAttributes {
    policy: IKinesisCRUDPolicy;
    attributes: Array<$TSAny>;
}
interface IKinesisCRUDPolicy {
    Effect: string;
    Action: $TSAny;
    Resource: $TSAny;
}
interface IKinesisPolicyAttributes {
    policy: IKinesisCRUDPolicy;
    attributes: Array<$TSAny>;
}
export declare const updateWalkthrough: (context: $TSContext, defaultValuesFilename: string, serviceMetadata: $TSAny) => Promise<$TSAny>;
export declare const getIAMPolicies: (resourceName: string, crudOptions: Array<$TSAny>) => IKinesisPolicyAttributes;
export {};
//# sourceMappingURL=kinesis-walkthrough.d.ts.map