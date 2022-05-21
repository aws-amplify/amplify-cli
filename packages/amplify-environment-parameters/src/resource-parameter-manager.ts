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
   * Set all parameters associated with the resource. Any existing parameters not included in the input will be removed.
   */
  setAllParams(params: Record<string, string>): void {
    this.params = { ...params };
  }
}
