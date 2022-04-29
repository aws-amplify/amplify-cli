export interface FeatureFlagProvider {
  getBoolean(featureName: string, defaultValue?: boolean): boolean;
  getString(featureName: string, defaultValue?: string): string;
  getNumber(featureName: string, defaultValue?: number): number;
  getObject(featureName: string, defaultValue?: object): object; // eslint-disable-line @typescript-eslint/ban-types
}
