export interface TransformerResourceHelperProvider {
  generateTableName(modelName: string): string;
  generateIAMRoleName(name: string): string;
  setModelNameMapping(modelName: string, mappedName: string): void;
  getModelNameMapping(modelName: string): string;
  isModelRenamed(modelName: string): boolean;
  addResolverFieldMapEntry(
    typeName: string,
    fieldName: string,
    modelName: string,
    newEntry: [CurrentFieldName, OriginalFieldName],
    isResultList?: boolean,
  ): void;
  getFieldNameMapping(modelName: string, fieldName: string): string;
  getResolverMapRegistry(): Readonly<Map<ResolverKey, ResolverMapEntry>>;
}

export type ResolverKey = string;
export type CurrentFieldName = string;
export type OriginalFieldName = string;

export type FieldMap = Map<CurrentFieldName, OriginalFieldName>;

export type ResolverMapEntry = Readonly<{
  resolverTypeName: string;
  resolverFieldName: string;
  fieldMap: FieldMap;
  isResultList: boolean;
}>;
