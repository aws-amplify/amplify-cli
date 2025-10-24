import ts from 'typescript';
export type DataTableMapping = Record<string, string>;
export type DataDefinition = {
  tableMappings: Record<string, DataTableMapping | undefined>;
  schema: string;
};
export declare const generateDataSource: (dataDefinition?: DataDefinition) => ts.NodeArray<ts.Node>;
//# sourceMappingURL=index.d.ts.map
