import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';
import * as cfnDiff from '@aws-cdk/cloudformation-diff';
import {
  $TSAny, generateCustomPoliciesInTemplate, pathManager, readCFNTemplate,
} from 'amplify-cli-core';
import { Template } from 'cloudform-types';
import { print } from './print';
import { getResourceService } from './resource-status-data';

const CategoryProviders = {
  CLOUDFORMATION: 'cloudformation',
};

/**
 * helper for stack mutation styling
 */
export interface StackMutationInfo {
  label: string;
  consoleStyle: chalk.Chalk;
  icon: string;
}

/**
 * helper for summary styling
 */
export interface StackMutationType {
  CREATE: StackMutationInfo;
  UPDATE: StackMutationInfo;
  DELETE: StackMutationInfo;
  IMPORT: StackMutationInfo;
  UNLINK: StackMutationInfo;
  NOCHANGE: StackMutationInfo;
}
// helper map from mutation-type to ux styling
export const stackMutationType: StackMutationType = {
  CREATE: {
    label: 'Create',
    consoleStyle: chalk.green.bold,
    icon: '[+]',
  },
  UPDATE: {
    label: 'Update',
    consoleStyle: chalk.yellow.bold,
    icon: '[~]',
  },

  DELETE: {
    label: 'Delete',
    consoleStyle: chalk.red.bold,
    icon: '[-]',
  },

  IMPORT: {
    label: 'Import',
    consoleStyle: chalk.blue.bold,
    icon: '[\u21E9]',
  },

  UNLINK: {
    label: 'Unlink',
    consoleStyle: chalk.red.bold,
    icon: '[\u2BFB]',
  },
  NOCHANGE: {
    label: 'No Change',
    consoleStyle: chalk.grey,
    icon: '[ ]',
  },
};

/**
 * helper to capitalize string
 */
export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// Console text styling for resource details section
const resourceDetailSectionStyle = chalk.bgRgb(15, 100, 204);

// IResourcePaths: Interface for (build/pre-build) paths to local and cloud CFN files
interface IResourcePaths {
  localPreBuildCfnFile: string;
  cloudPreBuildCfnFile: string;
  localBuildCfnFile: string;
  cloudBuildCfnFile: string;
}

/**
 * Find path to the cloudformation templates in the given file folder
 */
export const globCFNFilePath = (fileFolder: string):string => {
  if (fs.existsSync(fileFolder)) {
    const globOptions: glob.IOptions = {
      absolute: false,
      cwd: fileFolder,
      follow: false,
      // eslint-disable-next-line spellcheck/spell-checker
      nodir: true,
    };
    const templateFileNames = glob.sync('**/*template.{yaml,yml,json}', globOptions);
    for (const templateFileName of templateFileNames) {
      const absolutePath = path.join(fileFolder, templateFileName);
      return absolutePath; // only the top level cloudformation ( nested templates are picked after parsing this file )
    }
  }
  throw new Error(`No CloudFormation template found in ${fileFolder}`);
};

interface ICFNDiffTemplatePaths {
  localTemplatePath: string,
  cloudTemplatePath: string,
}

/**
 * Class to generate CloudFormation diff for a single Amplify Resource
 */
export class ResourceDiff {
  resourceName: string;
  category: string;
  provider: string;
  service: string;
  resourceFiles: IResourcePaths;
  localBackendDir: string;
  cloudBackendDir: string;
  localTemplate: Template;
  cloudTemplate: Template;
  mutationInfo: StackMutationInfo;

