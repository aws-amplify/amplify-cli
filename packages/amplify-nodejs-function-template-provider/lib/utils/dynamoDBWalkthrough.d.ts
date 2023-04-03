import { $TSContext } from '@aws-amplify/amplify-cli-core';
export declare function askDynamoDBQuestions(context: $TSContext, currentProjectOnly?: boolean): Promise<{
    resourceName: string;
}>;
export declare function getTableParameters(dynamoAnswers: any): Promise<TableParams | Record<string, unknown>>;
type TableParams = {
    tableName: string;
    partitionKeyName: string;
    partitionKeyType: string;
    sortKeyName?: string;
    sortKeyType?: string;
};
export declare function askAPICategoryDynamoDBQuestions(context: any): Promise<{
    triggerEventSourceMappings: {
        modelName: string;
        batchSize: number;
        startingPosition: string;
        eventSourceArn: {
            'Fn::ImportValue': {
                'Fn::Sub': string;
            };
        };
        functionTemplateName: string;
        triggerPolicies: {
            Effect: string;
            Action: string[];
            Resource: {
                'Fn::ImportValue': {
                    'Fn::Sub': string;
                };
            };
        }[];
    }[];
    dependsOn: {
        category: string;
        resourceName: any;
        attributes: string[];
    }[];
}>;
export {};
//# sourceMappingURL=dynamoDBWalkthrough.d.ts.map