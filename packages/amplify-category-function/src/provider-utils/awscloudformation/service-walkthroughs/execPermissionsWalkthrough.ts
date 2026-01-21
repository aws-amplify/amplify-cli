import { $TSAny, $TSContext, AmplifyError, FeatureFlags, pathManager, stateManager, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { FunctionDependency, FunctionParameters } from '@aws-amplify/amplify-function-plugin-interface';
import { printer } from '@aws-amplify/amplify-prompts';
import * as TransformPackage from 'graphql-transformer-core';
import inquirer, { CheckboxQuestion, DistinctChoice } from 'inquirer';
import _ from 'lodash';
import path from 'path';
import {
  categoryName,
  CRUDOperation,
  envVarPrintoutPrefix,
  GraphQLOperation,
  topLevelCommentPrefix,
  topLevelCommentSuffix,
} from '../../../constants';
import { getAppSyncResourceName } from '../utils/appSyncHelper';
import { constructCFModelTableArnComponent, constructCFModelTableNameComponent } from '../utils/cloudformationHelpers';
import { appsyncTableSuffix, ServiceName } from '../utils/constants';
import {
  fetchPermissionCategories,
  fetchPermissionResourcesForCategory,
  fetchPermissionsForResourceInCategory,
} from '../utils/permissionMapUtils';

/**
 * This whole file desperately needs to be refactored
 */
export const askExecRolePermissionsQuestions = async (
  context: $TSContext,
  resourceNameToUpdate: string,
  currentPermissionMap?,
  currentEnvMap?,
  category?: string,
  serviceName?: string,
): Promise<ExecRolePermissionsResponse> => {
  // feature flag for graphQL permission bugfix as part of PR-5342
  const generateGraphQLPermissions = FeatureFlags.getBoolean('appSync.generateGraphQLPermissions');

  const amplifyMeta = stateManager.getMeta();

  const categories = Object.keys(amplifyMeta).filter((category) => category !== 'providers' && category !== 'predictions');

  // retrieve api's AppSync resource name for conditional logic
  // in blending appsync @model-backed dynamoDB tables into storage category flow
  const appsyncResourceName = getAppSyncResourceName();

  // if there is api category AppSync resource and no storage category, add it back to selection
  // since storage category is responsible for managing appsync @model-backed dynamoDB table permissions
  if (!categories.includes('storage') && appsyncResourceName !== undefined) {
    categories.push('storage');
  }

  const categoryPermissionQuestion = selectCategories(categories, currentPermissionMap);
  const categoryPermissionAnswer = await inquirer.prompt(categoryPermissionQuestion);
  const selectedCategories = categoryPermissionAnswer.categories as string[];

  const crudOptions = _.values(CRUDOperation);
  const graphqlOperations = _.values(GraphQLOperation);
  const categoryPolicies = [];
  const permissions = {};
  const resources = [];
  const backendDir = pathManager.getBackendDirPath();

  for (const selectedCategory of selectedCategories) {
    let resourcesList = selectedCategory in amplifyMeta ? Object.keys(amplifyMeta[selectedCategory]) : [];

    // filter out lambda layers always, we don't support granting permissions to layers
    resourcesList = resourcesList.filter((resourceName) => amplifyMeta[selectedCategory][resourceName].service !== ServiceName.LambdaLayer);

    if (selectedCategory === 'storage' && 'api' in amplifyMeta) {
      if (appsyncResourceName) {
        const resourceDirPath = path.join(backendDir, 'api', appsyncResourceName);
        let project;
        let directivesMap: $TSAny;
        try {
          project = await TransformPackage.readProjectConfiguration(resourceDirPath);
          directivesMap = TransformPackage.collectDirectivesByTypeNames(project.schema);
        } catch (err) {
          if (err.message?.includes('Syntax Error')) {
            throw new AmplifyError(
              'GraphQLError',
              {
                message: err?.message,
              },
              err,
            );
          }
          throw new AmplifyFault(
            'GraphQLTransformerV1Fault',
            {
              message: err?.message,
            },
            err,
          );
        }
        const modelNames = Object.keys(directivesMap.types)
          .filter((typeName) => directivesMap.types[typeName].includes('model'))
          .map((modelName) => `${modelName}:${appsyncTableSuffix}`);
        resourcesList.push(...modelNames);
      }
    } else if (selectedCategory === category || selectedCategory === categoryName) {
      // A Lambda function cannot depend on itself
      // Lambda layer dependencies are handled separately, also apply the filter if the selected resource is within the function category
      // but serviceName argument was no passed in
      if (serviceName === ServiceName.LambdaFunction || selectedCategory === categoryName) {
        const selectedResource = _.get(amplifyMeta, [categoryName, resourceNameToUpdate]);
        // A new function resource does not exist in amplifyMeta yet
        const isNewFunctionResource = !selectedResource;
        resourcesList = resourcesList.filter(
          (resourceName) =>
            resourceName !== resourceNameToUpdate &&
            (isNewFunctionResource || amplifyMeta[selectedCategory][resourceName].service === selectedResource.service),
        );
      } else {
        resourcesList = resourcesList.filter(
          (resourceName) => resourceName !== resourceNameToUpdate && !amplifyMeta[selectedCategory][resourceName].iamAccessUnavailable,
        );
      }
    }

    if (_.isEmpty(resourcesList)) {
      printer.warn(`No resources found for ${selectedCategory}`);
      continue;
    }

    try {
      let selectedResources = [];
      if (resourcesList.length > 1) {
        // There's a few resources in this category. Let's pick some.
        const resourceQuestion = selectResourcesInCategory(resourcesList, currentPermissionMap, selectedCategory);
        const resourceAnswer = await inquirer.prompt([resourceQuestion]);
        selectedResources = _.concat(resourceAnswer.resources);
      } else {
        // There's only one resource in the category. Let's use that.
        selectedResources = _.concat(resourcesList);
      }

      for (const resourceName of selectedResources) {
        // If the resource is AppSync, use GraphQL operations for permission policies.
        // Otherwise, default to CRUD permissions.
        const serviceType = _.get(amplifyMeta, [selectedCategory, resourceName, 'service']);
        let options;
        switch (serviceType) {
          case 'AppSync':
            options = generateGraphQLPermissions ? graphqlOperations : crudOptions;
            break;
          default:
            options = crudOptions;
            break;
        }

        // In case of some resources they are not in the meta file so check for resource existence as well
        const isMobileHubImportedResource = _.get(amplifyMeta, [selectedCategory, resourceName, 'mobileHubMigrated'], false);
        if (isMobileHubImportedResource) {
          printer.warn(`Policies cannot be added for ${selectedCategory}/${resourceName}, since it is a MobileHub imported resource.`);
          continue;
        } else {
          const currentPermissions = fetchPermissionsForResourceInCategory(currentPermissionMap, selectedCategory, resourceName);
          const permissionQuestion = selectPermissions(options, currentPermissions, resourceName);
          const permissionAnswer = await inquirer.prompt([permissionQuestion]);
          const resourcePolicy: any = permissionAnswer.options;
          const { permissionPolicies, cfnResources } = await getResourcesForCfn(
            context,
            resourceName,
            resourcePolicy,
            appsyncResourceName,
            selectedCategory,
          );
          categoryPolicies.push(...permissionPolicies);
          if (!permissions[selectedCategory]) {
            permissions[selectedCategory] = {};
          }
          permissions[selectedCategory][resourceName] = resourcePolicy;
          resources.push(...cfnResources);
        }
      }
    } catch (e) {
      if (e.name === 'PluginMethodNotFoundError') {
        printer.warn(`${selectedCategory} category does not support resource policies yet.`);
      } else {
        throw new AmplifyError(
          'PluginPolicyAddError',
          {
            message: `Policies cannot be added for ${selectedCategory}`,
            details: e.message,
          },
          e,
        );
      }
    }
  }

  // overload options when user selects graphql @model-backing DynamoDB table
  // as there is no actual storage category resource where getPermissionPolicies can derive service and provider
  const { environmentMap, dependsOn, envVarStringList } = await generateEnvVariablesForCfn(context, resources, currentEnvMap);

  return {
    dependsOn,
    topLevelComment: `${topLevelCommentPrefix}\t${envVarStringList}${topLevelCommentSuffix}`,
    environmentMap,
    mutableParametersState: { permissions },
    categoryPolicies,
  };
};

export type ExecRolePermissionsResponse = Required<
  Pick<FunctionParameters, 'categoryPolicies' | 'environmentMap' | 'topLevelComment' | 'dependsOn' | 'mutableParametersState'>
>;

// Inquirer Questions

const selectResourcesInCategory = (choices: DistinctChoice<any>[], currentPermissionMap: any, category: any): CheckboxQuestion => ({
  type: 'checkbox',
  name: 'resources',
  message: `${_.capitalize(category)} has ${choices.length} resources in this project. Select the one you would like your Lambda to access`,
  choices,
  default: fetchPermissionResourcesForCategory(currentPermissionMap, category),
});

const selectCategories = (choices: DistinctChoice<any>[], currentPermissionMap: object): CheckboxQuestion => ({
  type: 'checkbox',
  name: 'categories',
  message: 'Select the categories you want this function to have access to.',
  choices,
  default: fetchPermissionCategories(currentPermissionMap),
});

const selectPermissions = (choices: DistinctChoice<any>[], currentPermissions: any, resourceName: any) => ({
  type: 'checkbox',
  name: 'options',
  message: `Select the operations you want to permit on ${resourceName}`,
  choices,
  validate: (answers) => (_.isEmpty(answers) ? 'You must select at least one operation' : true),
  default: currentPermissions,
});

export async function getResourcesForCfn(context, resourceName, resourcePolicy, appsyncResourceName, selectedCategory) {
  if (resourceName.endsWith(appsyncTableSuffix)) {
    resourcePolicy.providerPlugin = 'awscloudformation';
    resourcePolicy.service = 'DynamoDB';
    const dynamoDBTableARNComponents = await constructCFModelTableArnComponent(appsyncResourceName, resourceName, appsyncTableSuffix);

    // have to override the policy resource as Fn::ImportValue is needed to extract DynamoDB table arn
    resourcePolicy.customPolicyResource = [
      {
        'Fn::Join': ['', dynamoDBTableARNComponents],
      },
      {
        'Fn::Join': ['', [...dynamoDBTableARNComponents, '/index/*']],
      },
    ];
  }

  const { permissionPolicies, resourceAttributes } = await context.amplify.invokePluginMethod(
    context,
    selectedCategory,
    resourceName,
    'getPermissionPolicies',
    [context, { [resourceName]: resourcePolicy }],
  );

  // replace resource attributes for @model-backed dynamoDB tables
  const cfnResources = await Promise.all<$TSAny>(
    resourceAttributes.map(async (attributes) =>
      attributes.resourceName?.endsWith(appsyncTableSuffix)
        ? {
            resourceName: appsyncResourceName,
            category: 'api',
            attributes: ['GraphQLAPIIdOutput'],
            needsAdditionalDynamoDBResourceProps: true,
            // data to pass so we construct additional resourceProps for lambda environment variable for @model back dynamoDB tables
            _modelName: attributes.resourceName.replace(`:${appsyncTableSuffix}`, 'Table'),
            _cfJoinComponentTableName: await constructCFModelTableNameComponent(
              appsyncResourceName,
              attributes.resourceName,
              appsyncTableSuffix,
            ),
            _cfJoinComponentTableArn: await constructCFModelTableArnComponent(
              appsyncResourceName,
              attributes.resourceName,
              appsyncTableSuffix,
            ),
          }
        : attributes,
    ),
  );
  return { permissionPolicies, cfnResources };
}

export async function generateEnvVariablesForCfn(context: $TSContext, resources: $TSAny[], currentEnvMap: $TSAny) {
  const environmentMap = {};
  const envVars = new Set<string>();
  const dependsOn: FunctionDependency[] = [];
  resources.forEach((resource) => {
    const { category, resourceName, attributes } = resource;
    /**
     * while resourceProperties
     * (which are utilized to set Lambda environment variables on CF side)
     * are derived from dependencies on other category resources that in-turn are set as CF-template parameters
     * we need to inject extra when blending appsync @model-backed dynamoDB tables into storage category flow
     * as @model-backed DynamoDB table name and full arn is not available in api category resource output
     */
    if (resource.needsAdditionalDynamoDBResourceProps) {
      const modelEnvPrefix = `${category.toUpperCase()}_${resourceName.toUpperCase()}_${resource._modelName.toUpperCase()}`;
      const modelEnvNameKey = `${modelEnvPrefix}_NAME`;
      const modelEnvArnKey = `${modelEnvPrefix}_ARN`;

      environmentMap[modelEnvNameKey] = resource._cfJoinComponentTableName;
      environmentMap[modelEnvArnKey] = {
        'Fn::Join': ['', resource._cfJoinComponentTableArn],
      };

      envVars.add(modelEnvNameKey);
      envVars.add(modelEnvArnKey);
    }

    attributes.forEach((attribute) => {
      const envName = `${category.toUpperCase()}_${resourceName.toUpperCase()}_${attribute.toUpperCase()}`;
      const refName = `${category}${resourceName}${attribute}`;
      environmentMap[envName] = { Ref: refName };
      envVars.add(envName);
    });

    if (!dependsOn.find((dep) => dep.resourceName === resourceName && dep.category === category)) {
      dependsOn.push({
        category: resource.category,
        resourceName: resource.resourceName,
        attributes: resource.attributes,
      });
    }
  });

  if (currentEnvMap) {
    _.keys(currentEnvMap).forEach((key) => {
      envVars.add(key);
    });
  }

  const envVarStringList = Array.from(envVars).sort().join('\n\t');

  if (envVarStringList) {
    printer.info(`${envVarPrintoutPrefix}${envVarStringList}`);
  }
  return { environmentMap, dependsOn, envVarStringList };
}
