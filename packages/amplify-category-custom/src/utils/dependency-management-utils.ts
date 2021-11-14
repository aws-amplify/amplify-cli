import * as cdk from '@aws-cdk/core';
import { $TSContext, $TSObject, pathManager, readCFNTemplate, stateManager, writeCFNTemplate } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import * as fs from 'fs-extra';
import { glob } from 'glob';
import inquirer, { CheckboxQuestion, DistinctChoice } from 'inquirer';
import _ from 'lodash';
import * as path from 'path';
import { categoryName, customResourceCFNFilenameSuffix } from '../utils/constants';
const AUTH_TRIGGER_TEMPLATE = 'auth-trigger-cloudformation-template.json';

const cfnTemplateGlobPattern = '*template*.+(yaml|yml|json)';
interface AmplifyDependentResourceDefinition {
  resourceName: string;
  category: string;
  attributes?: [string?];
}

export function getResourceCfnOutputAttributes(category: string, resourceName: string): [string?] {
  const resourceDir = pathManager.getResourceDirectoryPath(undefined, category, resourceName);
  const resourceBuildDir = path.join(resourceDir, 'build');
  let cfnFilePath;

  /**
   * Some categories builds CFN files into a build/ directory.
   * This looks for a build directory and uses it if one exists.
   * Otherwise falls back to the default behavior.
   */
  if (fs.existsSync(resourceBuildDir)) {
    const cfnFiles = glob.sync(cfnTemplateGlobPattern, {
      cwd: resourceBuildDir,
      ignore: [AUTH_TRIGGER_TEMPLATE],
    });

    if (cfnFiles.length > 0) {
      // Only one CFN files is allowed per-resource - check if there's more than one and error out
      if (cfnFiles.length > 1) {
        printer.warn(`${resourceName} has more than one CloudFormation definitions in the resource folder which isn't permitted.`);
        return [];
      } else {
        if (resourceBuildDir && cfnFiles[0]) {
          cfnFilePath = path.join(resourceBuildDir, cfnFiles[0]);
        }
      }
    }
  }
  if (!cfnFilePath) {
    // For categories which do not store cfn files in build/ dir
    const cfnFiles = glob.sync(cfnTemplateGlobPattern, {
      cwd: resourceDir,
      ignore: [AUTH_TRIGGER_TEMPLATE],
    });
    if (cfnFiles.length > 1) {
      printer.warn(`${resourceName} has more than one CloudFormation definitions in the resource folder which isn't permitted.`);
      return [];
    }
    if (resourceDir && cfnFiles[0]) {
      cfnFilePath = path.join(resourceDir, cfnFiles[0]);
    }
  }
  if (cfnFilePath) {
    const { cfnTemplate } = readCFNTemplate(cfnFilePath);
    if (cfnTemplate && cfnTemplate.Outputs) {
      const allOutputs: $TSObject = cfnTemplate.Outputs;
      let outputsWithoutConditions: any = {};

      for (const key in allOutputs) {
        if (!allOutputs[key]['Condition']) {
          // Filter out outputs which are conditional to avoid deployment failures
          outputsWithoutConditions[key] = allOutputs[key];
        }
      }

      return Object.keys(outputsWithoutConditions) as [string?];
    }
  }

  return [];
}

export function getAllResources() {
  const meta = stateManager.getMeta();
  const categories = Object.keys(meta).filter(category => category !== 'providers');
  const allResources: $TSObject = {};

  for (const category of categories) {
    let resourcesList = category in meta ? Object.keys(meta[category]) : [];

    if (_.isEmpty(resourcesList)) {
      continue;
    }

    for (const resourceName of resourcesList) {
      // In case of some resources they are not in the meta file so check for resource existence as well
      const isMobileHubImportedResource = _.get(meta, [category, resourceName, 'mobileHubMigrated'], false);
      if (isMobileHubImportedResource) {
        continue;
      } else {
        const resourceCfnOutputAttributes: [string?] = getResourceCfnOutputAttributes(category, resourceName);
        if (resourceCfnOutputAttributes.length === 0) {
          continue;
        }

        if (!allResources[category]) {
          allResources[category] = {};
        }
        if (!allResources[category][resourceName]) {
          allResources[category][resourceName] = {};
        }

        for (const attribute of resourceCfnOutputAttributes) {
          if (attribute) {
            allResources[category][resourceName][attribute] = 'string';
          }
        }
      }
    }
  }

  return allResources;
}

