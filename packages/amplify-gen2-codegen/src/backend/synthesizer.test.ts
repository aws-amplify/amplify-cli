import assert from 'node:assert';
import { BackendSynthesizer } from './synthesizer';
import { printNodeArray } from '../test_utils/ts_node_printer';
import { getImportRegex } from '../test_utils/import_regex';
import { UserPoolOverrides } from '../auth/source_builder';

describe('BackendRenderer', () => {
  describe('overrides', () => {
    describe('user pool', () => {
      describe('no overrides present', () => {
        it('does not render cfnUserPool accessor', () => {
          const renderer = new BackendSynthesizer();
          const rendered = renderer.render({
            auth: {
              importFrom: './auth/resource.ts',
            },
          });
          const output = printNodeArray(rendered);
          assert(!output.includes('cfnUserPool'));
        });
      });
      const testCases: UserPoolOverrides = {
        'Policies.PasswordPolicy.MinimumLength': 32,
        'Policies.PasswordPolicy.RequireNumbers': true,
        'Policies.PasswordPolicy.RequireSymbols': false,
        'Policies.PasswordPolicy.RequireLowercase': true,
        'Policies.PasswordPolicy.RequireUppercase': false,
        'Policies.PasswordPolicy.TemporaryPasswordValidityDays': 10,
      };
      for (const [key, value] of Object.entries(testCases)) {
        it(`renders override for ${key}`, () => {
          const renderer = new BackendSynthesizer();
          const rendered = renderer.render({
            auth: {
              importFrom: './auth/resource.ts',
              userPoolOverrides: {
                [key]: value,
              },
            },
          });
          const output = printNodeArray(rendered);
          assert(output.includes(`cfnUserPool.addPropertyOverride("${key}", ${value})`));
        });
      }
      it('renders multiple overrides', () => {
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({
          auth: {
            importFrom: './auth/resource.ts',
            userPoolOverrides: testCases,
          },
        });
        const output = printNodeArray(rendered);
        for (const [key, value] of Object.entries(testCases)) {
          assert(output.includes(`cfnUserPool.addPropertyOverride("${key}", ${value})`));
        }
      });
    });
  });
  describe('guestLogin', () => {
    it('Renders cfnIdentityPool accessor if guestLogin is false', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
          guestLogin: false,
        },
      });
      const output = printNodeArray(rendered);
      assert(output.includes('cfnIdentityPool'));
    });
    it('Does not render cfnIdentityPool accessor if guestLogin is true', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
          guestLogin: true,
        },
      });
      const output = printNodeArray(rendered);
      assert(!output.includes('cfnIdentityPool'));
    });
  });
  describe('OAuth Flows', () => {
    it('Renders cfnUserPoolClient accessor if oAuthFlows is defined', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
          oAuthFlows: ['code'],
        },
      });
      const output = printNodeArray(rendered);
      assert(output.includes('cfnUserPoolClient'));
    });
    it('Does not render cfnUserPoolClient accessor if oAuthFlows is undefined', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
        },
      });
      const output = printNodeArray(rendered);
      assert(!output.includes('cfnUserPoolClient'));
    });
  });
  describe('imports', () => {
    for (const resource of ['storage', 'data', 'auth']) {
      describe(resource, () => {
        const importFrom = './my-test/path';
        const importRegex = new RegExp(`import \\{ ${resource} \\} from "${importFrom}"`);
        it(`does not import ${resource} if no ${resource} key is passed`, () => {
          const renderer = new BackendSynthesizer();
          const rendered = renderer.render({});
          const source = printNodeArray(rendered);
          assert.doesNotMatch(source, importRegex);
        });
        it(`imports ${resource}`, () => {
          const renderer = new BackendSynthesizer();
          const rendered = renderer.render({ [resource]: { importFrom } });
          const source = printNodeArray(rendered);
          assert.match(source, importRegex);
        });
      });
    }
  });
  describe('defineBackend invocation', () => {
    describe('storage', () => {
      it('does not define storage property if it is undefined', () => {
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({});
        const output = printNodeArray(rendered);
        assert(!output.includes('storage: storage'));
      });
      it('adds property assignment when defined', () => {
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({
          storage: {
            importFrom: 'my-storage',
          },
        });
        const output = printNodeArray(rendered);
        assert(output.includes('storage'));
      });
    });
    describe('auth', () => {
      it('does not define auth property if it is undefined', () => {
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({});
        const output = printNodeArray(rendered);
        assert(!output.includes('storage'));
      });
      it('adds property assignment when defined', () => {
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({
          auth: {
            importFrom: 'my-auth',
          },
        });
        const output = printNodeArray(rendered);
        assert(output.includes('auth'));
      });
    });
  });
  describe('imports', () => {
    describe('defineBackend', () => {
      it('imports defineBackend from "@aws-amplify/backend"', () => {
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({});
        const output = printNodeArray(rendered);
        const regex = getImportRegex('defineBackend', '@aws-amplify/backend');
        assert.match(output, regex);
      });
    });
    describe('storage', () => {
      it('imports storage from the specified import path', () => {
        const storageImportLocation = 'storage/resource.ts';
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({
          storage: { importFrom: storageImportLocation },
        });
        const output = printNodeArray(rendered);
        const regex = getImportRegex('storage', storageImportLocation);
        assert.match(output, regex);
      });
    });
    describe('auth', () => {
      it('imports auth from the specified import path', () => {
        const authImportLocation = 'auth/resource.ts';
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({
          auth: { importFrom: authImportLocation },
        });
        const output = printNodeArray(rendered);
        const regex = getImportRegex('auth', authImportLocation);
        assert.match(output, regex);
      });
    });
  });
});
