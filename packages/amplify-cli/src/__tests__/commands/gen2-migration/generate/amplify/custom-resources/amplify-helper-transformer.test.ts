import * as ts from 'typescript';
import { AmplifyHelperTransformer } from '../../../../../../commands/gen2-migration/generate/amplify/custom-resources/amplify-helper-transformer';

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

function transformCode(code: string, projectName?: string): string {
  const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let { sourceFile: transformed } = AmplifyHelperTransformer.transform(sourceFile, projectName);
  transformed = AmplifyHelperTransformer.addBranchNameVariable(transformed, projectName);
  return printer.printFile(transformed);
}

function transformOnly(code: string, projectName?: string): string {
  const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const { sourceFile: transformed } = AmplifyHelperTransformer.transform(sourceFile, projectName);
  return printer.printFile(transformed);
}

function transformRaw(code: string, projectName?: string): { output: string; addedBackendParam: boolean } {
  const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const { sourceFile: transformed, addedBackendParam } = AmplifyHelperTransformer.transform(sourceFile, projectName);
  return { output: printer.printFile(transformed), addedBackendParam };
}

describe('AmplifyHelperTransformer', () => {
  describe('import removal', () => {
    it('removes amplify-dependent-resources-ref imports', () => {
      const code = `
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';
const x = 1;
`;
      const output = transformOnly(code);

      expect(output).not.toContain('amplify-dependent-resources-ref');
      expect(output).toContain('const x = 1');
    });

    it('removes cli-extensibility-helper imports', () => {
      const code = `
import { AmplifyHelpers } from '@aws-amplify/cli-extensibility-helper';
const x = 1;
`;
      const output = transformOnly(code);

      expect(output).not.toContain('cli-extensibility-helper');
      expect(output).toContain('const x = 1');
    });
  });

  describe('getProjectInfo transformation', () => {
    it('replaces AmplifyHelpers.getProjectInfo().envName with branchName', () => {
      const code = `const env = AmplifyHelpers.getProjectInfo().envName;`;
      const output = transformOnly(code);

      expect(output).toContain('branchName');
      expect(output).not.toContain('AmplifyHelpers');
    });

    it('replaces AmplifyHelpers.getProjectInfo().projectName with projectName', () => {
      const code = `const name = AmplifyHelpers.getProjectInfo().projectName;`;
      const output = transformOnly(code);

      expect(output).toContain('projectName');
      expect(output).not.toContain('AmplifyHelpers');
    });

    it('removes variable assigned from getProjectInfo and transforms access', () => {
      const code = `
const info = AmplifyHelpers.getProjectInfo();
const env = info.envName;
`;
      const output = transformOnly(code);

      expect(output).not.toContain('AmplifyHelpers.getProjectInfo');
      expect(output).toContain('branchName');
    });
  });

  describe('CfnParameter removal', () => {
    it('removes CfnParameter for env', () => {
      const code = `const envParam = new cdk.CfnParameter(this, 'env', { type: 'String' });`;
      const output = transformOnly(code);

      expect(output).not.toContain('CfnParameter');
      expect(output).not.toContain('envParam');
    });

    it('removes expression statement CfnParameter for env', () => {
      const code = `new cdk.CfnParameter(this, 'env', { type: 'String' });`;
      const output = transformOnly(code);

      expect(output).not.toContain('CfnParameter');
    });
  });

  describe('Fn.ref transformation', () => {
    it('replaces cdk.Fn.ref("env") with branchName', () => {
      const code = `const env = cdk.Fn.ref('env');`;
      const output = transformOnly(code);

      expect(output).toContain('branchName');
      expect(output).not.toContain('Fn.ref');
    });

    it('replaces Fn.ref("env") with branchName', () => {
      const code = `const env = Fn.ref('env');`;
      const output = transformOnly(code);

      expect(output).toContain('branchName');
    });
  });

  describe('class heritage transformation', () => {
    it('transforms cdk.Stack extends to Construct', () => {
      const code = `
class MyStack extends cdk.Stack {
  constructor(scope: any, id: string) {
    super(scope, id);
  }
}
`;
      const output = transformOnly(code);

      expect(output).toContain('extends Construct');
      expect(output).not.toContain('extends cdk.Stack');
    });

    it('transforms cdk.NestedStack extends to Construct', () => {
      const code = `
class MyStack extends cdk.NestedStack {
  constructor(scope: any, id: string) {
    super(scope, id);
  }
}
`;
      const output = transformOnly(code);

      expect(output).toContain('extends Construct');
      expect(output).not.toContain('NestedStack');
    });
  });

  describe('super() call transformation', () => {
    it('trims super() to only scope and id arguments', () => {
      const code = `
class MyStack extends cdk.Stack {
  constructor(scope: any, id: string, props: any) {
    super(scope, id, props);
  }
}
`;
      const output = transformOnly(code);

      expect(output).toContain('super(scope, id)');
      expect(output).not.toContain('super(scope, id, props)');
    });
  });

  describe('addBranchNameVariable', () => {
    it('inserts branchName declaration after imports', () => {
      const code = `import * as cdk from 'aws-cdk-lib';\nconst x = 1;`;
      const output = transformCode(code);

      expect(output).toContain('const branchName');
      expect(output).toContain('process.env.AWS_BRANCH');
      expect(output).toContain('"sandbox"');
    });

    it('inserts projectName when provided', () => {
      const code = `import * as cdk from 'aws-cdk-lib';\nconst x = 1;`;
      const output = transformCode(code, 'myProject');

      expect(output).toContain('const projectName');
      expect(output).toContain('"myProject"');
    });

    it('does not duplicate branchName if already present', () => {
      const code = `const branchName = 'main';\nconst x = 1;`;
      const output = transformCode(code);

      const matches = output.match(/const branchName/g) || [];
      expect(matches).toHaveLength(1);
    });
  });

  describe('dependency variable transformation', () => {
    it('removes addResourceDependency and transforms Fn.ref with dependency access', () => {
      const code = `
const dependencies = AmplifyHelpers.addResourceDependency(this, []);
const poolId = cdk.Fn.ref(dependencies.auth.myAuth.UserPoolId);
`;
      const { output, addedBackendParam } = transformRaw(code);

      expect(output).not.toContain('addResourceDependency');
      expect(output).toContain('backend.auth.resources.userPool.userPoolId');
      expect(addedBackendParam).toBe(true);
    });

    it('transforms function dependency access with resource name', () => {
      const code = `
const deps = AmplifyHelpers.addResourceDependency(this, []);
const arn = cdk.Fn.ref(deps.function.myFunc.Arn);
`;
      const { output, addedBackendParam } = transformRaw(code);

      expect(output).toContain('backend.functions.myFunc.resources.lambda.functionArn');
      expect(addedBackendParam).toBe(true);
    });

    it('adds backend parameter to constructor when dependencies exist', () => {
      const code = `
class MyStack extends cdk.Stack {
  constructor(scope: any, id: string, props: any) {
    super(scope, id, props);
    const deps = AmplifyHelpers.addResourceDependency(this, []);
  }
}
`;
      const { output, addedBackendParam } = transformRaw(code);

      expect(output).toContain('backend: Backend');
      expect(addedBackendParam).toBe(true);
    });

    it('returns addedBackendParam false when no dependencies exist', () => {
      const code = `
class MyStack extends cdk.Stack {
  constructor(scope: any, id: string) {
    super(scope, id);
  }
}
`;
      const { addedBackendParam } = transformRaw(code);

      expect(addedBackendParam).toBe(false);
    });
  });

  describe('bare addResourceDependency named-import (customer migrationgen2 pattern)', () => {
    // Customer Gen1 cdk-stack.ts imports addResourceDependency as a bare named import
    // and assigns it to a typed `dependencies` variable. Detection must recognize the
    // bare Identifier call (not just PropertyAccess) so refs get rewritten to backend.*
    const BARE_IMPORT_CODE = `
import { type AmplifyResourceProps, addResourceDependency } from '@aws-amplify/cli-extensibility-helper';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: AmplifyResourceProps) {
    super(scope, id, props);
    const dependencies: AmplifyDependentResourcesAttributes = addResourceDependency(this, props, 'myCustom', [
      { category: 'function', resourceName: 'myFunc' },
      { category: 'auth', resourceName: 'myAuth' },
    ]);
    const fnName = cdk.Fn.ref(dependencies.function.myFunc.Name);
    const poolArn = cdk.Fn.ref(dependencies.auth.myAuth.UserPoolArn);
  }
}
`;

    it('detects the bare addResourceDependency call and sets addedBackendParam', () => {
      const { addedBackendParam } = transformRaw(BARE_IMPORT_CODE);
      expect(addedBackendParam).toBe(true);
    });

    it('adds the backend constructor parameter', () => {
      const { output } = transformRaw(BARE_IMPORT_CODE);
      expect(output).toContain('backend: Backend');
    });

    it('rewrites dependencies.* references to backend.* and removes the call', () => {
      const { output } = transformRaw(BARE_IMPORT_CODE);

      expect(output).toContain('backend.functions.myFunc.resources.lambda.functionName');
      expect(output).toContain('backend.auth.resources.userPool.userPoolArn');
      expect(output).not.toContain('addResourceDependency');
      expect(output).not.toContain('dependencies.');
      expect(output).not.toContain('Fn.ref');
      expect(output).not.toContain('AmplifyDependentResourcesAttributes');
    });

    it('detects a bare addResourceDependency even without a type annotation', () => {
      const code = `
import { addResourceDependency } from '@aws-amplify/cli-extensibility-helper';
const dependencies = addResourceDependency(this, props, 'myCustom', []);
const fnName = cdk.Fn.ref(dependencies.function.myFunc.Name);
`;
      const { output, addedBackendParam } = transformRaw(code);

      expect(addedBackendParam).toBe(true);
      expect(output).toContain('backend.functions.myFunc.resources.lambda.functionName');
      expect(output).not.toContain('addResourceDependency');
    });
  });

  describe('AmplifyDependentResourcesAttributes removal', () => {
    it('removes variable with AmplifyDependentResourcesAttributes type', () => {
      const code = `const attrs: AmplifyDependentResourcesAttributes = {};`;
      const output = transformOnly(code);

      expect(output).not.toContain('AmplifyDependentResourcesAttributes');
    });

    it('strips as AmplifyDependentResourcesAttributes assertion', () => {
      const code = `const attrs = someValue as AmplifyDependentResourcesAttributes;`;
      const output = transformOnly(code);

      expect(output).not.toContain('AmplifyDependentResourcesAttributes');
      expect(output).toContain('someValue');
    });
  });

  describe('removed module identifier cleanup', () => {
    it('removes variable declarations calling functions from removed imports', () => {
      const code = `
import { getAmplifyMeta } from '../../types/amplify-dependent-resources-ref';
const meta = getAmplifyMeta();
const x = 1;
`;
      const output = transformOnly(code);

      expect(output).not.toContain('getAmplifyMeta');
      expect(output).toContain('const x = 1');
    });
  });
});
