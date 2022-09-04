/**
 * Manages the parameters associated with a specific resource
 *
 * Once parameters are fully supported at the platform / project level, this abstraction can go away over time
 */
export class ResourceParameterManager {
  private params: Record<string, string> = {};

  // eslint-disable-next-line jsdoc/require-jsdoc
  getParam(name: string): string | undefined {
    return this.params[name];
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  setParam(name: string, value: string): void {
    this.params[name] = value;
  }

  /**
   * Set the given parameters. This will only add / update parameters present in the input. It will not remove any existing parameters.
   * (see setAllParams)
   */
  setParams(params: Record<string, string>): void {
    Object.entries(params).forEach(([key, value]) => {
      this.params[key] = value;
    });
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  deleteParam(name: string): void {
    delete this.params[name];
  }

  /**
   * Get all parameters associated with the resource
   */
  getAllParams(): Readonly<Record<string, string>> {
    return { ...this.params };
  }

  /**
   * Set the resource parameters equal to the given parameters. This will remove any parameters that are not present in the input.
   */
  setAllParams(params: Record<string, string>): void {
    this.params = { ...params };
  }

  /**
   * Whether the given parameter is defined
   */
  hasParam(name: string): boolean {
    return !!this.params[name];
  }

  /**
   * Whether this resource manager has any parameters defined
   */
  hasAnyParams(): boolean {
    return Object.keys(this.params).length > 0;
  }
}
