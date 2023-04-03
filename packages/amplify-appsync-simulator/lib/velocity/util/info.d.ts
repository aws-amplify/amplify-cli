import { GraphQLResolveInfo } from 'graphql';
export declare function createInfo(info: GraphQLResolveInfo): {
    fieldName: string;
    variables: {
        [variableName: string]: any;
    };
    parentTypeName: import("graphql").GraphQLObjectType<any, any>;
    selectionSetList: any[];
    selectionSetGraphQL: string;
};
//# sourceMappingURL=info.d.ts.map