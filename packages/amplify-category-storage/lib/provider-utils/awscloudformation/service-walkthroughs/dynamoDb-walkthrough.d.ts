import { $TSAny, $TSContext } from 'amplify-cli-core';
import { DynamoDBCLIInputs } from '../service-walkthrough-types/dynamoDB-user-input-types';
export declare function addWalkthrough(context: $TSContext, defaultValuesFilename: string): Promise<string>;
export declare function updateWalkthrough(context: $TSContext): Promise<DynamoDBCLIInputs | undefined>;
export declare function migrate(context: $TSContext, projectPath: any, resourceName: any): void;
export declare function getIAMPolicies(resourceName: string, crudOptions: $TSAny): {
    policy: {};
    attributes: string[];
};
//# sourceMappingURL=dynamoDb-walkthrough.d.ts.map