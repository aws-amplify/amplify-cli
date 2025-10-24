export class PatternDetector {
  /**
   * Detects Gen1 patterns that need transformation
   */
  detectPatterns(constructorBody: string): {
    hasCfnParameter: boolean;
    hasCdkFnRef: boolean;
    hasGetProjectInfo: boolean;
    hasAddResourceDependency: boolean;
    hasCfnOutput: boolean;
  } {
    return {
      hasCfnParameter: /new\s+cdk\.CfnParameter\s*\(\s*this\s*,\s*['"]env['"]/i.test(constructorBody),
      hasCdkFnRef: /cdk\.Fn\.ref\s*\(\s*['"]env['"]\s*\)/i.test(constructorBody),
      hasGetProjectInfo: /AmplifyHelpers\.getProjectInfo\s*\(\s*\)/i.test(constructorBody),
      hasAddResourceDependency: /AmplifyHelpers\.addResourceDependency/i.test(constructorBody),
      hasCfnOutput: /new\s+cdk\.CfnOutput/i.test(constructorBody),
    };
  }

  /**
   * Extracts CfnOutput declarations from constructor body
   */
  extractCfnOutputs(constructorBody: string): Array<{ id: string; value: string; description?: string }> {
    const outputs: Array<{ id: string; value: string; description?: string }> = [];
    const outputRegex = /new\s+cdk\.CfnOutput\s*\(\s*this\s*,\s*['"]([^'"]+)['"]\s*,\s*\{([^}]+)\}/g;

    let match;
    while ((match = outputRegex.exec(constructorBody)) !== null) {
      const id = match[1];
      const propsStr = match[2];

      const valueMatch = /value\s*:\s*([^,}]+)/i.exec(propsStr);
      const descMatch = /description\s*:\s*['"]([^'"]+)['"]/i.exec(propsStr);

      if (valueMatch) {
        outputs.push({
          id,
          value: valueMatch[1].trim(),
          description: descMatch ? descMatch[1] : undefined,
        });
      }
    }

    return outputs;
  }
}
