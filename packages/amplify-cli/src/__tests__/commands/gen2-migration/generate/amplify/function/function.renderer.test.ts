import {
  FunctionRenderer,
  RenderCompleteFunctionOptions,
} from '../../../../../../commands/gen2-migration/generate/amplify/function/function.renderer';
import { TS } from '../../../../../../commands/gen2-migration/generate/_infra/ts';

const DEFAULT_ESCAPE_HATCH_OPTS = {
  escapeHatches: [],
  dynamoActions: [],
  kinesisActions: [],
  graphqlApiPermissions: { hasMutation: false, hasQuery: false },
  triggerModels: [],
  hasKinesisTrigger: false,
  hasAnalytics: false,
};

describe('FunctionRenderer', () => {
  const renderer = new FunctionRenderer('d1abc2def3', 'main');

  function render(opts: Partial<RenderCompleteFunctionOptions> & { resourceName: string; entry: string }): string {
    return TS.printNodes(renderer.render({ ...DEFAULT_ESCAPE_HATCH_OPTS, ...opts }));
  }

  it('renders a basic defineFunction with entry point', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineFunction } from '@aws-amplify/backend';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
      });

      export function applyEscapeHatches(backend: Backend) {
        backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
      }
      "
    `);
  });

  it('renders function name with branch variable', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
      name: 'myFunc-main',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineFunction } from '@aws-amplify/backend';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        name: \`myFunc-\${branchName}\`,
      });

      export function applyEscapeHatches(backend: Backend) {
        backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
      }
      "
    `);
  });

  it('renders timeout and memory', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
      timeoutSeconds: 30,
      memoryMB: 256,
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineFunction } from '@aws-amplify/backend';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        timeoutSeconds: 30,
        memoryMB: 256,
      });

      export function applyEscapeHatches(backend: Backend) {
        backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
      }
      "
    `);
  });

  it('renders environment variables', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
      environment: { DB_HOST: 'localhost', DB_PORT: '5432' },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineFunction } from '@aws-amplify/backend';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        environment: { DB_HOST: 'localhost', DB_PORT: '5432' },
      });

      export function applyEscapeHatches(backend: Backend) {
        backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
      }
      "
    `);
  });

  it('renders ENV variable as branch name template', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
      environment: { ENV: 'main' },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineFunction } from '@aws-amplify/backend';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        environment: { ENV: \`\${branchName}\` },
      });

      export function applyEscapeHatches(backend: Backend) {
        backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
      }
      "
    `);
  });

  it('renders API_KEY as secret when it matches SSM pattern', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
      environment: { API_KEY: '/amplify/d1abc2def3/main/some-secret' },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineFunction, secret } from '@aws-amplify/backend';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        environment: { API_KEY: secret('API_KEY') },
      });

      export function applyEscapeHatches(backend: Backend) {
        backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
      }
      "
    `);
  });

  it('renders nodejs runtime as a number', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
      runtime: 'nodejs18.x',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineFunction } from '@aws-amplify/backend';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        runtime: 18,
      });

      export function applyEscapeHatches(backend: Backend) {
        backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
      }
      "
    `);
  });

  it('does not render runtime for non-nodejs', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
      runtime: 'python3.9',
    });

    expect(output).not.toContain('runtime');
  });

  it('renders rate schedule expression', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
      schedule: 'rate(5 minutes)',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineFunction } from '@aws-amplify/backend';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        schedule: 'every 5m',
      });

      export function applyEscapeHatches(backend: Backend) {
        backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
      }
      "
    `);
  });

  it('renders cron schedule expression', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
      schedule: 'cron(0 12 * * ? *)',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineFunction } from '@aws-amplify/backend';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        schedule: '0 12 * * ? *',
      });

      export function applyEscapeHatches(backend: Backend) {
        backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
      }
      "
    `);
  });

  it('renders rate with hours unit', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
      schedule: 'rate(1 hour)',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineFunction } from '@aws-amplify/backend';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        schedule: 'every 1h',
      });

      export function applyEscapeHatches(backend: Backend) {
        backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
      }
      "
    `);
  });

  it('renders rate with days unit', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
      schedule: 'rate(7 days)',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineFunction } from '@aws-amplify/backend';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        schedule: 'every 7d',
      });

      export function applyEscapeHatches(backend: Backend) {
        backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
      }
      "
    `);
  });
});