  constructor(category: string, resourceName: string, provider: string, mutationInfo: StackMutationInfo) {
    this.localBackendDir = pathManager.getBackendDirPath();
    this.cloudBackendDir = pathManager.getCurrentCloudBackendDirPath();
    this.resourceName = resourceName;
    this.category = category;
    this.provider = this.normalizeProviderForFileNames(provider);
    this.service = getResourceService(category, resourceName);
    this.localTemplate = {}; // requires file-access, hence loaded from async methods
    this.cloudTemplate = {}; // requires file-access, hence loaded from async methods
    this.mutationInfo = mutationInfo;
    // Resource Path state
    const localResourceAbsolutePathFolder = path.normalize(path.join(this.localBackendDir, category, resourceName));
    const cloudResourceAbsolutePathFolder = path.normalize(path.join(this.cloudBackendDir, category, resourceName));
    this.resourceFiles = {
      // Paths using glob for Cfn file and Build file
      localPreBuildCfnFile: this.safeGlobCFNFilePath(localResourceAbsolutePathFolder),
      cloudPreBuildCfnFile: this.safeGlobCFNFilePath(cloudResourceAbsolutePathFolder),
      // Build folder exists for services like GraphQL api which have an additional build step to generate CFN.
      localBuildCfnFile: this.safeGlobCFNFilePath(path.normalize(path.join(localResourceAbsolutePathFolder, 'build'))),
      cloudBuildCfnFile: this.safeGlobCFNFilePath(path.normalize(path.join(cloudResourceAbsolutePathFolder, 'build'))),
    };
  }

  // API :View: Print the resource detail status for the given mutation (Create/Update/Delete)
  public printResourceDetailStatus = async (mutationInfo: StackMutationInfo): Promise<void> => {
    const header = `${mutationInfo.consoleStyle(mutationInfo.label)}`;
    const diff = await this.calculateCfnDiff();
    print.info(`${resourceDetailSectionStyle(`[\u27A5] Resource Stack: ${capitalize(this.category)}/${this.resourceName}`)} : ${header}`);
    const diffCount = this.printStackDiff(diff, process.stdout);
    if (diffCount === 0) {
      console.log('No changes  ');
    }
  };

  // API :Data: Calculate the difference in cloudformation templates between local and cloud templates
  public calculateCfnDiff = async (): Promise<cfnDiff.TemplateDiff> => {
    const resourceTemplatePaths = await this.getCfnResourceFilePaths();
    // set the member template objects
    this.localTemplate = await this.safeReadCFNTemplate(resourceTemplatePaths.localTemplatePath);
    this.localTemplate = generateCustomPoliciesInTemplate(this.localTemplate, this.resourceName, this.service, this.category);
    this.cloudTemplate = await this.safeReadCFNTemplate(resourceTemplatePaths.cloudTemplatePath);

    // Note!! :- special handling to support multi-env. Currently in multi-env, when new env is created,
    // we do *Not* delete the cloud-backend folder. Hence this logic will always give no diff for new resources.
    // TBD: REMOVE this once we delete cloud-backend folder for new envs
    if (this.mutationInfo.label === stackMutationType.CREATE.label) {
      this.cloudTemplate = {}; // Don't use the parent env's template
    }

    // calculate diff of graphs.
    const diff: cfnDiff.TemplateDiff = cfnDiff.diffTemplate(this.cloudTemplate, this.localTemplate);
    return diff;
  };

  // helper: wrapper around readCFNTemplate type to handle expressions.
  private safeReadCFNTemplate = async (filePath: string): Promise<Template> => {
    const templateResult = readCFNTemplate(filePath, { throwIfNotExist: false });
    return templateResult?.cfnTemplate || {};
  };

  // helper: Select cloudformation file path from build folder or non build folder.
  // TBD: Update this function to infer filePath based on the state of the resource.
  private getCfnResourceFilePaths = async ():Promise<ICFNDiffTemplatePaths> => {
    const resourceFilePaths:ICFNDiffTemplatePaths = {
      localTemplatePath: checkExist(this.resourceFiles.localBuildCfnFile)
        ? this.resourceFiles.localBuildCfnFile
        : this.resourceFiles.localPreBuildCfnFile,
      cloudTemplatePath: checkExist(this.resourceFiles.cloudBuildCfnFile)
        ? this.resourceFiles.cloudBuildCfnFile
        : this.resourceFiles.cloudPreBuildCfnFile,
    };
    return resourceFilePaths;
  };

