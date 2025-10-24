import { TransformResult } from '../types';

export class Gen2FileGenerator {
  /**
   * Generates Gen2 resource.ts file content
   */
  generateResourceFile(transform: TransformResult): string {
    const imports = this.generateImports(transform.imports);
    const classDeclaration = this.generateClassDeclaration(transform);

    return `${imports}\n\n${classDeclaration}`;
  }

  private generateImports(imports: string[]): string {
    const filtered = imports.filter((imp) => !imp.includes('@aws-amplify/cli-extensibility-helper'));

    // Ensure Construct import
    if (!filtered.some((imp) => imp.includes("from 'constructs'"))) {
      filtered.unshift("import { Construct } from 'constructs';");
    }

    return filtered.join('\n');
  }

  private generateClassDeclaration(transform: TransformResult): string {
    const { className, constructorBody, publicProperties } = transform;

    const publicProps =
      publicProperties.length > 0 ? publicProperties.map((prop) => `  public readonly ${prop}: any;`).join('\n') + '\n\n' : '';

    return `export class ${className} extends Construct {
${publicProps}  constructor(scope: Construct, id: string) {
    super(scope, id);
${this.indentCode(constructorBody, 4)}
  }
}`;
  }

  private indentCode(code: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return code
      .split('\n')
      .map((line) => (line.trim() ? indent + line : line))
      .join('\n');
  }
}
