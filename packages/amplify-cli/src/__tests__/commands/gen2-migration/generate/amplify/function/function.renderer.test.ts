import ts from 'typescript';
import {
  describeUnexpectedHandlerFormat,
  extractTableName,
  FunctionRenderer,
  mapToCdkRuntime,
  toCommentText,
  toStringLiteral,
} from '../../../../../../commands/gen2-migration/generate/amplify/function/function.renderer';

/** Returns syntax errors reported by the TypeScript compiler for the generated source. */
function syntaxErrors(source: string): string[] {
  const result = ts.transpileModule(source, { reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.ESNext } });
  return (result.diagnostics ?? []).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

/** Finds every `<name>: <initializer>` property assignment in the generated source. */
function findPropertyInitializers(source: string, name: string): ts.Expression[] {
  const sourceFile = ts.createSourceFile('resource.ts', source, ts.ScriptTarget.Latest, true);
  const found: ts.Expression[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      found.push(node.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

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

describe('FunctionRenderer.renderCustomFunction escaping of interpolated values', () => {
  const renderer = new FunctionRenderer('d1abc2def3', 'main');

  it('renders a normal handler with unchanged output', () => {
    const output = renderer.renderCustomFunction({
      resourceName: 'myPythonFunc',
      handler: 'index.handler',
      runtime: 'python3.12',
      timeoutSeconds: 20,
      memoryMB: 256,
      environment: { STAGE: 'prod' },
    });

    // The import header is static text; compare everything from the exported declaration on.
    const declarationStart = output.indexOf('export const myPythonFunc');
    expect(output.slice(0, declarationStart)).toContain('const functionDir = path.dirname(fileURLToPath(import.meta.url));\n\n');
    expect(output.slice(declarationStart)).toBe(
      [
        `export const myPythonFunc = defineFunction(`,
        `  (scope) =>`,
        `    new Function(scope, 'myPythonFunc', {`,
        `      handler: 'index.handler',`,
        `      runtime: Runtime.PYTHON_3_12,`,
        `      architecture: Architecture.X86_64,`,
        `      timeout: Duration.seconds(20),`,
        `      memorySize: 256,`,
        `      environment: {`,
        `        "STAGE": "prod",`,
        `      },`,
        `      code: Code.fromAsset(functionDir, {`,
        `        bundling: {`,
        `          image: Runtime.PYTHON_3_12.bundlingImage,`,
        `          local: {`,
        `            tryBundle(outputDir: string) {`,
        `              execSync(\`python3 -m pip install -r \${path.join(functionDir, 'requirements.txt')} -t \${path.join(outputDir)} --platform manylinux2014_x86_64 --only-binary=:all:\`);`,
        `              execSync(\`cp -r \${functionDir}/* \${path.join(outputDir)}\`);`,
        `              return true;`,
        `            },`,
        `          },`,
        `        },`,
        `      }),`,
        `    }),`,
        `);`,
        ``,
      ].join('\n'),
    );
    expect(syntaxErrors(output)).toEqual([]);
  });

  it.each([
    ['python3.12', "index.handler'quoted\\x`${a}),b"],
    ['java21', 'pkg::Cls::run\\x'],
    ['dotnet8', "Asm::Ns.Cls::Run'x"],
    ['ruby3.3', "file.method\\'`${b},)"],
  ])('handler values containing quote or backslash characters round-trip as a string literal (%s)', (runtime, handler) => {
    const output = renderer.renderCustomFunction({ resourceName: 'myFunc', handler, runtime });

    expect(syntaxErrors(output)).toEqual([]);
    const initializers = findPropertyInitializers(output, 'handler');
    expect(initializers).toHaveLength(1);
    expect(ts.isStringLiteral(initializers[0])).toBe(true);
    expect((initializers[0] as ts.StringLiteral).text).toBe(handler);
  });

  it('adds a warning comment for a handler with an unexpected format', () => {
    const output = renderer.renderCustomFunction({
      resourceName: 'myFunc',
      handler: "index.handler'quoted",
      runtime: 'python3.12',
    });

    expect(output).toContain(`// WARNING: handler "index.handler'quoted" does not match the expected 'module.function' format`);
    expect(syntaxErrors(output)).toEqual([]);
  });

  it('keeps runtime text with line breaks and comment terminators inside the comment line', () => {
    const runtime = 'python3.4\nextra */ text\r\nmore';
    const output = renderer.renderCustomFunction({ resourceName: 'myFunc', handler: 'index.handler', runtime });

    expect(syntaxErrors(output)).toEqual([]);
    expect(output).toContain("// NOTE: runtime 'python3.4 extra * / text more' has no matching CDK Runtime member");
    for (const line of output.split('\n').filter((l) => l.includes('extra'))) {
      expect(line.startsWith('//')).toBe(true);
    }
    // Only the expected top-level statements are present.
    const sourceFile = ts.createSourceFile('resource.ts', output, ts.ScriptTarget.Latest, true);
    const kinds = sourceFile.statements.map((s) =>
      ts.isImportDeclaration(s) ? 'import' : ts.isVariableStatement(s) ? 'variable' : 'other',
    );
    expect(kinds).toEqual(['import', 'import', 'import', 'import', 'import', 'import', 'variable', 'variable']);
  });

  it('keeps manual migration notes with line breaks inside the comment line', () => {
    const output = renderer.renderCustomFunction({
      resourceName: 'myFunc',
      handler: 'index.handler',
      runtime: 'python3.12',
      manualMigrationNotes: ["A schedule ('rate(1 day)\nnext') was not migrated."],
    });

    expect(output).toContain("//   - A schedule ('rate(1 day) next') was not migrated.");
    expect(syntaxErrors(output)).toEqual([]);
  });

  it('renders the existing runtime comment line unchanged for a normal runtime', () => {
    const output = renderer.renderCustomFunction({ resourceName: 'myFunc', handler: 'index.handler', runtime: 'python3.4' });

    expect(output).toContain(
      "// NOTE: runtime 'python3.4' has no matching CDK Runtime member (it may be deprecated/EOL).\n" +
        '// Falling back to Runtime.PROVIDED_AL2023',
    );
  });

  it('rejects a resource name that is not a valid identifier', () => {
    expect(() => renderer.renderCustomFunction({ resourceName: "my'Func", handler: 'index.handler', runtime: 'python3.12' })).toThrow(
      /not a valid TypeScript identifier/,
    );
  });
});

describe('toStringLiteral', () => {
  it('leaves plain values unchanged inside single quotes', () => {
    expect(toStringLiteral('index.handler')).toBe("'index.handler'");
    expect(toStringLiteral('com.example.Handler::handleRequest')).toBe("'com.example.Handler::handleRequest'");
  });

  it('escapes quotes, backslashes, and line terminators', () => {
    expect(toStringLiteral("a'b\\c\nd\u2028e")).toBe("'a\\'b\\\\c\\nd\\u2028e'");
  });
});

describe('toCommentText', () => {
  it('leaves plain values unchanged', () => {
    expect(toCommentText('python3.12')).toBe('python3.12');
  });

  it('replaces line terminators and comment terminators', () => {
    expect(toCommentText('a\nb\r\nc\u2029d */ e')).toBe('a b c d * / e');
  });
});

describe('describeUnexpectedHandlerFormat', () => {
  it.each([
    ['python3.12', 'index.handler'],
    ['python3.12', 'src/app.lambda_handler'],
    ['ruby3.3', 'lambda_function.LambdaFunctions::Handler.run'],
    ['java21', 'com.example.Handler::handleRequest'],
    ['java21', 'example.Handler'],
    ['dotnet8', 'MyAssembly::MyNamespace.Handler::FunctionHandler'],
    ['dotnet8', 'MyAssembly'],
    ['provided.al2023', 'anything'],
    ['cobol1.0', 'anything'],
  ])('accepts the expected format (%s, %s)', (runtime, handler) => {
    expect(describeUnexpectedHandlerFormat(runtime, handler)).toBeUndefined();
  });

  it.each([
    ['python3.12', "index.handler'quoted"],
    ['python3.12', 'index'],
    ['java21', 'pkg::Cls::run\\x'],
    ['dotnet8', 'Asm::Cls'],
    ['ruby3.3', 'file.method`x'],
  ])('warns on an unexpected format (%s, %s)', (runtime, handler) => {
    expect(describeUnexpectedHandlerFormat(runtime, handler)).toContain('does not match the expected');
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
