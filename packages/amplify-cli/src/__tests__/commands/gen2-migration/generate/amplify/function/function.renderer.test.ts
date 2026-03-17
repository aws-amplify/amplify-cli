import { FunctionRenderer } from '../../../../../../commands/gen2-migration/generate/amplify/function/function.renderer';
import { TS } from '../../../../../../commands/gen2-migration/generate/_infra/ts';

describe('FunctionRenderer', () => {
  const renderer = new FunctionRenderer('d1abc2def3', 'main');

  function render(...args: Parameters<FunctionRenderer['render']>): string {
    return TS.printNodes(renderer.render(...args));
  }

  it('renders a basic defineFunction with entry point', () => {
    const output = render({
      resourceName: 'myFunc',
      entry: './index.js',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineFunction } from '@aws-amplify/backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
      });
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

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        name: \`myFunc-\${branchName}\`,
      });
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

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        timeoutSeconds: 30,
        memoryMB: 256,
      });
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

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        environment: { DB_HOST: 'localhost', DB_PORT: '5432' },
      });
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

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        environment: { ENV: \`\${branchName}\` },
      });
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

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        environment: { API_KEY: secret('API_KEY') },
      });
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

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        runtime: 18,
      });
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

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        schedule: 'every 5m',
      });
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

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        schedule: '0 12 * * ? *',
      });
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

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        schedule: 'every 1h',
      });
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

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const myFunc = defineFunction({
        entry: './index.js',
        schedule: 'every 7d',
      });
      "
    `);
  });
});
