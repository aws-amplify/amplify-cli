export interface TransformerResourceHelperProvider {
  generateTableName(modelName: string): string;
  generateRoleName(baseName: string): string;
  registerModelToTableNameMaping(modelName: string, tableName: string): void;
  getTableBaseName(modelName: string): string;
}
