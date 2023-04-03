export declare function askEventSourceQuestions(context: any): Promise<{
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
} | {
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
} | {
    triggerEventSourceMappings: {
        batchSize: number;
        startingPosition: string;
        eventSourceArn: {};
        functionTemplateName: string;
        triggerPolicies: {
            Effect: string;
            Action: string[];
            Resource: {};
        }[];
    }[];
} | {
    triggerEventSourceMappings?: undefined;
} | undefined>;
//# sourceMappingURL=eventSourceWalkthrough.d.ts.map