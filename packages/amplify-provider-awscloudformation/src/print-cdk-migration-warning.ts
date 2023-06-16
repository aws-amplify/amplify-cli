import {
  $TSContext,
  AmplifyCategories,
  AmplifyNodePkgDetectorProps,
  AmplifyNodePkgDetector,
  IAmplifyResource,
  pathManager,
} from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';

/**
 * type to print cdk warning message
 */
export type AmplifyWarning = {
  impactedFiles: string[];
  resolutionMessage: string;
};
/**
 * print cdk migration warning if required
 */
export const printCdkMigrationWarning = async (context: $TSContext): Promise<void> => {
  try {
    const resourcesToBuild: IAmplifyResource[] = [];
    const { allResources } = await context.amplify.getResourceStatus();
    allResources.forEach((resource) => {
      resourcesToBuild.push({
        service: resource.service as string,
        category: resource.category as string,
        resourceName: resource.resourceName as string,
      });
    });
    // check for override.ts file enabled
    const migrationString = await getMigrationMessage(resourcesToBuild);
    if (!_.isEmpty(migrationString)) {
      printer.warn(migrationString);
    }
  } catch (error) {
    // suppress error if cdk detection fails for some reason
  }
};

const getOverridesWarning = async (
  resourcesToBuild: IAmplifyResource[],
  dependencyToSearch: string,
): Promise<AmplifyWarning | undefined> => {
  let overridesWarningObject;
  for (const resource of resourcesToBuild) {
    // since overrides project is backend
    const overrideFilePath = pathManager.getResourceOverrideFilePath(undefined, resource.category, resource.resourceName);
    // const overrideFilePath = path.join(backendDir, resource.category, resource.resourceName, 'override.ts');
    // this checks is overrides are enabled on resource and cdkV1OverrideWarningObj should be empty
    if (fs.existsSync(overrideFilePath) && _.isEmpty(overridesWarningObject)) {
      const amplifyDetectorProps: AmplifyNodePkgDetectorProps = {
        projectRoot: pathManager.getBackendDirPath(),
      };

      const explicitDependencies = (await AmplifyNodePkgDetector.getInstance(amplifyDetectorProps)).detectAffectedDirectDependencies(
        dependencyToSearch,
      );
      if (!_.isEmpty(explicitDependencies)) {
        overridesWarningObject = {
          impactedFiles: [path.join(pathManager.getBackendDirPath(), 'package.json')],
          resolutionMessage: `Upgrade '@aws-amplify/cli-extensibility-helper' to latest version ^3.0.0`,
        };
      }
    }
  }
  return overridesWarningObject;
};

const getCustomResourcesWarning = async (
  resourcesToBuild: IAmplifyResource[],
  dependencyToSearch: string,
): Promise<AmplifyWarning | undefined> => {
  let customResourcesWarningObject;
  const customResourceImpactedFiles = [];
  const customCategoryResources = resourcesToBuild.filter(
    (resource) => resource.category === AmplifyCategories.CUSTOM && resource.service !== 'customCloudformation',
  );
  for (const resource of customCategoryResources) {
    const targetDir = path.join(pathManager.getBackendDirPath(), resource.category, resource.resourceName);
    const amplifyDetectorProps: AmplifyNodePkgDetectorProps = {
      projectRoot: targetDir,
    };

    const explicitDependencies = (await AmplifyNodePkgDetector.getInstance(amplifyDetectorProps)).detectAffectedDirectDependencies(
      dependencyToSearch,
    );
    if (!_.isEmpty(explicitDependencies)) {
      customResourceImpactedFiles.push(path.join(targetDir, 'package.json'));
      customResourcesWarningObject = {
        impactedFiles: customResourceImpactedFiles,
        resolutionMessage: `Follow this guide: https://docs.aws.amazon.com/cdk/v2/guide/migrating-v2.html`,
      };
    }
  }
  return customResourcesWarningObject;
};

/**
 * returns migration message otherwise undefined
 */
export const getMigrationMessage = async (resourcesToBuild: IAmplifyResource[]): Promise<string> => {
  const migrationBanner = `We detected that you are using CDK v1 with custom stacks and overrides.AWS CDK v1 has entered maintenance mode on June 1, 2022`;
  const dependencyToSearch = '@aws-cdk/core';
  const overridesWarningObject = await getOverridesWarning(resourcesToBuild, dependencyToSearch);
  const customResourceWarningObject = await getCustomResourcesWarning(resourcesToBuild, dependencyToSearch);
  let migrationString;
  if (!_.isEmpty(overridesWarningObject) || !_.isEmpty(customResourceWarningObject)) {
    migrationString = '\n';
    migrationString = migrationString.concat(migrationBanner);
    migrationString = migrationString.concat('\n\nImpacted Files:\n');
    migrationString = migrationString.concat('\n');
  }

  if (!_.isEmpty(overridesWarningObject)) {
    overridesWarningObject.impactedFiles.forEach((file) => {
      migrationString = migrationString.concat(` - ${file}\n`);
    });
    migrationString = migrationString.concat(`${overridesWarningObject.resolutionMessage}\n`);
  }
  if (!_.isEmpty(customResourceWarningObject)) {
    customResourceWarningObject.impactedFiles.forEach((file) => {
      migrationString = migrationString.concat(` - ${file}\n`);
    });
    migrationString = migrationString.concat(`${customResourceWarningObject.resolutionMessage}\n`);
  }
  return migrationString;
};
