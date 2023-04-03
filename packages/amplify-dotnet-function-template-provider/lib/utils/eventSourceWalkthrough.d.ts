export declare function askEventSourceQuestions(context: any): Promise<{
    triggerEventSourceMappings: {
        batchSize: number;
        startingPosition: string;
        eventSourceArn: {
            Ref: string;
        };
        functionTemplateType: string;
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
} | {
    triggerEventSourceMappings: {
        batchSize: number;
        startingPosition: string;
        eventSourceArn: {};
        functionTemplateType: {};
        functionTemplateName: string;
        triggerPolicies: {
            Effect: string;
            Action: string[];
            Resource: {};
        }[];
    }[];
    dependsOn?: undefined;
} | {
    triggerEventSourceMappings?: undefined;
    dependsOn?: undefined;
} | {
    triggerEventSourceMappings: {
        batchSize: number;
        startingPosition: string;
        eventSourceArn: {
            Ref: string;
        };
        functionTemplateType: {};
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
        resourceName: string;
        attributes: string[];
    }[];
} | undefined>;
//# sourceMappingURL=eventSourceWalkthrough.d.ts.map