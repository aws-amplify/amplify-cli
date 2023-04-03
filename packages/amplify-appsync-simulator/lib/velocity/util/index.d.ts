export { TemplateSentError, Unauthorized, ValidateError } from './errors';
import { GraphQLResolveInfo } from 'graphql';
import { AppSyncGraphQLExecutionContext } from '../../utils/graphql-runner';
export declare function create(errors: any[], now: Date, info: GraphQLResolveInfo, context: AppSyncGraphQLExecutionContext): {
    dynamodb: {
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
    list: {
        copyAndRetainAll(list: any[], intersect: any[]): any;
        copyAndRemoveAll(list: any[], toRemove: any[]): any;
        sortList(list: any[], desc: boolean, property: string): any[];
    };
    map: {
        copyAndRetainAllKeys(map: import("../value-mapper/map").JavaMap, keys: import("../value-mapper/array").JavaArray): import("../value-mapper/map").JavaMap;
        copyAndRemoveAllKeys(map: import("../value-mapper/map").JavaMap, keys: import("../value-mapper/array").JavaArray): import("../value-mapper/map").JavaMap;
    };
    transform: {
        toDynamoDBConditionExpression: (condition: any) => string;
        toDynamoDBFilterExpression: (filter: any) => string;
        toElasticsearchQueryDSL: (filter: any) => string;
    };
    now: Date;
    errors: any[];
    info: GraphQLResolveInfo;
    time: {
        nowISO8601(): string;
        nowEpochSeconds(): number;
        nowEpochMilliSeconds(): number;
        nowFormatted(format: string, timezone?: string): string;
        parseFormattedToEpochMilliSeconds(dateTime: string, format: string, timezone?: string): number;
        parseISO8601ToEpochMilliSeconds(dateTime: any): number;
        epochMilliSecondsToSeconds(milliseconds: number): number;
        epochMilliSecondsToISO8601(dateTime: number): string;
        epochMilliSecondsToFormatted(timestamp: number, format: string, timezone?: string): string;
    };
    str: {
        toUpper(str: string): string;
        toLower(str: string): string;
        toReplace(str: string, substr: string, newSubstr: string): string;
        normalize(str: string, form: string): string;
    };
    math: {
        roundNum: (x: number) => number;
        minVal: (...values: number[]) => number;
        maxVal: (...values: number[]) => number;
        randomDouble: () => number;
        randomWithinRange: {
            (floating?: boolean): number;
            (max: number, floating?: boolean): number;
            (min: number, max: number, floating?: boolean): number;
            (min: number, index: string | number, guard: object): number;
        };
    };
    rds: {
        toJsonString: (rdsObject: any) => string;
        toJsonObject: (rdsString: any) => any;
    };
    quiet: () => string;
    qr: () => string;
    escapeJavaScript(value: any): any;
    urlEncode(value: any): string;
    urlDecode(value: any): string;
    base64Encode(value: any): string;
    base64Decode(value: any): string;
    parseJson(value: any): any;
    toJson(value: any): string;
    autoId(): string;
    autoUlid: () => string;
    unauthorized(): never;
    error(message: any, type?: any, data?: any, errorInfo?: any): never;
    appendError(message: any, type?: any, data?: any, errorInfo?: any): string;
    getErrors(): any;
    validate(allGood: any, message: any, errorType: any, data: any): string;
    isNull(value: any): boolean;
    isNullOrEmpty(value: any): any;
    isNullOrBlank(value: any): any;
    defaultIfNull(value: any, defaultValue?: string): any;
    defaultIfNullOrEmpty(value: any, defaultValue: any): any;
    defaultIfNullOrBlank(value: any, defaultValue: any): any;
    isString(value: any): boolean;
    isNumber(value: any): boolean;
    isBoolean(value: any): boolean;
    isList(value: any): boolean;
    isMap(value: any): boolean | Map<any, any>;
    typeOf(value: any): "Null" | "List" | "Map" | "Number" | "String" | "Boolean" | "Object";
    matches(pattern: any, value: any): boolean;
    authType(): "API Key Authorization" | "IAM Authorization" | "User Pool Authorization" | "Open ID Connect Authorization";
};
//# sourceMappingURL=index.d.ts.map