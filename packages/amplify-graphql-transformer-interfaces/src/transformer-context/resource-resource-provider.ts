export interface TransformerResourceHelperProvider {
  generateTableName(modelName: string): string;
  generateIAMRoleName(name: string): string;
  setModelNameMapping(modelName: string, mappedName: string): void;
  getModelNameMapping(modelName: string): string;
  setFieldNameMapping(modelName: string, fieldName: string, mappedFieldName: string): void;
  getFieldNameMapping(modelName: string, fieldName: string): string;
}
