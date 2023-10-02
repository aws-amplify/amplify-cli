export type RequiredDependency = {
  dependencyName: string;
  reason: string;
};

export abstract class RequiredDependencyProvider<DependencyType extends RequiredDependency> {
  abstract getRequiredDependencies(hasStorageManager?: boolean): DependencyType[];
}

type SemVerRequiredDependency = RequiredDependency & {
  supportedSemVerPattern: string;
};

export class ReactRequiredDependencyProvider extends RequiredDependencyProvider<SemVerRequiredDependency> {
  getRequiredDependencies(hasStorageManager?: boolean): SemVerRequiredDependency[] {
    const dependencies = [
      {
        dependencyName: '@aws-amplify/ui-react',
        supportedSemVerPattern: '^4.6.0',
        reason: 'Required to leverage Amplify UI primitives, and Amplify Studio component helper functions.',
      },
      {
        dependencyName: 'aws-amplify',
        supportedSemVerPattern: '^5.0.2',
        reason: 'Required to leverage DataStore.',
      },
    ];

    if (hasStorageManager) {
      dependencies.push({
        dependencyName: '@aws-amplify/ui-react-storage',
        supportedSemVerPattern: '^1.1.0',
        reason: 'Required to leverage StorageManager.',
      });
    }

    return dependencies;
  }
}
