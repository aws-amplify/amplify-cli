import { Template } from 'cloudform-types';
import { GlobalSecondaryIndex, AttributeDefinition } from 'cloudform-types/types/dynamoDb/table';
import { CloudFormation } from 'aws-sdk';
import { Capabilities } from 'aws-sdk/clients/cloudformation';
export interface GSIRecord {
    attributeDefinition: AttributeDefinition[];
    gsi: GlobalSecondaryIndex;
}
export interface DeploymentRecord {
    parameters?: Record<string, string>;
    capabilities?: Capabilities;
}
export declare const getPreviousDeploymentRecord: (cfnClient: CloudFormation, stackId: string) => Promise<DeploymentRecord>;
export declare const getTableNames: (cfnClient: CloudFormation, tables: string[], StackId: string) => Promise<Map<string, string>>;
export declare class TemplateState {
    private changes;
    has(key: string): boolean;
    isEmpty(): boolean;
    get(key: string): string[];
    getLatest(key: string): Template | null;
    pop(key: string): Template;
    add(key: string, val: string): void;
    getChangeCount(key: string): number;
    getKeys(): Array<string>;
}
//# sourceMappingURL=amplify-resource-state-utils.d.ts.map