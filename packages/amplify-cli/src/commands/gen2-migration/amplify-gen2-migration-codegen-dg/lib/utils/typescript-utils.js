'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.generateExportStatement = exports.generateImportStatement = void 0;
const generateImportStatement = (moduleName, importPath) => {
  return `import { ${moduleName} } from '${importPath}';`;
};
exports.generateImportStatement = generateImportStatement;
const generateExportStatement = (exportName) => {
  return `export const ${exportName} = `;
};
exports.generateExportStatement = generateExportStatement;
//# sourceMappingURL=typescript-utils.js.map
