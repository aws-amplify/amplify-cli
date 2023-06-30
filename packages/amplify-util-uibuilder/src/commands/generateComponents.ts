/* eslint-disable spellcheck/spell-checker */
import { StudioComponent, StudioForm, StudioSchema, componentRequiresDataApi, formRequiresDataApi } from '@aws-amplify/codegen-ui';
import ora from 'ora';
import { printer } from '@aws-amplify/amplify-prompts';
import type { Form, Component } from 'aws-sdk/clients/amplifyuibuilder';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AmplifyStudioClient } from '../clients';
import {
  notifyMissingPackages,
  shouldRenderComponents,
  generateUiBuilderComponents,
  generateUiBuilderThemes,
  getAmplifyDataSchema,
  generateAmplifyUiBuilderIndexFile,
  generateUiBuilderForms,
  generateAmplifyUiBuilderUtilFile,
  isStudioForm,
  isFormDetachedFromModel,
  deleteDetachedForms,
  hasStorageField,
  isFormSchema,
  getUiBuilderComponentsPath,
} from './utils';
import { getCodegenConfig } from 'amplify-codegen';
import { GraphqlRenderConfig, DataStoreRenderConfig } from '@aws-amplify/codegen-ui-react';
import path from 'path';

/**
 * Pulls ui components from Studio backend and generates the code in the user's file system
 */
