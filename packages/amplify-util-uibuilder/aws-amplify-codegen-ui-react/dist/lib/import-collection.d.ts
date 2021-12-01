import { ImportDeclaration } from 'typescript';
export declare class ImportCollection {
    #private;
    addImport(packageName: string, importName: string): void;
    mergeCollections(otherCollection: ImportCollection): void;
    buildSampleSnippetImports(topComponentName: string): ImportDeclaration[];
    buildImportStatements(skipReactImport?: boolean): ImportDeclaration[];
}
