export declare const dynamodbUtils: {
    toDynamoDB(value: any): import("aws-sdk/clients/dynamodb").AttributeValue;
    $toSet(values: any, fn?: (value: any) => any): any;
    toDynamoDBJson(value: any): string;
    toString(value: any): any;
    toStringJson(value: any): any;
    toStringSet(value: any): any;
    toStringSetJson(value: any): string;
    toNumber(value: any): any;
    toNumberJson(value: any): string;
    toNumberSet(value: any): any;
    toNumberSetJson(value: any): string;
    toBinary(value: any): {
        B: any;
    };
    toBinaryJson(value: any): string;
    toBinarySet(value: any): {
        BS: any[];
    };
    toBinarySetJson(value: any): string;
    toBoolean(value: any): {
        BOOL: any;
    };
    toBooleanJson(value: any): string;
    toNull(): {
        NULL: any;
    };
    toNullJson(): string;
    toList(value: any): any;
    toListJson(value: any): string;
    toMap(value: any): any;
    toMapJson(value: any): string;
    toMapValues(values: any): {};
    toMapValuesJson(values: any): string;
    toS3ObjectJson(): never;
    toS3Object(): never;
    fromS3ObjectJson(): never;
};
//# sourceMappingURL=dynamodb-utils.d.ts.map