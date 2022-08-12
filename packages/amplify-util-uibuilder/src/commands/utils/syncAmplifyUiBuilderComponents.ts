import { printer } from 'amplify-prompts';
import { $TSContext } from 'amplify-cli-core';
import {
  StudioComponent, StudioTheme, GenericDataSchema,
} from '@aws-amplify/codegen-ui';
import { createUiBuilderComponent, createUiBuilderTheme } from './codegenResources';
import { getUiBuilderComponentsPath } from './getUiBuilderComponentsPath';

/**
 * Returns instances of StudioComponent from the component schemas
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateUiBuilderComponents = (context: $TSContext, componentSchemas: any[], dataSchema?: GenericDataSchema): ({
  resultType: string;
  component: StudioComponent;
  schemaName?: undefined;
  error?: undefined;
} | {
  resultType: string;
  schemaName: string;
  error: Error;
  component?: undefined;
})[] => {
  const componentResults = componentSchemas.map(schema => {
    try {
      const component = createUiBuilderComponent(context, schema, dataSchema);
      return { resultType: 'SUCCESS', component };
    } catch (e) {
      printer.debug(`Failure caught processing ${schema.name}`);
      printer.debug(e);
      return { resultType: 'FAILURE', schemaName: schema.name, error: e };
    }
  });

  printer.debug(
    `Generated ${componentResults.filter(result => result.resultType === 'SUCCESS').length} components in ${getUiBuilderComponentsPath(
      context,
    )}`,
  );
  return componentResults;
};

/**
 * Returns instances of StudioTheme from theme schemas
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateUiBuilderThemes = (context: $TSContext, themeSchemas: any[]): ({
  resultType: string;
  theme: StudioTheme;
  schemaName?: undefined;
  error?: undefined;
} | {
  resultType: string;
  schemaName: string;
  error: Error;
  theme?: undefined;
})[] => {
  const themeResults = themeSchemas.map(schema => {
    try {
      const theme = createUiBuilderTheme(context, schema);
      return { resultType: 'SUCCESS', theme };
    } catch (e) {
      printer.debug(`Failure caught processing ${schema.name}`);
      printer.debug(e);
      return { resultType: 'FAILURE', schemaName: schema.name, error: e };
    }
  });

  printer.debug(
    `Generated ${themeResults.filter(result => result.resultType === 'SUCCESS').length} themes in ${getUiBuilderComponentsPath(context)}`,
  );
  return themeResults;
};
