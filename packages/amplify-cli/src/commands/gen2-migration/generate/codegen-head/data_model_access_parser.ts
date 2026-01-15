import { DynamoDBCloudFormationAccessParser } from './dynamodb_cfn_access_parser';

export interface DataModelTableAccess {
  functionName: string;
  tableName: string;
  actions: string[];
}

export class DataModelAccessParser {
  static extractFunctionDataModelAccess(functionNames: string[]): DataModelTableAccess[] {
    const accesses: DataModelTableAccess[] = [];

    for (const functionName of functionNames) {
      const templatePath = DynamoDBCloudFormationAccessParser.findFunctionCloudFormationTemplate(functionName);
      const permissions = DynamoDBCloudFormationAccessParser.parseTemplateFile(templatePath);

      for (const permission of permissions) {
        const tableName = this.extractTableNameFromResource(permission.tableResource);
        if (tableName) {
          accesses.push({
            functionName,
            tableName,
            actions: permission.actions,
          });
        }
      }
    }

    return accesses;
  }

  private static extractTableNameFromResource(tableResource: string): string | null {
    // Match patterns like "${apiId}:GetAtt:PostTable:Name"
    const match = tableResource.match(/:GetAtt:(\w+Table):Name/);
    return match ? match[1] : null;
  }
}
