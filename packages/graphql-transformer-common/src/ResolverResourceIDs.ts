import { graphqlName, toUpper } from "./util";

export class ResolverResourceIDs {
    static DynamoDBCreateResolverResourceID(typeName: string): string {
        return `Create${typeName}Resolver`
    }
    static DynamoDBUpdateResolverResourceID(typeName: string): string {
        return `Update${typeName}Resolver`
    }
    static DynamoDBDeleteResolverResourceID(typeName: string): string {
        return `Delete${typeName}Resolver`
    }
    static DynamoDBGetResolverResourceID(typeName: string): string {
        return `Get${typeName}Resolver`
    }
    static DynamoDBListResolverResourceID(typeName: string): string {
        return `List${typeName}Resolver`
    }
    static ElasticsearchSearchResolverResourceID(typeName: string): string {
        return `Search${typeName}Resolver`
    }
    static ResolverResourceID(typeName: string, fieldName: string): string {
        return `${typeName}${fieldName}Resolver`
    }
}