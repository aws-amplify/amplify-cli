export interface TransformerResourceHelperProvider {
  generateTableName(modelName: string): string;
  generateIAMRoleName(name: string): string;
  registerModelToTableNameMaping(modelName: string, tableName: string): void;
  getTableBaseName(modelName: string): string;
}
