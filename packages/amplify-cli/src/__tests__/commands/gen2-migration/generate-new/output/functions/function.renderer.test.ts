import { FunctionRenderer } from '../../../../../../commands/gen2-migration/generate-new/output/functions/function.renderer';
import { printNodes } from '../../../../../../commands/gen2-migration/generate-new/ts-writer';

describe('FunctionRenderer', () => {
  const renderer = new FunctionRenderer('d1abc2def3', 'main');

  it('renders a basic defineFunction with entry point', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
    });
    const output = printNodes(nodes);

    expect(output).toContain('defineFunction');
    expect(output).toContain("entry: './index.js'");
    expect(output).toContain('export const myFunc');
  });

  it('renders function name with branch variable', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
      name: 'myFunc-main',
    });
    const output = printNodes(nodes);

    expect(output).toContain('myFunc-');
    expect(output).toContain('branchName');
  });

  it('renders timeout and memory', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
      timeoutSeconds: 30,
      memoryMB: 256,
    });
    const output = printNodes(nodes);

    expect(output).toContain('timeoutSeconds: 30');
    expect(output).toContain('memoryMB: 256');
  });

  it('renders environment variables', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
      environment: { DB_HOST: 'localhost', DB_PORT: '5432' },
    });
    const output = printNodes(nodes);

    expect(output).toContain('environment');
    expect(output).toContain("DB_HOST: 'localhost'");
    expect(output).toContain("DB_PORT: '5432'");
  });

  it('renders ENV variable as branch name template', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
      environment: { ENV: 'main' },
    });
    const output = printNodes(nodes);

    expect(output).toContain('ENV');
    expect(output).toContain('branchName');
  });

  it('renders API_KEY as secret when it matches SSM pattern', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
      environment: { API_KEY: '/amplify/d1abc2def3/main/some-secret' },
    });
    const output = printNodes(nodes);

    expect(output).toContain('secret');
    expect(output).toContain("'API_KEY'");
  });

  it('renders nodejs runtime as a number', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
      runtime: 'nodejs18.x',
    });
    const output = printNodes(nodes);

    expect(output).toContain('runtime: 18');
  });

  it('does not render runtime for non-nodejs', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
      runtime: 'python3.9',
    });
    const output = printNodes(nodes);

    expect(output).not.toContain('runtime');
  });

  it('renders rate schedule expression', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
      schedule: 'rate(5 minutes)',
    });
    const output = printNodes(nodes);

    expect(output).toContain("schedule: 'every 5m'");
  });

  it('renders cron schedule expression', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
      schedule: 'cron(0 12 * * ? *)',
    });
    const output = printNodes(nodes);

    expect(output).toContain("schedule: '0 12 * * ? *'");
  });

  it('renders rate with hours unit', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
      schedule: 'rate(1 hour)',
    });
    const output = printNodes(nodes);

    expect(output).toContain("schedule: 'every 1h'");
  });

  it('renders rate with days unit', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
      schedule: 'rate(7 days)',
    });
    const output = printNodes(nodes);

    expect(output).toContain("schedule: 'every 7d'");
  });

  it('always emits branchName declaration', () => {
    const nodes = renderer.render({
      resourceName: 'myFunc',
      entry: './index.js',
    });
    const output = printNodes(nodes);

    expect(output).toContain('const branchName');
  });
});