// helper function to add dependencies for resources to a CDK stack
export function addCDKResourceDependency(
  stack: cdk.Stack,
  category: string,
  resourceName: string,
  dependentResources: AmplifyDependentResourceDefinition[],
) {
  const dependsOn: AmplifyDependentResourceDefinition[] = [];
  const dependentParameters: any = {};

  dependentResources.forEach(resource => {
    const attributeList = getResourceCfnOutputAttributes(resource.category, resource.resourceName);

    attributeList.forEach(attr => {
      if (!dependentParameters[`${resource.category}`]) {
        dependentParameters[`${resource.category}`] = {};
      }
      if (!dependentParameters[`${resource.category}`][`${resource.resourceName}`]) {
        dependentParameters[`${resource.category}`][`${resource.resourceName}`] = {};
      }

      const parameterName = `${resource.category}${resource.resourceName}${attr}`;
      dependentParameters[`${resource.category}`][`${resource.resourceName}`][`${attr}`] = parameterName;

      new cdk.CfnParameter(stack, parameterName, {
        type: 'String',
      });
    });
    if (attributeList.length > 0) {
      dependsOn.push({
        category: resource.category,
        resourceName: resource.resourceName,
        attributes: attributeList,
      });
    }
  });

  if (dependsOn.length > 0) {
    addDependsOnToResource(category, resourceName, dependsOn);
  }

  return dependentParameters;
}

function addDependsOnToResource(category: string, resourceName: string, dependsOn: AmplifyDependentResourceDefinition[]) {
  // update backend-config
  const backendConfig = stateManager.getBackendConfig();
  backendConfig[category][resourceName].dependsOn = dependsOn;
  stateManager.setBackendConfig(undefined, backendConfig);

  // update amplify-meta
  const meta = stateManager.getMeta();
  meta[category][resourceName].dependsOn = dependsOn;
  stateManager.setMeta(undefined, meta);
}

