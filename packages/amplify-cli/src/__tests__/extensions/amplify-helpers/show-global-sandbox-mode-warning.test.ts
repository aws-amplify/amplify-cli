import {
  globalSandboxModeEnabled,
  showGlobalSandboxModeWarning,
} from '../../../extensions/amplify-helpers/show-global-sandbox-mode-warning';
import { $TSContext } from '../../../../../amplify-cli-core/lib';
import fs from 'fs';
import chalk from 'chalk';

let ctx, amplifyMeta;

jest.mock('amplify-cli-core', () => ({
  stateManager: {
    getMeta: jest.fn(() => JSON.parse(amplifyMeta.toString())),
  },
}));

describe('global sandbox mode warning', () => {
  beforeEach(() => {
    const envName = 'dev';
    ctx = {
      amplify: {
        getEnvInfo() {
          return { envName };
        },
      },
      print: {
        info() {
          // noop
        },
      },
    } as unknown as $TSContext;
  });

  describe('globalSandboxModeEnabled', () => {
    describe('enabled', () => {
      beforeAll(() => {
        amplifyMeta = fs.readFileSync(`${__dirname}/testData/mockLocalCloud/amplify-meta.json`);
      });

      it('returns true', async () => {
        expect(globalSandboxModeEnabled(ctx)).toBe(true);
      });
    });

    describe('not specified', () => {
      beforeAll(() => {
        amplifyMeta = fs.readFileSync(`${__dirname}/testData/mockLocalCloud/amplify-meta-2.json`);
      });

      it('returns false', async () => {
        expect(globalSandboxModeEnabled(ctx)).toBe(false);
      });
    });
  });

  describe('showGlobalSandboxModeWarning', () => {
    describe('sandbox mode enabled', () => {
      beforeAll(() => {
        amplifyMeta = fs.readFileSync(`${__dirname}/testData/mockLocalCloud/amplify-meta.json`);
      });

      it('prints warning message', async () => {
        jest.spyOn(ctx.print, 'info');

        await showGlobalSandboxModeWarning(ctx);

        expect(ctx.print.info).toBeCalledWith(`
${chalk.yellow(`⚠️  WARNING: ${chalk.green('"type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key"')} in your GraphQL schema
allows public create, read, update, and delete access to all models via API Key. This
should only be used for testing purposes. API Key expiration date is: 8/20/2021

To configure PRODUCTION-READY authorization rules, review: https://docs.amplify.aws/cli/graphql-transformer/auth`)}
`);
      });
    });

    describe('sandbox mode not specified', () => {
      beforeAll(() => {
        amplifyMeta = fs.readFileSync(`${__dirname}/testData/mockLocalCloud/amplify-meta-2.json`);
      });

      it('does not print warning', async () => {
        jest.spyOn(ctx.print, 'info');

        await showGlobalSandboxModeWarning(ctx);

        expect(ctx.print.info).toBeCalledTimes(0);
      });
    });

    describe('no api key config', () => {
      beforeAll(() => {
        amplifyMeta = fs.readFileSync(`${__dirname}/testData/mockLocalCloud/amplify-meta-3.json`);
      });

      it('does not print warning', async () => {
        jest.spyOn(ctx.print, 'info');

        await showGlobalSandboxModeWarning(ctx);

        expect(ctx.print.info).toBeCalledTimes(0);
      });
    });
  });
});
