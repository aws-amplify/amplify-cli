export interface TransformerResourceHelperProvider {
  generateTableName(modelName: string): string;
  registerModelToTableNameMaping(modelName: string, tableName: string): void;
}