export const run = async (context: $TSContext, eventType: 'PostPush' | 'PostPull'): Promise<void> => {
  if (!(await shouldRenderComponents(context))) {
    return;
  }
  const spinner = ora('');
  try {
    const studioClient = await AmplifyStudioClient.setClientInfo(context);
    const [componentSchemas, themeSchemas, formSchemas, dataSchema] = await Promise.all([
      studioClient.listComponents(),
      studioClient.listThemes(),
      studioClient.listForms(),
      studioClient.isGraphQLSupported ? getAmplifyDataSchema(context) : Promise.resolve(undefined),
    ]);

    let canCodegenGraphqlComponents = false;
    let apiConfiguration: GraphqlRenderConfig | DataStoreRenderConfig = {
      dataApi: 'DataStore',
    };

    if (!studioClient.isDataStoreEnabled && studioClient.metadata.isGraphQLEnabled) {
      printer.debug('building graphql config');
      // attempt to get api codegen info
      const projectPath = context.exeInfo.localEnvInfo.projectPath;
      const componentsPath = getUiBuilderComponentsPath(context);
      function relativeToComponentsPath(importPath: string) {
        return path.relative(componentsPath, importPath).split(path.sep).join('/');
      }

      try {
        const codegenConfig = getCodegenConfig(projectPath);
        const typesPath = codegenConfig.getGeneratedTypesPath();
        apiConfiguration = {
          dataApi: 'GraphQL',
          typesFilePath: typesPath && relativeToComponentsPath(typesPath),
          queriesFilePath: relativeToComponentsPath(codegenConfig.getGeneratedQueriesPath()),
          mutationsFilePath: relativeToComponentsPath(codegenConfig.getGeneratedMutationsPath()),
          subscriptionsFilePath: relativeToComponentsPath(codegenConfig.getGeneratedSubscriptionsPath()),
          fragmentsFilePath: relativeToComponentsPath(codegenConfig.getGeneratedFragmentsPath()),
        };
        canCodegenGraphqlComponents = true;
      } catch {
        canCodegenGraphqlComponents = false;
        printer.debug('unable to build configuration');
      }
    }

    const hasDataAPI = studioClient.isDataStoreEnabled || canCodegenGraphqlComponents;

    const willAutogenerateItems = dataSchema && studioClient.metadata.autoGenerateForms && studioClient.isGraphQLSupported && hasDataAPI;

    if (!hasDataAPI) {
      // filter components and forms that have data configurations and printer.warn()
      const [componentsToSkip, componentsToGenerate] = componentSchemas.entities.reduce(
        ([toSkip, toGenerate], e) => {
          // component is configured for appsync API, cannot be generated
          if (componentRequiresDataApi(e as StudioComponent)) {
            toSkip.push(e);
          } else {
            toGenerate.push(e);
          }
          return [toSkip, toGenerate];
        },
        [[], []] as [Component[], Component[]],
      );
      componentSchemas.entities = componentsToGenerate;
      printer.warn(`Skipping the following components: ${componentsToSkip.map((f) => f.name).join(', ')}`);

      const [formsToSkip, formsToGenerate] = formSchemas.entities.reduce(
        ([toSkip, toGenerate], e) => {
          // form is configured for appsync API, cannot be generated
          if (formRequiresDataApi(e as StudioForm)) {
            toSkip.push(e);
          } else {
            toGenerate.push(e);
          }
          return [toSkip, toGenerate];
        },
        [[], []] as [Form[], Form[]],
      );
      formSchemas.entities = formsToGenerate;
      printer.warn(`Skipping the following forms: ${formsToSkip.map((f) => f.name).join(', ')}`);
    }

    if (!willAutogenerateItems && [componentSchemas, themeSchemas, formSchemas].every((group) => !group.entities.length)) {
      printer.debug('Skipping UI component generation since none are found.');
      return;
    }
    spinner.start('Generating UI components...');

    const generatedResults = {
      component: generateUiBuilderComponents(context, componentSchemas.entities, dataSchema, apiConfiguration),
      theme: generateUiBuilderThemes(context, themeSchemas.entities, apiConfiguration),
      form: generateUiBuilderForms(
        context,
        formSchemas.entities,
        dataSchema,
        studioClient.metadata.autoGenerateForms && studioClient.isGraphQLSupported && hasDataAPI,
        studioClient.metadata.formFeatureFlags,
        apiConfiguration,
      ),
    };

    const successfulSchemas: StudioSchema[] = [];
    const detachedForms: { id: string; name: string }[] = [];
    let hasSuccessfulForm = false;
    const failedResponseNames: string[] = [];
    const modelNames = dataSchema?.models ? new Set(Object.keys(dataSchema.models)) : new Set<string>();
    let hasStorageManagerField = false;

    Object.entries(generatedResults).forEach(([key, results]) => {
      results.forEach((result) => {
        if (result.resultType === 'SUCCESS') {
          successfulSchemas.push(result.schema);
          if (key === 'form') {
            hasSuccessfulForm = true;

            if (!hasStorageManagerField && isFormSchema(result.schema) && hasStorageField(result.schema)) {
              hasStorageManagerField = true;
            }
          }
        } else {
          const failedSchema = result.schema;
          /**
           * A form resource may fail to generate because it's DataStore model type
           * no longer exists.
           */
          if (
            isStudioForm(failedSchema) &&
            failedSchema.id &&
            dataSchema &&
            eventType === 'PostPush' &&
            isFormDetachedFromModel(failedSchema, modelNames)
          ) {
            // Don't need to add form to failedResponseNames if it is going to be deleted
            detachedForms.push({ id: failedSchema.id, name: failedSchema.name });
            return;
          }
          failedResponseNames.push(result.schemaName);
        }
      });
    });

    generateAmplifyUiBuilderIndexFile(context, successfulSchemas, apiConfiguration);

    generateAmplifyUiBuilderUtilFile(context, { hasForms: hasSuccessfulForm, hasViews: false }, apiConfiguration);

    if (failedResponseNames.length > 0) {
      spinner.fail(`Failed to sync the following components: ${failedResponseNames.join(', ')}`);
    } else {
      spinner.succeed('Synced UI components.');
    }

    const invalidComponentNames = [
      ...componentSchemas.entities.filter((component) => !component.schemaVersion).map((component) => component.name),
      ...formSchemas.entities.filter((form) => !form.schemaVersion).map((form) => form.name),
    ];
    if (invalidComponentNames.length) {
      printer.warn(
        `The components ${invalidComponentNames.join(
          ', ',
        )} were synced with an older version of Amplify Studio. Please re-sync your components with Figma to get latest features and changes.`, // eslint-disable-line spellcheck/spell-checker
      );
    }

    notifyMissingPackages(context, hasStorageManagerField);

    await deleteDetachedForms(detachedForms, studioClient);
  } catch (e) {
    printer.debug(e);
    spinner.fail('Failed to sync UI components');
  }
};
