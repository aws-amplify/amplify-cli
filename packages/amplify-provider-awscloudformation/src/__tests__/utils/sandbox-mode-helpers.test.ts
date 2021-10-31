import { showSandboxModePrompts, showGlobalSandboxModeWarning, schemaHasSandboxModeEnabled } from '../../utils/sandbox-mode-helpers';
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
you'd like to disable, remove ${chalk.green('"input AMPLIFY { global_auth_rule: AuthorizationRule = { allow: public } }"')}
from your GraphQL schema and run 'amplify push' again. If you'd like to proceed with
sandbox mode disabled, do not create an API Key.
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

  describe('schemaHasSandboxModeEnabled', () => {
    it('parses sandbox AMPLIFY input on schema', () => {
      const schema = `
        input AMPLIFY { global_auth_rule: AuthorizationRule = { allow: public } }
      `;

      expect(schemaHasSandboxModeEnabled(schema)).toEqual(true);
    });

    it('passes through when AMPLIFY input is not present', () => {
      const schema = `
        type Todo @model {
          id: ID!
          content: String
        }
      `;

      expect(schemaHasSandboxModeEnabled(schema)).toEqual(false);
    });

    describe('input AMPLIFY has incorrect values', () => {
      it('checks for "global_auth_rule"', () => {
        const schema = `
          input AMPLIFY { auth_rule: AuthenticationRule = { allow: public } }
        `;

        expect(() => schemaHasSandboxModeEnabled(schema)).toThrow(
          Error('input AMPLIFY requires "global_auth_rule" field. Learn more here: https://docs.amplify.aws/cli/graphql-transformer/auth'),
        );
      });

      it('guards for AuthorizationRule', () => {
        const schema = `
          input AMPLIFY { global_auth_rule: AuthenticationRule = { allow: public } }
        `;

        expect(() => schemaHasSandboxModeEnabled(schema)).toThrow(
          Error(
            'There was a problem with your auth configuration. Learn more about auth here: https://docs.amplify.aws/cli/graphql-transformer/auth',
          ),
        );
      });

      it('checks for "allow" field name', () => {
        const schema = `
          input AMPLIFY { global_auth_rule: AuthorizationRule = { allows: public } }
        `;

        expect(() => schemaHasSandboxModeEnabled(schema)).toThrow(
          Error(
            'There was a problem with your auth configuration. Learn more about auth here: https://docs.amplify.aws/cli/graphql-transformer/auth',
          ),
        );
      });

      it('checks for "public" value from "allow" field', () => {
        const schema = `
          input AMPLIFY { global_auth_rule: AuthorizationRule = { allow: private } }
        `;

        expect(() => schemaHasSandboxModeEnabled(schema)).toThrowError(
          Error(
            'There was a problem with your auth configuration. Learn more about auth here: https://docs.amplify.aws/cli/graphql-transformer/auth',
          ),
        );
      });
    });
  });
});
