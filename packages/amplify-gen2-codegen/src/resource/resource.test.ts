import ts from 'typescript';
import assert from 'node:assert';
import { printNodeArray } from '../test_utils/ts_node_printer';
import { renderResourceTsFile, ResourceTsParameters } from './resource';

const factory = ts.factory;

describe('Resource.ts file generation', () => {
  describe('imports', () => {
    const importedFunctionName = 'helloWorld';
    const additionalImportedBackendIdentifiers: Record<string, Set<string>> = { 'my-hello-world-package': new Set() };
    additionalImportedBackendIdentifiers['my-hello-world-package'].add(importedFunctionName);
    const exportedVariableName = 'goodbyeWorld';
    const render = (parameters?: Partial<ResourceTsParameters>) =>
      printNodeArray(
        renderResourceTsFile({
          backendFunctionConstruct: importedFunctionName,
          additionalImportedBackendIdentifiers,
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
      additionalImportedBackendIdentifiers['my-hello-world-package'].add(additionalImport);
      assert.match(
        render({ additionalImportedBackendIdentifiers }),
        new RegExp(`import \\{ ${importedFunctionName}, ${additionalImport} \\} from `),
      );
    });
    it('calls import with the correct package name', () => {
      assert.match(render(), new RegExp('from\\s+["\']my-hello-world-package["\']'));
    });
    it('makes the function call', () => {
      assert.match(render(), new RegExp(`${importedFunctionName}\\(\\{\\}\\);`));
    });
    it('exports the variable', () => {
      assert.match(render(), new RegExp(`export const ${exportedVariableName} =`));
    });
    it('adds additional statements the define resource function call', () => {
      assert.match(
        render({
          postExportStatements: [
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
    it('adds additional statements after import', () => {
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
