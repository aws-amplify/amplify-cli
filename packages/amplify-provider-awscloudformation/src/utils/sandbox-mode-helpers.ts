import chalk from 'chalk';
import { $TSContext } from 'amplify-cli-core';
import { hasApiKey } from './api-key-helpers';
import { printer } from 'amplify-prompts';
import { parse } from 'graphql';

const AMPLIFY = 'AMPLIFY';
const GLOBAL_AUTH_RULE = 'global_auth_rule';
const AUTHORIZATION_RULE = 'AuthorizationRule';
const ALLOW = 'allow';
const PUBLIC = 'public';

export async function showSandboxModePrompts(context: $TSContext): Promise<any> {
  if (!hasApiKey()) {
    printer.info(
      `
⚠️  WARNING: Global Sandbox Mode has been enabled, which requires a valid API key. If
you'd like to disable, remove ${chalk.green('"input AMPLIFY { global_auth_rule: AuthorizationRule = { allow: public } }"')}
from your GraphQL schema and run 'amplify push' again. If you'd like to proceed with
sandbox mode disabled, do not create an API Key.
`,
      'yellow',
    );
    return await context.amplify.invokePluginMethod(context, 'api', undefined, 'promptToAddApiKey', [context]);
  }
}

export function showGlobalSandboxModeWarning(): void {
  printer.info(
    `
⚠️  WARNING: your GraphQL API currently allows public create, read, update, and delete access to all models via an API Key. To configure PRODUCTION-READY authorization rules, review: https://docs.amplify.aws/cli/graphql-transformer/auth
`,
    'yellow',
  );
}

export function schemaHasSandboxModeEnabled(schema: string): boolean {
  const { definitions } = parse(schema);
  const amplifyInputType: any = definitions.find((d: any) => d.kind === 'InputObjectTypeDefinition' && d.name.value === AMPLIFY);

  if (!amplifyInputType) {
    return false;
  }

  const authRuleField = amplifyInputType.fields.find(f => f.name.value === GLOBAL_AUTH_RULE);

  if (!authRuleField) {
    throw Error('input AMPLIFY requires "global_auth_rule" field. Learn more here: https://docs.amplify.aws/cli/graphql-transformer/auth');
  }

  const typeName = authRuleField.type.name.value;
  const defaultValueField = authRuleField.defaultValue.fields[0];
  const defaultValueName = defaultValueField.name.value;
  const defaultValueValue = defaultValueField.value.value;
  const authScalarMatch = typeName === AUTHORIZATION_RULE;
  const defaultValueNameMatch = defaultValueName === ALLOW;
  const defaultValueValueMatch = defaultValueValue === PUBLIC;

  if (authScalarMatch && defaultValueNameMatch && defaultValueValueMatch) {
    return true;
  } else {
    throw Error(
      'There was a problem with your auth configuration. Learn more about auth here: https://docs.amplify.aws/cli/graphql-transformer/auth',
    );
  }
}
