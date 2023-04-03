import { Template } from 'cloudform-types';
import { $TSObject } from './index';
export type CustomIAMPolicies = CustomIAMPolicy[];
export type CustomIAMPolicy = {
    Action: string[];
    Effect?: string;
    Resource: (string | $TSObject)[];
};
export declare const CustomIAMPoliciesSchema: {
    type: string;
    minItems: number;
    items: {
        type: string;
        properties: {
            Action: {
                type: string;
                items: {
                    type: string;
                };
                minItems: number;
                nullable: boolean;
            };
            Resource: {
                type: string;
                anyOf: ({
                    contains: {
                        type: string;
                        additionalProperties?: undefined;
                    };
                } | {
                    contains: {
                        type: string;
                        additionalProperties: boolean;
                    };
                })[];
                minItems: number;
                nullable: boolean;
            };
        };
        optionalProperties: {
            Effect: {
                type: string;
                enum: string[];
                default: string;
            };
        };
        required: string[];
        additionalProperties: boolean;
    };
    additionalProperties: boolean;
};
export declare function createDefaultCustomPoliciesFile(categoryName: string, resourceName: string): void;
export declare function generateCustomPoliciesInTemplate(template: Template, resourceName: string, service: string, category: string): Template;
//# sourceMappingURL=customPoliciesUtils.d.ts.map