/** Dev dependencies required by Gen2 Amplify projects. */
export type AmplifyDevDependencies = {
  readonly '@aws-amplify/backend': string;
  readonly '@aws-amplify/backend-cli': string;
  readonly '@aws-amplify/backend-data': string;
  readonly 'aws-cdk': string;
  readonly 'aws-cdk-lib': string;
  readonly 'ci-info': string;
  readonly constructs: string;
  readonly esbuild: string;
  readonly tsx: string;
  readonly typescript: string;
  readonly '@types/node': string;
};

/** Runtime dependencies for Gen2 Amplify projects. */
export type AmplifyDependencies = {
  readonly 'aws-amplify': string;
};

export type AmplifyPackageVersions = AmplifyDevDependencies & AmplifyDependencies;

export type PackageJsonDependencies = {
  readonly devDependencies?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
};

export type PackageJson = {
  readonly name: string;
  readonly scripts?: Record<string, string>;
} & PackageJsonDependencies;

function withDefault(version?: string): string {
  return version ?? '*';
}

function sortObjectKeys<T extends Record<string, string>>(obj: T): T {
  return Object.keys(obj)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = obj[key];
      return sorted;
    }, {} as Record<string, string>) as T;
}

/** Patches a package.json with Gen2 Amplify dev dependencies. */
export function patchNpmPackageJson(packageJson: PackageJson, packageVersions: Partial<AmplifyPackageVersions> = {}): PackageJson {
  const devDependencies = sortObjectKeys({
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
    '@types/node': withDefault(packageVersions['@types/node']),
  });

  const dependencies = sortObjectKeys({
    ...(packageJson.dependencies ?? {}),
  });

  return {
    ...packageJson,
    devDependencies,
    dependencies,
  };
}
