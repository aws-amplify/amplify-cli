import { $TSAny, $TSContext, JSONUtilities, PathConstants, stateManager, spinner } from 'amplify-cli-core';
import { ResourceExport } from './resource-package/resource-export';
import { ResourceDefinition, StackIncludeDetails, StackParameters } from './resource-package/types';
import * as path from 'path';
import { printer, prompter } from 'amplify-prompts';
import * as fs from 'fs-extra';
const backup = 'backup';
import _ from 'lodash';
import rimraf from 'rimraf';
import { validateExportDirectoryPath } from 'amplify-cli-core';
/**
 * Walks through
 * @param context
 * @param resourceDefinition
 * @param exportPath is the path to export to
 */
export async function run(context: $TSContext, resourceDefinition: $TSAny[], exportPath: string) {
  const resolvedExportDir = validateExportDirectoryPath(exportPath, PathConstants.DefaultExportFolder);

  const { projectName } = stateManager.getProjectConfig();
  const amplifyExportFolder = path.join(resolvedExportDir, `amplify-export-${projectName}`);
  const proceed = await checkForExistingExport(amplifyExportFolder);

  if (proceed) {
    // create backup and then start exporting
    await createBackup(amplifyExportFolder);
    deleteFolder(amplifyExportFolder);
  } else {
    // return if user selects not to proceed
    return;
  }

  spinner.start();
  try {
    const resourceExport = new ResourceExport(context, amplifyExportFolder);

    spinner.text = 'Building and packaging resources';
    const packagedResources = await resourceExport.packageBuildWriteResources(resourceDefinition as any);

    spinner.text = `Writing resources`;
    await resourceExport.writeResourcesToDestination(packagedResources);

    spinner.text = `Writing Cloudformation`;
    const { stackParameters, transformedResources } = await resourceExport.generateAndTransformCfnResources(packagedResources);

    spinner.text = `Generating and writing root stack`;
    const extractedParameters = await resourceExport.generateAndWriteRootStack(stackParameters);
    const parameters = resourceExport.fixNestedStackParameters(transformedResources, extractedParameters);

    spinner.text = `Generating export manifest`;
    writeExportManifest(parameters, resolvedExportDir, amplifyExportFolder);

    spinner.text = `Generating category stack mappings`;
    createCategoryStackMapping(transformedResources, amplifyExportFolder);

    spinner.text = 'Generating export tag file';
    createTagsFile(amplifyExportFolder);

    spinner.text = 'Setting permissions';
    await setPermissions(amplifyExportFolder);
    spinner.succeed();
    printer.blankLine();
    printer.success('Successfully exported');
    printer.info('Next steps:');
    printer.info('You can now integrate your Amplify Backend into your CDK App');
    printer.info(
      'Install the "Amplify Exported Backend" CDK Construct by running "npm i @aws-amplify/cdk-exported-backend" in your CDK app',
    );
    printer.info('For more information: https://docs.amplify.aws/cli/usage/export-to-cdk');
    printer.blankLine();
  } catch (ex) {
    revertToBackup(amplifyExportFolder);
    spinner.fail();
    throw ex;
  } finally {
    removeBackup(amplifyExportFolder);
    spinner.stop();
  }
}

/**
 * setting permissions rwx for user
 * @param amplifyExportFolder
 */
async function setPermissions(amplifyExportFolder: string): Promise<void> {
  await fs.chmod(amplifyExportFolder, 0o700);
}
/**
 * Gets the tags from the tags.json file and transforms them into Pascal case
 * leaves the project-env var in for the CDK construct to apply
 * @param exportPath
 */
function createTagsFile(exportPath: string) {
  const hydratedTags = stateManager.getHydratedTags(undefined, true);

  JSONUtilities.writeJson(
    path.join(exportPath, PathConstants.ExportTagsJsonFileName),
    hydratedTags.map(tag => ({
      key: tag.Key,
      value: tag.Value,
    })),
  );
}

/**
 * generates category stack mapping of the files
 * @param resources
 * @param amplifyExportFolder export folder different from the root of the export
 */
function createCategoryStackMapping(resources: ResourceDefinition[], amplifyExportFolder: string) {
  JSONUtilities.writeJson(
    path.join(amplifyExportFolder, PathConstants.ExportCategoryStackMappingJsonFilename),
    resources.map(r => {
      return _.pick(r, ['category', 'resourceName', 'service']);
    }),
  );
}

/**
 *  checks if there is an existing folder and prompt
 * @param amplifyExportFolder
 * @returns true if to proceed no if to exit
 */
async function checkForExistingExport(amplifyExportFolder: string): Promise<boolean> {
  let proceed = true;
  if (fs.existsSync(amplifyExportFolder)) {
    proceed = await prompter.yesOrNo(
      `Existing files at ${amplifyExportFolder} will be deleted and new files will be generated, continue?`,
      true,
    );
  }
  await fs.ensureDir(amplifyExportFolder);
  return proceed;
}

function deleteFolder(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    rimraf.sync(directoryPath);
  }
}

async function removeBackup(amplifyExportFolder: string) {
  if (fs.existsSync(`${amplifyExportFolder}-${backup}`)) {
    deleteFolder(`${amplifyExportFolder}-${backup}`);
  }
}
async function revertToBackup(amplifyExportFolder: string) {
  if (fs.existsSync(`${amplifyExportFolder}-${backup}`)) {
    await fs.copy(`${amplifyExportFolder}-${backup}`, amplifyExportFolder);
  }
}

async function createBackup(amplifyExportFolder: string) {
  await fs.copy(amplifyExportFolder, `${amplifyExportFolder}-${backup}`);
}

/**
 * Transforms the stackparameters file path to convert into the export manifest file
 * @param stackParameters
 * @param exportPath
 * @param amplifyExportFolder
 */
function writeExportManifest(stackParameters: StackParameters, exportPath: string, amplifyExportFolder: string) {
  const rootStackParametersKey = _.first(Object.keys(stackParameters));
  const manifestJson = {
    stackName: rootStackParametersKey,
    props: transformManifestParameters(stackParameters[rootStackParametersKey], amplifyExportFolder),
  };
  JSONUtilities.writeJson(path.join(amplifyExportFolder, PathConstants.ExportManifestJsonFilename), manifestJson);
}

function transformManifestParameters(stackParameters: StackIncludeDetails, exportPath: string) {
  if (stackParameters) {
    const manifest = {
      templateFile: path.relative(exportPath, stackParameters.destination),
      parameters: stackParameters.parameters,
      preserveLogicalIds: true,
      loadNestedStacks: {},
    };
    if (!stackParameters.nestedStacks) {
      return manifest;
    }
    Object.keys(stackParameters.nestedStacks)
      .sort()
      .forEach(key => {
        manifest['loadNestedStacks'][key] = transformManifestParameters(stackParameters.nestedStacks[key], exportPath);
      });
    return manifest;
  }
}
