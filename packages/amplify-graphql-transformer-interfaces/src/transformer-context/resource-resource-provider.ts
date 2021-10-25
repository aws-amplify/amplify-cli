export interface TransformerResourceHelperProvider {
  generateTableName(modelName: string): string;
  generateIAMRoleName(name: string): string;
  setModelNameMapping(modelName: string, mappedName: string): void;
  getModelNameMapping(modelName: string): string;
}
