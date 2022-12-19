import {
  $TSContext, AmplifyCategories, AmplifyNodeJsDetectorProps, AmplifyNodePkgDetector, getPackageManager, IAmplifyResource, pathManager,
} from 'amplify-cli-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import _ from 'lodash';
import { printer } from 'amplify-prompts';

/**
 * type to print cdk warning message
 */
export type AmplifyWarningObjectType = {
  impactedFiles: string[],
  resolutionMessage: string
}
/**
 * print cdk migration warning if required
 */
export const printCdkMigrationWarning = async (context: $TSContext): Promise<void> => {
  const resourcesToBuild: IAmplifyResource[] = [];
  const { allResources } = await context.amplify.getResourceStatus();
  allResources.forEach(resource => {
    resourcesToBuild.push({
      service: resource.service as string,
      category: resource.category as string,
      resourceName: resource.resourceName as string,
    });
  });
  // check for override.ts file enabled

  let cdkV1OverrideWarningObject: AmplifyWarningObjectType;
  let cdkV1CustomResourceWarningObject : AmplifyWarningObjectType;
  const customResourceImpactedFiles = [];
  const backendDir = pathManager.getBackendDirPath();
  for (const resource of resourcesToBuild) {
    if (resource.category === AmplifyCategories.CUSTOM) {
      const targetDir = path.resolve(path.join(pathManager.getBackendDirPath(), resource.category, resource.resourceName));
      const packageManager = getPackageManager(targetDir);
      if (packageManager === null) {
        throw new Error('run build custom resource first');
      }
      const amplifyDetectorProps: AmplifyNodeJsDetectorProps = {
        projectRoot: targetDir,
        dependencyToSearch: '@aws-cdk/core',
        dependencyVersion: '1.172.0',
        packageManager,
      };

      const dec = new AmplifyNodePkgDetector(amplifyDetectorProps);
      const dependentResolvedObj1 = dec.getDependentPackage('@aws-cdk/core');
      const dependentResolvedObj2 = dec.getDependentPackage('@aws-amplify/cli-extensibility-helper');

      if (!_.isEmpty(dependentResolvedObj2) || !_.isEmpty(dependentResolvedObj1)) {
        customResourceImpactedFiles.push(path.join(targetDir, 'package.json'));
        cdkV1CustomResourceWarningObject = {
          impactedFiles: customResourceImpactedFiles,
          resolutionMessage: `Follow this guide here : https://docs.aws.amazon.com/cdk/v2/guide/migrating-v2.html`,
        };
      }
    } else {
      // since overrides project is backend
      const packageManager = getPackageManager(backendDir);
      const overrideFilePath = path.join(backendDir, resource.category, resource.resourceName, 'override.ts');
      // this checks is overrides are enabled on resource and cdkV1OverrideWarningObj should be empty
      if (fs.existsSync(overrideFilePath) && _.isEmpty(cdkV1OverrideWarningObject)) {
        const amplifyDetectorProps: AmplifyNodeJsDetectorProps = {
          projectRoot: backendDir,
          dependencyToSearch: '@aws-cdk/core',
          dependencyVersion: '1.172.0',
          packageManager,
        };

        const dec = new AmplifyNodePkgDetector(amplifyDetectorProps);
        // only checks @aws-amplify/cli-extensibility-helper pkg in overrides
        const dependentResolvedObj2 = dec.getDependentPackage('@aws-amplify/cli-extensibility-helper');

        console.log(dependentResolvedObj2);
        if (!_.isEmpty(dependentResolvedObj2)) {
          const impactedFiles = [path.join(backendDir, 'package.json')];
          const resolutionMessage = `Upgrade '@aws-amplify/cli-extensibility-helper' to latest version ^3.0.0`;
          cdkV1OverrideWarningObject = {
            impactedFiles,
            resolutionMessage,
          };
        }
      }
    }
  }
  displayMigrationMessageIfRequired(cdkV1CustomResourceWarningObject, cdkV1OverrideWarningObject);
};

const displayMigrationMessageIfRequired = (cdkV1CustomResourceWarningObject: AmplifyWarningObjectType,
  cdkV1OverrideWarningObject: AmplifyWarningObjectType): void => {
  const migrationBanner = `We detect you are using CDK v1 with custom stacks and overrides.AWS CDK v1 has entered
    maintenance mode on June 1, 2022`;
  if (!_.isEmpty(cdkV1OverrideWarningObject) || !_.isEmpty(cdkV1CustomResourceWarningObject)) {
    printer.warn(migrationBanner);
    printer.warn('Impacted Files:');
    cdkV1OverrideWarningObject.impactedFiles.forEach(file => printer.warn(file));
    printer.info(cdkV1OverrideWarningObject.resolutionMessage);
    cdkV1CustomResourceWarningObject.impactedFiles.forEach(file => printer.warn(file));
    printer.info(cdkV1CustomResourceWarningObject.resolutionMessage);
  }
};
