export declare function askDynamoDBQuestions(context: any, currentProjectOnly?: boolean): Promise<{
    resourceName: string;
}>;
export declare function getTableParameters(context: any, dynamoAnswers: any): Promise<any>;
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
        functionTemplateType: string;
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
//# sourceMappingURL=dynamoDBWalkthrough.d.ts.map