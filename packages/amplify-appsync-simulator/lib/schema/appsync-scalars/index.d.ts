import { GraphQLScalarType } from 'graphql';
declare class AWSPhone extends GraphQLScalarType {
    constructor(options?: {
        name: any;
        description: any;
    });
}
export declare const scalars: {
    AWSJSON: GraphQLScalarType;
    AWSDate: GraphQLScalarType;
    AWSTime: GraphQLScalarType;
    AWSDateTime: GraphQLScalarType;
    AWSPhone: AWSPhone;
    AWSEmail: GraphQLScalarType;
    AWSURL: GraphQLScalarType;
    AWSTimestamp: GraphQLScalarType;
    AWSIPAddress: GraphQLScalarType;
};
export declare function wrapSchema(schemaString: any): string;
export {};
//# sourceMappingURL=index.d.ts.map