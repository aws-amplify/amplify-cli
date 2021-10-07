import { showSandboxModePrompts, removeSandboxDirectiveFromSchema, showGlobalSandboxModeWarning } from '../../utils/sandbox-mode-helpers';
import { $TSContext } from 'amplify-cli-core';
import chalk from 'chalk';
import * as prompts from 'amplify-prompts';
import * as apiKeyHelpers from '../../utils/api-key-helpers';

let ctx;
let apiKeyPresent = true;

describe('sandbox mode helpers', () => {
  beforeEach(() => {
    const envName = 'dev';
    ctx = {
      amplify: {
        getEnvInfo() {
          return { envName };
        },
        invokePluginMethod: jest.fn(),
      },
    } as unknown as $TSContext;

    jest.spyOn(prompts.printer, 'info').mockImplementation();
    jest.spyOn(apiKeyHelpers, 'hasApiKey').mockReturnValue(apiKeyPresent);
  });

  describe('showSandboxModePrompts', () => {
    describe('missing api key', () => {
      beforeAll(() => {
        apiKeyPresent = false;
      });

      it('displays warning', async () => {
        await showSandboxModePrompts(ctx);

        expect(prompts.printer.info).toBeCalledWith(
          `
⚠️  WARNING: Global Sandbox Mode has been enabled, which requires a valid API key. If
you'd like to disable, remove ${chalk.green('"type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key"')}
from your GraphQL schema and run 'amplify push' again. If you'd like to proceed with
sandbox mode disabled in '${ctx.amplify.getEnvInfo().envName}', do not create an API Key.
`,
          'yellow',
        );
        expect(ctx.amplify.invokePluginMethod).toBeCalledWith(ctx, 'api', undefined, 'promptToAddApiKey', [ctx]);
      });
    });
  });

  describe('showGlobalSandboxModeWarning', () => {
    it('prints sandbox api key message', () => {
      showGlobalSandboxModeWarning();

      expect(prompts.printer.info).toBeCalledWith(
        `
⚠️  WARNING: your GraphQL API currently allows public create, read, update, and delete access to all models via an API Key. To configure PRODUCTION-READY authorization rules, review: https://docs.amplify.aws/cli/graphql-transformer/auth
`,
        'yellow',
      );
    });
  });

  describe('removeSandboxDirectiveFromSchema', () => {
    it('removes sandbox mode directive', () => {
      const schema = `
type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key(in: "dev")
      `;

      expect(removeSandboxDirectiveFromSchema(schema)).toEqual(`

      `);
    });

    it('does not change user schema with directive', () => {
      const schema = `
type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key(in: "dev10105") # FOR TESTING ONLY!

type Todo @model {
  id: ID!
  name: String!
  description: String
}
      `;

      expect(removeSandboxDirectiveFromSchema(schema)).toEqual(`
 # FOR TESTING ONLY!

type Todo @model {
  id: ID!
  name: String!
  description: String
}
      `);
    });

    it('does not change user schema with directive and single quotes', () => {
      const schema = `
type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key(in: 'dev10105') # FOR TESTING ONLY!

type Todo @model {
  id: ID!
  name: String!
  description: String
}
      `;

      expect(removeSandboxDirectiveFromSchema(schema)).toEqual(`
 # FOR TESTING ONLY!

type Todo @model {
  id: ID!
  name: String!
  description: String
}
      `);
    });
  });
});
