import { $TSAny, $TSContext, JSONUtilities, stateManager } from 'amplify-cli-core';
import { ResourceExport } from './resource-push/ResourceExport';
import { ResourceDefinition, StackIncludeDetails, StackParameters } from './resource-push/Types';
import * as path from 'path';
import { printer, prompter } from 'amplify-prompts';
import * as fs from 'fs-extra';
import Ora from 'ora';
const backup = 'backup';
import _ from 'lodash';
// don't change file names ever ever
const AMPLIFY_EXPORT_MANIFEST_JSON_FILE = 'amplify-export-manifest.json';
const AMPLIFY_EXPORT_TAGS_JSON_FILE = 'export-tags.json';
const AMPLIFY_EXPORT_CATEGORY_STACK_MAPPING_FILE = 'category-stack-mapping.json';

export async function run(context: $TSContext, resourceDefinition: $TSAny[], exportType: string) {
  const exportPath = context.input.options['out'];
  const { projectName } = stateManager.getProjectConfig();
  const amplifyExportFolder = path.join(path.resolve(exportPath), `amplify-export-${projectName}`);
  const proceed = await checkForExistingExport(amplifyExportFolder);
  if (!proceed) {
    return;
  }
  context.exeInfo = {
    localEnvInfo: stateManager.getLocalEnvInfo(),
  };
  const spinner = Ora('Exporting...');
  spinner.start();
  try {
    const resourceExport = new ResourceExport(context, amplifyExportFolder);

    spinner.text = 'Building and packaging resources';
    const packagedResources = await resourceExport.packageBuildWriteResources(resourceDefinition as any);

    spinner.text = `Writing resources to ${amplifyExportFolder}`;
    await resourceExport.writeResourcesToDestination(packagedResources);

    spinner.text = `Writing Cloudformation files ${amplifyExportFolder}`;
    const { stackParameters, transformedResources } = await resourceExport.generateAndTransformCfnResources(packagedResources);

    spinner.text = `Generating and writing root stack to ${amplifyExportFolder}`;
    const extractedParameters = await resourceExport.generateAndWriteRootStack(stackParameters);
    const parameters = resourceExport.fixNestedStackParameters(transformedResources, extractedParameters);

    spinner.text = `Generating export manifest ${amplifyExportFolder}`;
    writeExportManifest(parameters, exportPath, amplifyExportFolder);

    spinner.text = `Generating category stack mappings`;
    createCategoryStackMapping(transformedResources, amplifyExportFolder);

    spinner.text = 'Generating export tag files';
    createTagsFile(amplifyExportFolder);

    spinner.succeed('Done Exporting');
    printer.blankLine();
    printer.success('Successfully exported');
    printer.info('Some Next steps:');
    printer.info('You can now integrate your Amplify Backend into your CDK App');
    printer.info('By installing the Amplify Backend Export Construct by running npm i @aws-amplify/amplify-export-backend');
    printer.info('For more information: docs.amplify.aws/cli/export');
    printer.blankLine();

    removeBackup(amplifyExportFolder);
  } catch (ex) {
    revertToBackup(amplifyExportFolder);
    spinner.fail();
    throw ex;
  } finally {
    spinner.stop();
  }
}

function createTagsFile(exportPath: string) {
  const tags = stateManager.getProjectTags();
  const hydratedTags = stateManager.getHydratedTags();
  const tagsWithEnv = hydratedTags.map((hydratedTag, i) => {
    const tag = tags[i];
    //revert Tags with amplify-env the amplify-env are handled in the construct
    if (tag.Value.includes('{project-env}')) {
      hydratedTag.Value = tag.Value;
    }
    return hydratedTag;
  });
  JSONUtilities.writeJson(
    path.join(exportPath, AMPLIFY_EXPORT_TAGS_JSON_FILE),
    tagsWithEnv.map(tag => ({
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
    path.join(amplifyExportFolder, AMPLIFY_EXPORT_CATEGORY_STACK_MAPPING_FILE),
    resources.map(r => {
      const { category, resourceName, service } = r;
      return {
        category,
        resourceName,
        service,
      };
    }),
  );
}

/**
 *  checks if there is an existing folder and prompt
 * if yes then a back up is created
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
    if (proceed) {
      await createBackup(amplifyExportFolder);
      await deleteFolderRecursive(amplifyExportFolder);
    }
  }
  await fs.ensureDir(amplifyExportFolder);
  return proceed;
}

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file, index) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

async function removeBackup(amplifyExportFolder: string) {
  if (fs.existsSync(`${amplifyExportFolder}-${backup}`)) {
    await deleteFolderRecursive(`${amplifyExportFolder}-${backup}`);
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

function writeExportManifest(stackParameters: StackParameters, exportPath: string, amplifyExportFolder: string) {
  const rootStackParametersKey = _.first(Object.keys(stackParameters));
  const manifestJson = {
    stackName: rootStackParametersKey,
    props: transformManifestParameters(stackParameters[rootStackParametersKey], exportPath),
  };
  JSONUtilities.writeJson(path.join(amplifyExportFolder, AMPLIFY_EXPORT_MANIFEST_JSON_FILE), manifestJson);
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
