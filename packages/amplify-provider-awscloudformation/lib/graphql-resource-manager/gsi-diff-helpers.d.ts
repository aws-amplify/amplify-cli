import { DynamoDB } from 'cloudform';
import { GlobalSecondaryIndex } from 'cloudform-types/types/dynamoDb/table';
export declare enum GSIChange {
    Add = "ADD",
    Update = "UPDATE",
    Delete = "DELETE"
}
export type IndexChange = {
    type: GSIChange;
    indexName: string;
};
export declare const getGSIDiffs: (current: DynamoDB.Table, next: DynamoDB.Table) => IndexChange[];
export declare const generateGSIChangeList: (currentIndexes: GlobalSecondaryIndex[], nextIndexes: GlobalSecondaryIndex[]) => IndexChange[];
export declare const isIndexModified: (currentIndex: GlobalSecondaryIndex, nextIndex: GlobalSecondaryIndex) => boolean;
//# sourceMappingURL=gsi-diff-helpers.d.ts.map