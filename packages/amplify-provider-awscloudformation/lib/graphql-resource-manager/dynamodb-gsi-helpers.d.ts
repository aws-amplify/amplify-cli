import { DynamoDB, IntrinsicFunction } from 'cloudform';
import { GSIRecord } from '../utils/amplify-resource-state-utils';
export declare const MAX_GSI_PER_TABLE = 20;
export declare const getGSIDetails: (indexName: string, table: DynamoDB.Table) => GSIRecord | undefined;
export declare const addGSI: (index: GSIRecord, table: DynamoDB.Table) => DynamoDB.Table;
export declare const removeGSI: (indexName: string, table: DynamoDB.Table) => DynamoDB.Table;
export declare function assertNotIntrinsicFunction<A>(x: A[] | A | IntrinsicFunction): asserts x is A[] | A;
export declare const getExistingIndexNames: (table: DynamoDB.Table) => string[];
//# sourceMappingURL=dynamodb-gsi-helpers.d.ts.map