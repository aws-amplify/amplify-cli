import {
  extractTableName,
  FunctionRenderer,
  mapToCdkRuntime,
} from '../../../../../../commands/gen2-migration/generate/amplify/function/function.renderer';

describe('extractTableName', () => {
  it('recovers original casing via case-insensitive match against known model names', () => {
    const models = ['randomItem', 'Meal'];
    expect(extractTableName('API_MYAPI_RANDOMITEMTABLE_ARN', models)).toBe('randomItem');
    expect(extractTableName('API_MYAPI_MEALTABLE_NAME', models)).toBe('Meal');
  });

  it('matches model names that contain underscores (greedy prefix must not swallow them)', () => {
    // A positional `/API_.*_(.+?)TABLE_/` regex captures `MODEL` here because the
    // greedy `.*` eats `MY_`. Matching the known name directly avoids that.
    expect(extractTableName('API_MYAPI_MY_MODELTABLE_ARN', ['my_model'])).toBe('my_model');
  });

  it('does not confuse a model whose uppercased name is a suffix of another', () => {
    const models = ['Item', 'LineItem'];
    expect(extractTableName('API_MYAPI_LINEITEMTABLE_ARN', models)).toBe('LineItem');
    expect(extractTableName('API_MYAPI_ITEMTABLE_ARN', models)).toBe('Item');
  });

  it('falls back to naive capitalization when no model names are supplied', () => {
    expect(extractTableName('API_MYAPI_SOMETABLE_NAME')).toBe('Some');
  });

  it('anchors the fallback to the last segment before TABLE_ (ARN|NAME)', () => {
    // Without known model names the greedy-prefix bug would capture `MODEL`;
    // anchoring keeps the fallback deterministic on the final segment.
    expect(extractTableName('API_MYAPI_MY_MODELTABLE_ARN')).toBe('Model');
  });

  it('returns undefined for env vars that are not table references', () => {
    expect(extractTableName('API_MYAPI_GRAPHQLAPIIDOUTPUT')).toBeUndefined();
  });
});

