import { getPackageManagerByType, packageManagers, PackageManagerType } from '@aws-amplify/amplify-cli-core';
import { BuildType, FunctionParameters } from '@aws-amplify/amplify-function-plugin-interface';
import { minLength, prompter } from '@aws-amplify/amplify-prompts';

export const packageManagerWalkthrough = async (runtime: string): Promise<Partial<FunctionParameters>> => {
  if (runtime === 'nodejs') {
    const packageManagerOptions = Object.values(packageManagers).map((pm) => ({
      name: pm.displayValue,
      value: pm.packageManager as string,
    }));

    const packageManager = (await prompter.pick(
      'Choose the package manager that you want to use:',
      packageManagerOptions,
    )) as PackageManagerType;

    return {
      scripts: {
        build: await getBuildCommand(packageManager),
      },
    };
  }

  return {};
};

const getBuildCommand = async (packageManager: PackageManagerType): Promise<string> => {
  if (packageManager === 'custom') {
    return prompter.input('Enter command or script path to build your function:', {
      validate: minLength(1),
    });
  } else {
    const packageManagerInstance = getPackageManagerByType(packageManager);
    return [packageManagerInstance.executable].concat(packageManagerInstance.getInstallArgs(BuildType.PROD)).join(' ');
  }
};
