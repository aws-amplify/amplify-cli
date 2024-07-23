import ts from 'typescript';
import assert from 'node:assert';
import { printNodeArray } from '../test_utils/ts_node_printer';
import { renderResourceTsFile, ResourceTsParameters } from './resource';

const factory = ts.factory;

describe('Resource.ts file generation', () => {
  describe('imports', () => {
    const importedFunctionName = 'helloWorld';
    const importedPackageName = 'my-hello-world-package';
    const exportedVariableName = 'goodbyeWorld';
    const render = (parameters?: Partial<ResourceTsParameters>) =>
      printNodeArray(
        renderResourceTsFile({
          backendFunctionConstruct: importedFunctionName,
          importedPackageName,
          functionCallParameter: factory.createObjectLiteralExpression(),
          exportedVariableName: factory.createIdentifier(exportedVariableName),
          ...parameters,
        }),
      );
    it('calls import with the correct function name', () => {
      assert.match(render(), new RegExp(`import \\{ ${importedFunctionName} \\}`));
    });
    it('calls import with additionally import identifiers', () => {
      const additionalImport = 'aGoodDayToYou';
      assert.match(
        render({ additionalImportedBackendIdentifiers: [additionalImport] }),
        new RegExp(`import \\{ ${importedFunctionName}, ${additionalImport} \\} from `),
      );
    });
    it('calls import with the correct package name', () => {
      assert.match(render(), new RegExp(`from "${importedPackageName}";`));
    });
    it('makes the function call', () => {
      assert.match(render(), new RegExp(`${importedFunctionName}\\(\\{\\}\\);`));
    });
    it('exports the variable', () => {
      assert.match(render(), new RegExp(`export const ${exportedVariableName} =`));
    });
    it('adds additional statements', () => {
      assert.match(
        render({
          postImportStatements: [
            factory.createExpressionStatement(
              factory.createEquality(
                factory.createAdd(factory.createNumericLiteral(1), factory.createNumericLiteral(1)),
                factory.createNumericLiteral(2),
              ),
            ),
          ],
        }),
        /1 \+ 1 == 2/,
      );
    });
  });
});
