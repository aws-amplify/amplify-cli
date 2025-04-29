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

const withDefault = (version?: string) => version ?? '*';

export const patchNpmPackageJson = (packageJson: PackageJson, packageVersions: Partial<AmplifyPackageVersions> = {}): PackageJson => {
  return {
    ...packageJson,
    devDependencies: {
      ...(packageJson.devDependencies ?? {}),
      '@aws-amplify/backend': withDefault(packageVersions['@aws-amplify/backend']),
      '@aws-amplify/backend-cli': withDefault(packageVersions['@aws-amplify/backend-cli']),
      '@aws-amplify/backend-data': withDefault(packageVersions['@aws-amplify/backend-data']),
      'aws-cdk': withDefault(packageVersions['aws-cdk']),
      'aws-cdk-lib': withDefault(packageVersions['aws-cdk-lib']),
      'ci-info': withDefault(packageVersions['ci-info']),
      constructs: withDefault(packageVersions.constructs),
      esbuild: withDefault(packageVersions.esbuild),
      tsx: withDefault(packageVersions.tsx),
      typescript: withDefault(packageVersions.typescript),
      '@types/node': withDefault(packageVersions['@types/node']),
    },
    dependencies: {
      ...(packageJson.dependencies ?? {}),
      'aws-amplify': withDefault(packageVersions['aws-amplify']),
    },
  };
};
