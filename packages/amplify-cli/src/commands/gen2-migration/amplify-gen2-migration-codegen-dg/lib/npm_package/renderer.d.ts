export type AmplifyDevDependencies = {
  '@aws-amplify/backend': string;
  '@aws-amplify/backend-cli': string;
  '@aws-amplify/backend-data': string;
  'aws-cdk': string;
  'aws-cdk-lib': string;
  'ci-info': string;
  constructs: string;
  esbuild: string;
  tsx: string;
  typescript: string;
  '@types/node': string;
};
export type AmplifyDependencies = {
  'aws-amplify': string;
};
export type AmplifyPackageVersions = AmplifyDevDependencies & AmplifyDependencies;
export type PackageJsonDependencies = {
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
};
export type PackageJson = {
  name: string;
  scripts?: Record<string, string>;
} & PackageJsonDependencies;
export declare const patchNpmPackageJson: (packageJson: PackageJson, packageVersions?: Partial<AmplifyPackageVersions>) => PackageJson;
//# sourceMappingURL=renderer.d.ts.map
