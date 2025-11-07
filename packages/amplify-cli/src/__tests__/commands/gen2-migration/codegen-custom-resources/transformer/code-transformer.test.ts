import { CodeTransformer } from '../../../../../commands/gen2-migration/codegen-custom-resources/transformer/code-transformer';
import { ParsedStack } from '../../../../../commands/gen2-migration/codegen-custom-resources/types';

describe('CodeTransformer', () => {
  let transformer: CodeTransformer;

  beforeEach(() => {
    transformer = new CodeTransformer();
  });

  it('should generate proper class name from resource name', () => {
    const parsed: ParsedStack = {
      className: 'cdkStack',
      imports: [],
      constructorBody: '{}',
      outputs: [],
      hasAmplifyHelpers: false,
      hasResourceDependency: false,
    };

    const result = transformer.transform(parsed, 'my-notifications');
    expect(result.className).toBe('MyNotificationsStack');
  });

  it('should remove AmplifyHelpers imports', () => {
    const parsed: ParsedStack = {
      className: 'cdkStack',
      imports: ["import * as cdk from 'aws-cdk-lib';", "import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';"],
      constructorBody: '{}',
      outputs: [],
      hasAmplifyHelpers: true,
      hasResourceDependency: false,
    };

    const result = transformer.transform(parsed, 'notifications');
    expect(result.imports).not.toContain("import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';");
  });

  it('should replace cdk.Fn.ref with process.env.AMPLIFY_ENV', () => {
    const parsed: ParsedStack = {
      className: 'cdkStack',
      imports: [],
      constructorBody: `const name = \`resource-\${cdk.Fn.ref('env')}\`;`,
      outputs: [],
      hasAmplifyHelpers: false,
      hasResourceDependency: false,
    };

    const result = transformer.transform(parsed, 'notifications');
    expect(result.constructorBody).toContain('branchName');
    expect(result.constructorBody).not.toContain("cdk.Fn.ref('env')");
  });

  it('should replace AmplifyHelpers.getProjectInfo().projectName', () => {
    const parsed: ParsedStack = {
      className: 'cdkStack',
      imports: [],
      constructorBody: `const projectName = AmplifyHelpers.getProjectInfo().projectName;`,
      outputs: [],
      hasAmplifyHelpers: true,
      hasResourceDependency: false,
    };

    const result = transformer.transform(parsed, 'notifications');
    expect(result.constructorBody).toContain("process.env.AMPLIFY_PROJECT_NAME || 'myproject'");
  });

  it('should remove CfnParameter declarations', () => {
    const parsed: ParsedStack = {
      className: 'cdkStack',
      imports: [],
      constructorBody: `new cdk.CfnParameter(this, 'env', { type: 'String', description: 'Current env' });`,
      outputs: [],
      hasAmplifyHelpers: false,
      hasResourceDependency: false,
    };

    const result = transformer.transform(parsed, 'notifications');
    expect(result.constructorBody).not.toContain('CfnParameter');
  });

  it('should add TODO for AmplifyHelpers.addResourceDependency', () => {
    const parsed: ParsedStack = {
      className: 'cdkStack',
      imports: [],
      constructorBody: `const deps = AmplifyHelpers.addResourceDependency(this, 'auth', 'userPool', []);`,
      outputs: [],
      hasAmplifyHelpers: true,
      hasResourceDependency: true,
    };

    const result = transformer.transform(parsed, 'notifications');
    expect(result.constructorBody).toContain('TODO: Manual migration required');
  });
});
