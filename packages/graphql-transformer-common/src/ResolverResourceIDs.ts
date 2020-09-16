import { resourceName } from './util';

export class ResolverResourceIDs {
  static DynamoDBCreateResolverResourceID(typeName: string): string {
    return `Create${resourceName(typeName)}Resolver`;
  }
  static DynamoDBUpdateResolverResourceID(typeName: string): string {
    return `Update${resourceName(typeName)}Resolver`;
  }
  static DynamoDBDeleteResolverResourceID(typeName: string): string {
    return `Delete${resourceName(typeName)}Resolver`;
  }
  static DynamoDBGetResolverResourceID(typeName: string): string {
    return `Get${resourceName(typeName)}Resolver`;
  }
  static DynamoDBListResolverResourceID(typeName: string): string {
    return `List${resourceName(typeName)}Resolver`;
  }
  static ElasticsearchSearchResolverResourceID(typeName: string): string {
    return `Search${resourceName(typeName)}Resolver`;
  }
  static SyncResolverResourceID(typeName: string): string {
    return `Sync${resourceName(typeName)}Resolver`;
  }
  static ResolverResourceID(typeName: string, fieldName: string): string {
    return `${resourceName(`${typeName}${fieldName}`)}Resolver`;
  }
}
