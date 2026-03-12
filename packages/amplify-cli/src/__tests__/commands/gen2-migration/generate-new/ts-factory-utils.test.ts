import ts from 'typescript';
import {
  constDecl,
  propAccess,
  constFromBackend,
  assignProp,
  jsValue,
  createBranchNameDeclaration,
  extractFilePathFromHandler,
} from '../../../../commands/gen2-migration/generate-new/ts-factory-utils';

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

function print(node: ts.Node): string {
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}

describe('constDecl', () => {
  it('creates a const variable statement', () => {
    const result = constDecl('foo', ts.factory.createStringLiteral('bar'));
    expect(print(result)).toBe(`const foo = "bar";`);
  });
});

describe('propAccess', () => {
  it('creates a single-level property access from a string root', () => {
    const result = propAccess('backend', 'auth');
    expect(print(result)).toBe('backend.auth');
  });

  it('creates a multi-level property access chain', () => {
    const result = propAccess('backend', 'auth', 'resources', 'userPool');
    expect(print(result)).toBe('backend.auth.resources.userPool');
  });

  it('accepts an expression as root', () => {
    const root = ts.factory.createIdentifier('myObj');
    const result = propAccess(root, 'nested', 'prop');
    expect(print(result)).toBe('myObj.nested.prop');
  });
});

describe('constFromBackend', () => {
  it('creates const x = backend.a.b', () => {
    const result = constFromBackend('authStack', 'auth', 'stack');
    expect(print(result)).toBe('const authStack = backend.auth.stack;');
  });
});

describe('assignProp', () => {
  it('assigns a string value', () => {
    const result = assignProp('config', 'name', 'myApp');
    expect(print(result)).toBe(`config.name = "myApp";`);
  });

  it('assigns a boolean value', () => {
    const result = assignProp('config', 'enabled', true);
    expect(print(result)).toBe('config.enabled = true;');
  });

  it('assigns a number value', () => {
    const result = assignProp('config', 'count', 42);
    expect(print(result)).toBe('config.count = 42;');
  });

  it('assigns undefined', () => {
    const result = assignProp('config', 'value', undefined);
    expect(print(result)).toBe('config.value = undefined;');
  });

  it('assigns a string array', () => {
    const result = assignProp('config', 'tags', ['a', 'b']);
    expect(print(result)).toBe(`config.tags = ["a", "b"];`);
  });
});

describe('jsValue', () => {
  it('converts undefined', () => {
    expect(print(jsValue(undefined))).toBe('undefined');
  });

  it('converts booleans', () => {
    expect(print(jsValue(true))).toBe('true');
    expect(print(jsValue(false))).toBe('false');
  });

  it('converts numbers', () => {
    expect(print(jsValue(42))).toBe('42');
  });

  it('converts strings', () => {
    expect(print(jsValue('hello'))).toBe('"hello"');
  });

  it('converts string arrays', () => {
    expect(print(jsValue(['a', 'b']))).toBe('["a", "b"]');
  });

  it('converts nested objects', () => {
    const result = print(jsValue({ key: 'val', nested: { n: 1 } }));
    expect(result).toContain('key: "val"');
    expect(result).toContain('n: 1');
  });
});

describe('createBranchNameDeclaration', () => {
  it('creates the branchName const with fallback', () => {
    const result = print(createBranchNameDeclaration());
    expect(result).toContain('branchName');
    expect(result).toContain('process.env.AWS_BRANCH');
    expect(result).toContain('sandbox');
  });
});

describe('extractFilePathFromHandler', () => {
  it('converts index.handler to ./index.js', () => {
    expect(extractFilePathFromHandler('index.handler')).toBe('./index.js');
  });

  it('converts nested handler paths', () => {
    expect(extractFilePathFromHandler('src/handler.myFunction')).toBe('./src/handler.js');
  });

  it('handles handler with no dot', () => {
    expect(extractFilePathFromHandler('handler')).toBe('./handler.js');
  });
});
