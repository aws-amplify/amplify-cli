export class EnvVarFormatError extends Error {
  constructor(variableName: string) {
    let normalizedName = variableName;

    if (variableName === undefined || variableName.trim().length === 0) {
      normalizedName = '<unknown>';
    }

    super(`Invalid variable name format: '${normalizedName}'`);

    this.name = 'EnvVarFormatError';
  }
}
