import * as ts from 'typescript';
import * as fs from 'fs-extra';
import { ParsedStack } from '../types';

export class CdkStackParser {
  /**
   * Parses a Gen1 CDK stack file and extracts key information
   */
  async parseStack(filePath: string): Promise<ParsedStack> {
    const sourceCode = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);

    const imports: string[] = [];
    let className = 'CustomStack';
    let constructorBody = '';
    const outputs: any[] = [];
    let hasAmplifyHelpers = false;
    let hasResourceDependency = false;

    const visit = (node: ts.Node) => {
      // Extract imports
      if (ts.isImportDeclaration(node)) {
        imports.push(node.getText(sourceFile));
        if (node.getText(sourceFile).includes('@aws-amplify/cli-extensibility-helper')) {
          hasAmplifyHelpers = true;
        }
      }

      // Extract class name
      if (ts.isClassDeclaration(node) && node.name) {
        className = node.name.text;

        // Find constructor
        node.members.forEach((member) => {
          if (ts.isConstructorDeclaration(member) && member.body) {
            constructorBody = member.body.getText(sourceFile);

            // Check for AmplifyHelpers.addResourceDependency
            if (constructorBody.includes('AmplifyHelpers.addResourceDependency')) {
              hasResourceDependency = true;
            }
          }
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return {
      className,
      imports,
      constructorBody,
      outputs,
      hasAmplifyHelpers,
      hasResourceDependency,
    };
  }
}
