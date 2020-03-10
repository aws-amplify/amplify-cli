import { constructCFModelTableNameComponent, constructCFModelTableArnComponent } from "../utils/cloudformationHelpers";
import inquirer from 'inquirer';
import path from 'path';
import * as TransformPackage from 'graphql-transformer-core';

export async function askExecRolePermissionsQuestions(context, allDefaultValues, parameters, currentDefaults?) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);

  let categories = Object.keys(amplifyMeta);
  categories = categories.filter(category => category !== 'providers');

  // retrieve api's appsynch resource name for conditional logic
  // in blending appsync @model-backed dynamoDB tables into storage category flow
  const appsyncResourceName =
    'api' in amplifyMeta ? Object.keys(amplifyMeta.api).find(key => amplifyMeta.api[key].service === 'AppSync') : undefined;

  // if there is api category appsynch resource and no storage category, add it back to selection
  // since storage category is responsible for managing appsync @model-backed dynamoDB table permissions
  if (!categories.includes('storage') && appsyncResourceName !== undefined) {
    categories.push('storage');
  }

  const categoryPermissionQuestion = {
    type: 'checkbox',
    name: 'categories',
    message: 'Select the category',
    choices: categories,
    default: currentDefaults ? currentDefaults.categories : undefined,
  };
  const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);
  const categoryPermissionAnswer = await inquirer.prompt([categoryPermissionQuestion]);
  const selectedCategories = categoryPermissionAnswer.categories as any[];
  let categoryPolicies = [];
  let resources = [];
  const crudOptions = ['create', 'read', 'update', 'delete'];
  parameters.permissions = {};

  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const appsyncTableSuffix = '@model(appsync)';

  for (let i = 0; i < selectedCategories.length; i += 1) {
    const category = selectedCategories[i];
    const resourcesList = category in amplifyMeta ? Object.keys(amplifyMeta[category]) : [];
    if (category === 'storage' && 'api' in amplifyMeta) {
      if (appsyncResourceName) {
        const resourceDirPath = path.join(backendDir, 'api', appsyncResourceName);
        const project = await TransformPackage.readProjectConfiguration(resourceDirPath);
        const directivesMap: any = TransformPackage.collectDirectivesByTypeNames(project.schema);
        const modelNames = Object.keys(directivesMap.types)
          .filter(typeName => directivesMap.types[typeName].includes('model'))
          .map(modelName => `${modelName}:${appsyncTableSuffix}`);
        resourcesList.push(...modelNames);
      }
    }

    if (resourcesList.length === 0) {
      context.print.warning(`No resources found for ${category}`);
      continue;
    }

    try {
      let selectedResources: any = [];

      if (resourcesList.length === 1) {
        context.print.info(`${capitalizeFirstLetter(category)} category has a resource called ${resourcesList[0]}`);
        selectedResources = [resourcesList[0]];
      } else {
        const resourceQuestion = {
          type: 'checkbox',
          name: 'resources',
          message: `${capitalizeFirstLetter(category)} has ${
            resourcesList.length
          } resources in this project. Select the one you would like your Lambda to access`,
          choices: resourcesList,
          validate: value => {
            if (value.length === 0) {
              return 'You must select at least resource';
            }
            return true;
          },
          default: () => {
            if (currentDefaults && currentDefaults.categoryPermissionMap && currentDefaults.categoryPermissionMap[category]) {
              return Object.keys(currentDefaults.categoryPermissionMap[category]);
            }
          },
        };

        const resourceAnswer = await inquirer.prompt([resourceQuestion]);
        selectedResources = resourceAnswer.resources;
      }

      for (let j = 0; j < selectedResources.length; j += 1) {
        const resourceName = selectedResources[j];

        const pluginInfo = context.amplify.getCategoryPluginInfo(context, category, resourceName);

        const { getPermissionPolicies } = require(pluginInfo.packageLocation);

        if (!getPermissionPolicies) {
          context.print.warning(`Policies cannot be added for ${category}/${resourceName}`);
          continue;
        } else {
          const crudPermissionQuestion = {
            type: 'checkbox',
            name: 'crudOptions',
            message: `Select the operations you want to permit for ${resourceName}`,
            choices: crudOptions,
            validate: value => {
              if (value.length === 0) {
                return 'You must select at least one operation';
              }

              return true;
            },
            default: () => {
              if (
                currentDefaults &&
                currentDefaults.categoryPermissionMap &&
                currentDefaults.categoryPermissionMap[category] &&
                currentDefaults.categoryPermissionMap[category][resourceName]
              ) {
                return currentDefaults.categoryPermissionMap[category][resourceName];
              }
            },
          };

          const crudPermissionAnswer = await inquirer.prompt([crudPermissionQuestion]);
          if (!parameters.permissions[category]) {
            parameters.permissions[category] = {};
          }

          parameters.permissions[category][resourceName] = crudPermissionAnswer.crudOptions;
          // overload crudOptions when user selects graphql @model-backing DynamoDB table
          // as there is no actual storage category resource where getPermissionPolicies can derive service and provider
          if (resourceName.endsWith(appsyncTableSuffix)) {
            parameters.permissions[category][resourceName].providerPlugin = 'awscloudformation';
            parameters.permissions[category][resourceName].service = 'DynamoDB';
            const dynamoDBTableARNComponents = constructCFModelTableArnComponent(appsyncResourceName, resourceName, appsyncTableSuffix);

            // have to override the policy resource as Fn::ImportValue is needed to extract DynamoDB table arn
            parameters.permissions[category][resourceName].customPolicyResource = [
              {
                'Fn::Join': ['', dynamoDBTableARNComponents],
              },
              {
                'Fn::Join': ['', [...dynamoDBTableARNComponents, '/index/*']],
              },
            ];
          }

          const { permissionPolicies, resourceAttributes } = await getPermissionPolicies(context, parameters.permissions[category]);
          categoryPolicies = categoryPolicies.concat(permissionPolicies);

          // replace resource attributes for @model-backed dynamoDB tables
          resources = resources.concat(
            resourceAttributes.map(attributes =>
              attributes.resourceName && attributes.resourceName.endsWith(appsyncTableSuffix)
                ? {
                    resourceName: appsyncResourceName,
                    category: 'api',
                    attributes: ['GraphQLAPIIdOutput'],
                    needsAdditionalDynamoDBResourceProps: true,
                    // data to pass so we construct additional resourceProps for lambda envvar for @model back dynamoDB tables
                    _modelName: attributes.resourceName.replace(`:${appsyncTableSuffix}`, 'Table'),
                    _cfJoinComponentTableName: constructCFModelTableNameComponent(
                      appsyncResourceName,
                      attributes.resourceName,
                      appsyncTableSuffix,
                    ),
                    _cfJoinComponentTableArn: constructCFModelTableArnComponent(
                      appsyncResourceName,
                      attributes.resourceName,
                      appsyncTableSuffix,
                    ),
                  }
                : attributes,
            ),
          );
        }
      }
    } catch (e) {
      context.print.warning(`Policies cannot be added for ${category}`);
      context.print.info(e.stack);
    }
  }

  allDefaultValues.categoryPolicies = categoryPolicies;
  const resourceProperties = [];
  const resourcePropertiesJSON = {};
  const categoryMapping = {};
  resources.forEach(resource => {
    const { category, resourceName, attributes } = resource;
    /**
     * while resourceProperties and resourcePropertiesJson
     * (which are utilized to set Lambda environment variables on CF side)
     * are derived from dependencies on other category resources that in-turn are set as CF-template parameters
     * we need to inject extra when blending appsync @model-backed dynamoDB tables into storage category flow
     * as @model-backed DynamoDB table name and full arn is not available in api category resource output
     */
    if (resource.needsAdditionalDynamoDBResourceProps) {
      const modelEnvPrefix = `${category.toUpperCase()}_${resourceName.toUpperCase()}_${resource._modelName.toUpperCase()}`;
      let modelNameResourcePropValue = {
        'Fn::Join': ['-', resource._cfJoinComponentTableName],
      };
      let modelArnResourcePropValue = {
        'Fn::Join': ['', resource._cfJoinComponentTableArn],
      };

      resourceProperties.push(`"${modelEnvPrefix}_NAME": ${JSON.stringify(modelNameResourcePropValue)}`);
      resourceProperties.push(`"${modelEnvPrefix}_ARN": ${JSON.stringify(modelArnResourcePropValue)}`);
      resourcePropertiesJSON[`${modelEnvPrefix}_NAME`] = modelNameResourcePropValue;
      resourcePropertiesJSON[`${modelEnvPrefix}_ARN`] = modelArnResourcePropValue;

      const categoryMappingPrefix = `${category}${capitalizeFirstLetter(resourceName)}${capitalizeFirstLetter(resource._modelName)}`;
      if (!categoryMapping[category]) {
        categoryMapping[category] = [];
      }
      categoryMapping[category].push({ envName: `${modelEnvPrefix}_NAME`, varName: `${categoryMappingPrefix}Name` });
      categoryMapping[category].push({ envName: `${modelEnvPrefix}_ARN`, varName: `${categoryMappingPrefix}Arn` });
    }

    attributes.forEach(attribute => {
      const envName = `${category.toUpperCase()}_${resourceName.toUpperCase()}_${attribute.toUpperCase()}`;
      const varName = `${category}${capitalizeFirstLetter(resourceName)}${capitalizeFirstLetter(attribute)}`;
      const refName = `${category}${resourceName}${attribute}`;

      resourceProperties.push(`"${envName}": {"Ref": "${refName}"}`);
      resourcePropertiesJSON[`${envName}`] = { Ref: `${category}${resourceName}${attribute}` };
      if (!categoryMapping[category]) {
        categoryMapping[category] = [];
      }
      categoryMapping[category].push({ envName, varName });
    });

    if (!allDefaultValues.dependsOn) {
      allDefaultValues.dependsOn = [];
    }

    let resourceExists = false;
    allDefaultValues.dependsOn.forEach(amplifyResource => {
      if (amplifyResource.resourceName === resourceName) {
        resourceExists = true;
      }
    });

    if (!resourceExists) {
      allDefaultValues.dependsOn.push({
        category: resource.category,
        resourceName: resource.resourceName,
        attributes: resource.attributes,
      });
    }
  });

  allDefaultValues.resourceProperties = resourceProperties.join(',');
  allDefaultValues.resourcePropertiesJSON = resourcePropertiesJSON;

  context.print.info('');
  let topLevelComment = '/* Amplify Params - DO NOT EDIT\n';
  let terminalOutput = 'You can access the following resource attributes as environment variables from your Lambda function\n';
  terminalOutput += 'var environment = process.env.ENV\n';
  terminalOutput += 'var region = process.env.REGION\n';

  Object.keys(categoryMapping).forEach(category => {
    if (categoryMapping[category].length > 0) {
      categoryMapping[category].forEach(args => {
        terminalOutput += `var ${args.varName} = process.env.${args.envName}\n`;
      });
    }
  });

  context.print.info(terminalOutput);
  topLevelComment += `${terminalOutput}\nAmplify Params - DO NOT EDIT */`;

  return { topLevelComment };
}