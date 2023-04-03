import { AttributeDefinition, GlobalSecondaryIndex } from 'cloudform-types/types/dynamoDb/table';
import { FieldType } from './service-walkthrough-types/dynamoDB-user-input-types';
export declare const getCloudFormationTemplatePath: (resourceName: string) => string;
export declare const getExistingStorageGSIs: (resourceName: string) => Promise<GlobalSecondaryIndex[]>;
export declare const getExistingStorageAttributeDefinitions: (resourceName: string) => Promise<AttributeDefinition[]>;
export declare const getExistingTableColumnNames: (resourceName: string) => Promise<string[]>;
export declare enum DdbAttrType {
    S = "S",
    N = "N",
    B = "B",
    BOOL = "BOOL",
    NULL = "NULL",
    L = "L",
    M = "M",
    SS = "SS",
    NS = "NS",
    BS = "BS"
}
export declare const getFieldType: (ddbAttr: DdbAttrType) => FieldType;
export declare const getDdbAttrType: (fieldType: FieldType) => DdbAttrType;
//# sourceMappingURL=cfn-template-utils.d.ts.map