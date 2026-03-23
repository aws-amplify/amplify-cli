import ts from 'typescript';
import { TS } from '../../../../../commands/gen2-migration/generate/_infra/ts';

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

function print(node: ts.Node): string {
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}

describe('constDecl', () => {
  it('creates a const variable statement', () => {
    const result = TS.constDecl('foo', ts.factory.createStringLiteral('bar'));
    expect(print(result)).toBe(`const foo = "bar";`);
  });
});

describe('propAccess', () => {
  it('creates a single-level property access from a string root', () => {
    const result = TS.propAccess('backend', 'auth');
    expect(print(result)).toBe('backend.auth');
  });

  it('creates a multi-level property access chain', () => {
    const result = TS.propAccess('backend', 'auth', 'resources', 'userPool');
    expect(print(result)).toBe('backend.auth.resources.userPool');
  });

  it('accepts an expression as root', () => {
    const root = ts.factory.createIdentifier('myObj');
    const result = TS.propAccess(root, 'nested', 'prop');
    expect(print(result)).toBe('myObj.nested.prop');
  });
});

describe('constFromBackend', () => {
  it('creates const x = backend.a.b', () => {
    const result = TS.constFromBackend('authStack', 'auth', 'stack');
    expect(print(result)).toBe('const authStack = backend.auth.stack;');
  });
});

describe('assignProp', () => {
  it('assigns a string value', () => {
    const result = TS.assignProp('config', 'name', 'myApp');
    expect(print(result)).toBe(`config.name = "myApp";`);
  });

  it('assigns a boolean value', () => {
    const result = TS.assignProp('config', 'enabled', true);
    expect(print(result)).toBe('config.enabled = true;');
  });

  it('assigns a number value', () => {
    const result = TS.assignProp('config', 'count', 42);
    expect(print(result)).toBe('config.count = 42;');
  });

  it('assigns undefined', () => {
    const result = TS.assignProp('config', 'value', undefined);
    expect(print(result)).toBe('config.value = undefined;');
  });

  it('assigns a string array', () => {
    const result = TS.assignProp('config', 'tags', ['a', 'b']);
    expect(print(result)).toBe(`config.tags = ["a", "b"];`);
  });
});

describe('jsValue', () => {
  it('converts undefined', () => {
    expect(print(TS.jsValue(undefined))).toBe('undefined');
  });

  it('converts booleans', () => {
    expect(print(TS.jsValue(true))).toBe('true');
    expect(print(TS.jsValue(false))).toBe('false');
  });

  it('converts numbers', () => {
    expect(print(TS.jsValue(42))).toBe('42');
  });

  it('converts strings', () => {
    expect(print(TS.jsValue('hello'))).toBe('"hello"');
  });

  it('converts string arrays', () => {
    expect(print(TS.jsValue(['a', 'b']))).toBe('["a", "b"]');
  });

  it('converts nested objects', () => {
    const result = print(TS.jsValue({ key: 'val', nested: { n: 1 } }));
    expect(result).toContain('key: "val"');
    expect(result).toContain('n: 1');
  });
});

describe('createBranchNameDeclaration', () => {
  it('creates the branchName const with fallback', () => {
    const result = print(TS.createBranchNameDeclaration());
    expect(result).toContain('branchName');
    expect(result).toContain('process.env.AWS_BRANCH');
    expect(result).toContain('sandbox');
  });
});

describe('extractFilePathFromHandler', () => {
  it('converts index.handler to ./index.js', () => {
    expect(TS.extractFilePathFromHandler('index.handler')).toBe('./index.js');
  });

  it('converts nested handler paths', () => {
    expect(TS.extractFilePathFromHandler('src/handler.myFunction')).toBe('./src/handler.js');
  });

  it('handles handler with no dot', () => {
    expect(TS.extractFilePathFromHandler('handler')).toBe('./handler.js');
  });
});