export async function addCFNResourceDependency(context: $TSContext, customResourceName: string) {
  const selectResourcesInCategory = (
    choices: DistinctChoice<any>[],
    currentResourceDependencyMap: $TSObject,
    category: string,
  ): CheckboxQuestion => ({
    type: 'checkbox',
    name: 'resources',
    message: `${_.capitalize(category)} has ${
      choices.length
    } resources in this project. Select the one you would like your custom resource to access`,
    choices,
    default: currentResourceDependencyMap[category],
  });

  const selectCategories = (choices: DistinctChoice<any>[], currentCategoryDependencyMap: object): CheckboxQuestion => ({
    type: 'checkbox',
    name: 'categories',
    message: 'Select the categories you want this custom resource to have access to.',
    choices,
    validate: answers => (_.isEmpty(answers) ? 'You must select at least one category' : true),
    default: Object.keys(currentCategoryDependencyMap),
  });

  const amplifyMeta = stateManager.getMeta();
  const existingDependentResources: $TSObject = {};

  if (amplifyMeta[categoryName][customResourceName].dependsOn) {
    amplifyMeta[categoryName][customResourceName].dependsOn.map((resource: AmplifyDependentResourceDefinition) => {
      if (!existingDependentResources[resource.category]) {
        existingDependentResources[resource.category] = [];
      }
      existingDependentResources[resource.category].push(resource.resourceName);
    });
  }

  const hasExistingResources = Object.keys(existingDependentResources).length > 0;

  if (
    !(await prompter.yesOrNo('Do you want to access Amplify generated resources in your custom CloudFormation file?', hasExistingResources))
  ) {
    // Remove all dependencies for the custom resource
    await context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, customResourceName, 'dependsOn', []);
    return;
  }

  const categories = Object.keys(amplifyMeta).filter(category => category !== 'providers');
  const categoryQuestion = selectCategories(categories, existingDependentResources);
  const categoryAnswer = await inquirer.prompt(categoryQuestion);
  const selectedCategories = categoryAnswer.categories as string[];

  const resources = [];
  for (const selectedCategory of selectedCategories) {
    let resourcesList = selectedCategory in amplifyMeta ? Object.keys(amplifyMeta[selectedCategory]) : [];

    if (selectedCategory === categoryName) {
      resourcesList = resourcesList.filter(name => name !== customResourceName);
    }

    if (_.isEmpty(resourcesList)) {
      printer.warn(`No resources found for ${selectedCategory}`);
      continue;
    }
    try {
      let selectedResources = [];
      if (resourcesList.length > 1) {
        // There's a few resources in this category. Let's pick some.
        const resourceQuestion = selectResourcesInCategory(resourcesList, existingDependentResources, selectedCategory);
        const resourceAnswer = await inquirer.prompt([resourceQuestion]);
        selectedResources = _.concat(resourceAnswer.resources);
      } else {
        // There's only one resource in the category. Let's use that.
        selectedResources = _.concat(resourcesList);
      }

      for (let resourceName of selectedResources) {
        // In case of some resources they are not in the meta file so check for resource existence as well
        const isMobileHubImportedResource = _.get(amplifyMeta, [selectedCategory, resourceName, 'mobileHubMigrated'], false);
        if (isMobileHubImportedResource) {
          printer.warn(`Dependency cannot be added for ${selectedCategory}/${resourceName}, since it is a MobileHub imported resource.`);
          continue;
        } else {
          const resourceCfnOutputAttributes: [string?] = getResourceCfnOutputAttributes(selectedCategory, resourceName);

          if (resourceCfnOutputAttributes.length === 0) {
            continue;
          }

          const resourceDefinition: AmplifyDependentResourceDefinition = {
            category: selectedCategory,
            resourceName: resourceName,
            attributes: resourceCfnOutputAttributes,
          };

          resources.push(resourceDefinition);
        }
      }
    } catch (e: any) {
      printer.warn(`Dependencies cannot be added for ${selectedCategory}`);
      if (e.stack) {
        printer.warn(e.stack);
      }
      process.exitCode = 1;
    }
  }

  // Add to CFN block

  const resourceDir = pathManager.getResourceDirectoryPath(undefined, categoryName, customResourceName);
  const customResourceCFNFilename = `${customResourceName}-${customResourceCFNFilenameSuffix}`;
  const customResourceCFNFilepath = path.resolve(path.join(resourceDir, customResourceCFNFilename));

  const customResourceCFNTemplate = readCFNTemplate(customResourceCFNFilepath);

  const dependencyInputParams = generateInputParametersForDependencies(resources);

  if (!customResourceCFNTemplate.cfnTemplate.Parameters) {
    customResourceCFNTemplate.cfnTemplate.Parameters = {};
  }

  Object.assign(customResourceCFNTemplate.cfnTemplate.Parameters, dependencyInputParams);

  await writeCFNTemplate(customResourceCFNTemplate.cfnTemplate, customResourceCFNFilepath, {
    templateFormat: customResourceCFNTemplate.templateFormat,
  });

  // Update meta and backend-config.json files

  await context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, customResourceName, 'dependsOn', resources);

  // Show information on usage

  // showUsageInformation(resources);
}

function showUsageInformation(resources: AmplifyDependentResourceDefinition[]) {
  printer.success(`Successfully added dependent resources.`);
  printer.info(`You can access the dependent resource attributes using the Ref's mentioned below`);
  printer.blankLine();

  for (const resource of resources) {
    printer.info(`Category: ${resource.category}  Resource: ${resource.resourceName}`);
    printer.blankLine();
    for (const attribute of resource.attributes || []) {
      printer.info(`Attribute ${attribute}`);
      printer.info(`{ Ref: ${resource.category}${resource.resourceName}${attribute} }`);
      printer.blankLine();
    }
    printer.blankLine();
  }
}

function generateInputParametersForDependencies(resources: AmplifyDependentResourceDefinition[]) {
  let parameters: $TSObject = {};

  for (const resource of resources) {
    for (const attribute of resource.attributes || []) {
      parameters[`${resource.category}${resource.resourceName}${attribute}`] = {
        Type: 'String',
        Description: `Input parameter describing ${attribute} attribute for ${resource.category}/${resource.resourceName} resource`,
      };
    }
  }

  return parameters;
}