describe('FunctionRenderer.renderCustomFunction', () => {
  const renderer = new FunctionRenderer('d1abc2def3', 'main');

  it('renders a Python function with CDK Function construct', () => {
    const output = renderer.renderCustomFunction({
      resourceName: 'myPythonFunc',
      handler: 'index.handler',
      runtime: 'python3.11',
      timeoutSeconds: 20,
      memoryMB: 256,
    });

    expect(output).toContain("import { defineFunction } from '@aws-amplify/backend'");
    expect(output).toContain("import { Architecture, Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda'");
    expect(output).toContain('export const myPythonFunc = defineFunction(');
    expect(output).toContain("handler: 'index.handler'");
    expect(output).toContain('runtime: Runtime.PYTHON_3_11');
    expect(output).toContain('architecture: Architecture.X86_64');
    expect(output).toContain('timeout: Duration.seconds(20)');
    expect(output).toContain('memorySize: 256');
    expect(output).toContain('python3 -m pip install');
    expect(output).toContain('--platform manylinux2014_x86_64');
    expect(output).toContain('image: Runtime.PYTHON_3_11.bundlingImage');
  });

  it('renders a Go function with CDK Function construct', () => {
    const output = renderer.renderCustomFunction({
      resourceName: 'myGoFunc',
      handler: 'bootstrap',
      runtime: 'provided.al2023',
      timeoutSeconds: 10,
    });

    expect(output).toContain('export const myGoFunc = defineFunction(');
    expect(output).toContain("handler: 'bootstrap'");
    expect(output).toContain('runtime: Runtime.PROVIDED_AL2023');
    expect(output).toContain('GOARCH=amd64 GOOS=linux go build');
  });

  it('renders a Java function with CDK Function construct', () => {
    const output = renderer.renderCustomFunction({
      resourceName: 'myJavaFunc',
      handler: 'com.example.Handler::handleRequest',
      runtime: 'java21',
    });

    expect(output).toContain('export const myJavaFunc = defineFunction(');
    expect(output).toContain("handler: 'com.example.Handler::handleRequest'");
    expect(output).toContain('runtime: Runtime.JAVA_21');
    expect(output).toContain('mvn package');
  });

  it('renders a .NET function with CDK Function construct', () => {
    const output = renderer.renderCustomFunction({
      resourceName: 'myDotnetFunc',
      handler: 'MyAssembly::MyNamespace.Handler::FunctionHandler',
      runtime: 'dotnet8',
    });

    expect(output).toContain('export const myDotnetFunc = defineFunction(');
    expect(output).toContain('runtime: Runtime.DOTNET_8');
    expect(output).toContain('dotnet publish');
  });

  it('uses default timeout and memory when not specified', () => {
    const output = renderer.renderCustomFunction({
      resourceName: 'myFunc',
      handler: 'index.handler',
      runtime: 'python3.9',
    });

    expect(output).toContain('timeout: Duration.seconds(3)');
    expect(output).toContain('memorySize: 128');
  });

  it('emits arm64 architecture and arm bundling flags when the function is arm64', () => {
    const pythonOutput = renderer.renderCustomFunction({
      resourceName: 'myArmPythonFunc',
      handler: 'index.handler',
      runtime: 'python3.12',
      architecture: 'arm64',
    });

    expect(pythonOutput).toContain('architecture: Architecture.ARM_64');
    expect(pythonOutput).toContain('--platform manylinux2014_aarch64');

    const goOutput = renderer.renderCustomFunction({
      resourceName: 'myArmGoFunc',
      handler: 'bootstrap',
      runtime: 'provided.al2023',
      architecture: 'arm64',
    });

    expect(goOutput).toContain('architecture: Architecture.ARM_64');
    expect(goOutput).toContain('GOARCH=arm64 GOOS=linux go build');
  });

  it('falls back to PROVIDED_AL2023 with a note for a runtime CDK no longer exports', () => {
    // python3.4 maps to PYTHON_3_4, which is not a member of CDK's Runtime enum.
    const output = renderer.renderCustomFunction({
      resourceName: 'myEolFunc',
      handler: 'index.handler',
      runtime: 'python3.4',
    });

    expect(output).toContain('runtime: Runtime.PROVIDED_AL2023');
    expect(output).toContain("// NOTE: runtime 'python3.4' has no matching CDK Runtime member");
  });

  it('emits literal environment variables on the function', () => {
    const output = renderer.renderCustomFunction({
      resourceName: 'myEnvFunc',
      handler: 'index.handler',
      runtime: 'python3.12',
      environment: { API_URL: 'https://example.com', STAGE: 'prod' },
    });

    expect(output).toContain('environment: {');
    expect(output).toContain('"API_URL": "https://example.com"');
    expect(output).toContain('"STAGE": "prod"');
  });

  it('emits a TODO block for configuration that was not migrated', () => {
    const output = renderer.renderCustomFunction({
      resourceName: 'myTodoFunc',
      handler: 'index.handler',
      runtime: 'python3.12',
      manualMigrationNotes: ['A schedule was not migrated.', 'DynamoDB access was not migrated.'],
    });

    expect(output).toContain('// TODO: The following Gen1 configuration was not migrated automatically');
    expect(output).toContain('//   - A schedule was not migrated.');
    expect(output).toContain('//   - DynamoDB access was not migrated.');
  });

  it('forces the handler to bootstrap for go/provided runtimes regardless of the Gen1 handler', () => {
    const output = renderer.renderCustomFunction({
      resourceName: 'myGoFunc',
      handler: 'main', // non-bootstrap Gen1 handler
      runtime: 'go1.x',
    });

    expect(output).toContain("handler: 'bootstrap'");
    expect(output).not.toContain("handler: 'main'");
  });

  it('warns loudly for an unrecognized runtime family instead of silently generating broken code', () => {
    const output = renderer.renderCustomFunction({
      resourceName: 'myUnknownFunc',
      handler: 'index.handler',
      runtime: 'cobol1.0',
    });

    expect(output).toContain('runtime: Runtime.PROVIDED_AL2023');
    expect(output).toContain("// WARNING: runtime 'cobol1.0' is not recognized");
  });
});

describe('mapToCdkRuntime', () => {
  it('maps Python runtimes', () => {
    expect(mapToCdkRuntime('python3.9')).toBe('PYTHON_3_9');
    expect(mapToCdkRuntime('python3.11')).toBe('PYTHON_3_11');
    expect(mapToCdkRuntime('python3.12')).toBe('PYTHON_3_12');
  });

  it('maps Java runtimes', () => {
    expect(mapToCdkRuntime('java11')).toBe('JAVA_11');
    expect(mapToCdkRuntime('java17')).toBe('JAVA_17');
    expect(mapToCdkRuntime('java21')).toBe('JAVA_21');
  });

  it('maps .NET runtimes', () => {
    expect(mapToCdkRuntime('dotnet6')).toBe('DOTNET_6');
    expect(mapToCdkRuntime('dotnet8')).toBe('DOTNET_8');
  });

  it('maps Go/custom runtimes to PROVIDED_AL2023', () => {
    expect(mapToCdkRuntime('go1.x')).toBe('PROVIDED_AL2023');
    expect(mapToCdkRuntime('provided.al2023')).toBe('PROVIDED_AL2023');
    expect(mapToCdkRuntime('provided.al2')).toBe('PROVIDED_AL2023');
  });

  it('maps Ruby runtimes', () => {
    expect(mapToCdkRuntime('ruby3.3')).toBe('RUBY_3_3');
  });

  it('falls back to PROVIDED_AL2023 for unknown runtimes', () => {
    expect(mapToCdkRuntime('unknown')).toBe('PROVIDED_AL2023');
  });
});
