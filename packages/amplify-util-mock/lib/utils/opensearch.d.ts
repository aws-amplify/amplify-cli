import { $TSObject } from 'amplify-cli-core';
type OpensearchQueryConfig = {
    path: string;
    params: {
        body: {
            size: number;
            sort: $TSObject[];
            version: boolean;
            query: $TSObject;
            aggs: $TSObject;
            from?: number;
        };
    };
};
type OpensearchQueryResult = {
    hits: {
        hits: $TSObject;
        total: {
            value: number;
        };
    };
    aggregations: $TSObject;
};
export declare const querySearchable: (endpoint: string, searchConfig: OpensearchQueryConfig) => Promise<OpensearchQueryResult>;
export {};
//# sourceMappingURL=opensearch.d.ts.map