export declare function askAnalyticsCategoryKinesisQuestions(context: any): Promise<{
    triggerEventSourceMappings: {
        batchSize: number;
        startingPosition: string;
        eventSourceArn: {
            Ref: string;
        };
        functionTemplateName: string;
        triggerPolicies: {
            Effect: string;
            Action: string[];
            Resource: {
                Ref: string;
            };
        }[];
    }[];
    dependsOn: {
        category: string;
        resourceName: any;
        attributes: string[];
    }[];
} | undefined>;
//# sourceMappingURL=analyticsWalkthrough.d.ts.map