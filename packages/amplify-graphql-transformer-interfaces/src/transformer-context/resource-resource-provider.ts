export interface TransformerResourceHelperProvider {
  generateTableName(modelName: string): string;
  generateIAMRoleName(name: string): string;
  setModelNameMapping(modelName: string, mappedName: string): void;
  getModelNameMapping(modelName: string): string;
  isModelRenamed(modelName: string): boolean;
  getModelFieldMap(modelName: string): ModelFieldMap;
  getModelFieldMapKeys(): string[];
  getFieldNameMapping(modelName: string, fieldName: string): string;
}

export type ModelFieldMap = {
  addMappedField: (entry: FieldMapEntry) => ModelFieldMap;
  addResolverReference: (entry: ResolverReferenceEntry) => ModelFieldMap;
  getMappedFields: () => ReadonlyArray<FieldMapEntry>;
  getResolverReferences: () => ReadonlyArray<ResolverReferenceEntry>;
};

export type ResolverReferenceEntry = {
  typeName: string;
  fieldName: string;
  isList: boolean;
};

export type FieldMapEntry = {
  originalFieldName: string;
  currentFieldName: string;
};

export type ReadonlyArray<T> = Readonly<Array<Readonly<T>>>;
