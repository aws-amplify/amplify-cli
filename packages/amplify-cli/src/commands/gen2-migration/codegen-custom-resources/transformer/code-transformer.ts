import { ParsedStack, TransformResult } from '../types';

export class CodeTransformer {
  /**
   * Transforms Gen1 CDK Stack to Gen2 Construct
   */
  transform(parsed: ParsedStack, resourceName: string): TransformResult {
    const className = this.generateClassName(resourceName);
    const imports = this.transformImports(parsed.imports);
    const constructorBody = this.transformConstructorBody(parsed.constructorBody);
    const publicProperties = this.extractPublicProperties(constructorBody);

    return {
      className,
      imports,
      constructorBody,
      publicProperties,
      outputs: parsed.outputs,
    };
  }

  private generateClassName(resourceName: string): string {
    const pascalCase = resourceName
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    return `${pascalCase}Stack`;
  }

  private transformImports(imports: string[]): string[] {
    return imports
      .filter((imp) => !imp.includes('@aws-amplify/cli-extensibility-helper'))
      .map((imp) => imp.replace(/from\s+['"]constructs['"]/, "from 'constructs'"));
  }

  private transformConstructorBody(body: string): string {
    let transformed = body;

    // Remove CfnParameter for 'env'
    transformed = transformed.replace(/new\s+cdk\.CfnParameter\s*\(\s*this\s*,\s*['"]env['"]\s*,\s*\{[^}]+\}\s*\)\s*;?\s*/gi, '');

    // Replace cdk.Fn.ref('env') with process.env.AMPLIFY_ENV
    transformed = transformed.replace(/cdk\.Fn\.ref\s*\(\s*['"]env['"]\s*\)/gi, 'process.env.AMPLIFY_ENV');

    // Replace AmplifyHelpers.getProjectInfo().projectName
    transformed = transformed.replace(
      /AmplifyHelpers\.getProjectInfo\s*\(\s*\)\.projectName/gi,
      "process.env.AMPLIFY_PROJECT_NAME || 'myproject'",
    );

    // Replace AmplifyHelpers.getProjectInfo().envName
    transformed = transformed.replace(/AmplifyHelpers\.getProjectInfo\s*\(\s*\)\.envName/gi, 'process.env.AMPLIFY_ENV');

    // Remove CfnOutput declarations (will be handled separately)
    transformed = transformed.replace(/new\s+cdk\.CfnOutput\s*\([^)]+\)\s*;?\s*/gi, '');

    // Add TODO for AmplifyHelpers.addResourceDependency
    if (transformed.includes('AmplifyHelpers.addResourceDependency')) {
      transformed = `// TODO: Manual migration required for AmplifyHelpers.addResourceDependency\n    // See: https://docs.amplify.aws/react/start/migrate-to-gen2/\n    ${transformed}`;
    }

    return transformed;
  }

  private extractPublicProperties(constructorBody: string): string[] {
    const properties: string[] = [];
    const constRegex = /const\s+(\w+)\s*=\s*new\s+[\w.]+/g;

    let match;
    while ((match = constRegex.exec(constructorBody)) !== null) {
      properties.push(match[1]);
    }

    return properties;
  }
}