  // helper: Get category provider from filename
  private normalizeProviderForFileNames = (provider: string): string => {
    // file-names are currently standardized around "cloudformation" not awscloudformation.
    if (provider === 'awscloudformation') {
      return CategoryProviders.CLOUDFORMATION;
    }
    return provider;
  }

  /**
   * helper: Convert cloudformation template diff data using CDK api
   * @param templateDiff CFN template diff object
   * @param stream CFK format stream (stdout/stderr)
   * @returns number of differences calculated and updated into the template diff
   */
  private printStackDiff = (templateDiff: cfnDiff.TemplateDiff, stream?: cfnDiff.FormatStream):number => {
    // filter out 'AWS::CDK::Metadata' since info is not helpful and formatDifferences doesn't know how to format it.
    if (templateDiff.resources) {
      // eslint-disable-next-line no-param-reassign
      templateDiff.resources = templateDiff.resources.filter(change => {
        if (!change) {
          return true;
        }
        if (this.isResourceTypeCDKMetadata(change.newResourceType) || this.isResourceTypeCDKMetadata(change.oldResourceType)) {
          return false;
        }
        return true;
      });
    }
    if (!templateDiff.isEmpty) {
      cfnDiff.formatDifferences(stream || process.stderr, templateDiff);
    }
    return templateDiff.differenceCount;
  };

  /**
   * Search and return the path to cloudformation template in the given folder
   * @param fileFolder Given the folder, find its path within the project
   * @returns path to the file-folder or empty string if not found
   */
  private safeGlobCFNFilePath = (fileFolder: string):string => {
    try {
      return globCFNFilePath(fileFolder);
    } catch (e) {
      return '';
    }
  }

  /**
   * Check if the given resource type is CDK metadata
   * @param resourceType Resource type string
   * @returns true if resource type is CDK metadata
   */
  private isResourceTypeCDKMetadata = (resourceType: string | undefined): boolean => resourceType === 'AWS::CDK::Metadata';
}

/**
 * Check if CloudFormation template exists (json, yaml or yml)
 * @param filePath Path to the CloudFormation template
 * @returns true if template exists at the given path
 */
const checkExist = (filePath: string):boolean => {
  const inputTypes = ['json', 'yaml', 'yml']; // check for existence of any one of the extensions.
  for (let i = 0; i < inputTypes.length; i++) {
    if (fs.existsSync(`${filePath}.${inputTypes[i]}`)) {
      return true;
    }
  }
  return false;
};

/**
 * Interface to store template-diffs for C-D-U resource diffs
 */
export interface IResourceDiffCollection {
  updatedDiff: ResourceDiff[] | [];
  deletedDiff: ResourceDiff[] | [];
  createdDiff: ResourceDiff[] | [];
}

/**
 * Interface to store resource status for each category
 */
export interface ICategoryStatusCollection {
  resourcesToBeCreated: $TSAny[];
  resourcesToBeUpdated: $TSAny[];
  resourcesToBeDeleted: $TSAny[];
  resourcesToBeSynced: $TSAny[];
  rootStackUpdated?: boolean;
  allResources: $TSAny[];
  tagsUpdated: boolean;
}

/**
 * "CollateResourceDiffs" - Calculates the diffs for the list of resources provided.
 * note:- The mutationInfo may be used for styling in enhanced summary.
 */
export const CollateResourceDiffs = async (resources: Array<$TSAny>,
  mutationInfo: StackMutationInfo /* create/update/delete */): Promise<ResourceDiff[]> => {
  const provider = CategoryProviders.CLOUDFORMATION;
  const resourceDiffs: ResourceDiff[] = [];
  for await (const resource of resources) {
    resourceDiffs.push(new ResourceDiff(resource.category, resource.resourceName, provider, mutationInfo));
  }
  return resourceDiffs;
};
