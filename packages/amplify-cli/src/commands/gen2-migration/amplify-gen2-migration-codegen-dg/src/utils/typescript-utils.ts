// TypeScript code generation utilities
export const generateImportStatement = (moduleName: string, importPath: string): string => {
  return `import { ${moduleName} } from '${importPath}';`;
};

export const generateExportStatement = (exportName: string): string => {
  return `export const ${exportName} = `;
};
