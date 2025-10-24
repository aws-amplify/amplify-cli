export class BackendUpdater {
  /**
   * Generates code to add to backend.ts
   */
  generateBackendCode(
    resourceName: string,
    className: string,
    outputs: any[],
  ): {
    import: string;
    stackCreation: string;
    outputs: string;
  } {
    const importPath = `./custom/${resourceName}/resource`;
    const stackVarName = this.toVarName(resourceName);

    return {
      import: `import { ${className} } from '${importPath}';`,
      stackCreation: `const ${stackVarName} = new ${className}(\n  backend.createStack('${resourceName}'),\n  '${className}'\n);`,
      outputs: outputs.length > 0 ? this.generateOutputs(stackVarName, outputs) : '',
    };
  }

  private toVarName(resourceName: string): string {
    return resourceName.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
  }

  private generateOutputs(stackVarName: string, outputs: any[]): string {
    const outputEntries = outputs.map((out) => `    ${out.id}: ${stackVarName}.${out.value}`).join(',\n');

    return `backend.addOutput({\n  custom: {\n${outputEntries}\n  },\n});`;
  }
}
