type DDBFilterExpression = {
    expressions: string[];
    expressionNames: {
        [key: string]: string;
    };
    expressionValues: {
        [key: string]: string;
    };
};
export declare function generateFilterExpression(filter: any, prefix?: any, parent?: any): DDBFilterExpression;
export {};
//# sourceMappingURL=dynamodb-filter.d.ts.map