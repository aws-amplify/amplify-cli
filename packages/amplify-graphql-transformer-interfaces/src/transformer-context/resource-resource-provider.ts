export interface TransformerResourceHelperProvider {
  generateTableName(modelName: string): string;
  generateIAMRoleName(name: string): string;
  registerModelToTableNameMapping(modelName: string, tableName: string): void;
  getTableBaseName(modelName: string): string;
}
