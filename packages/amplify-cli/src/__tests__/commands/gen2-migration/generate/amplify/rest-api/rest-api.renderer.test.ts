import ts from 'typescript';
import {
  RestApiRenderer,
  RestApiRenderOptions,
} from '../../../../../../commands/gen2-migration/generate/amplify/rest-api/rest-api.renderer';

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

function createBasicRestApi(overrides?: Partial<RestApiRenderOptions>): RestApiRenderOptions {
  return {
    apiName: 'myApi',
    exportedFunctionName: 'defineMyApi',
    paths: {
      '/items': {
        lambdaFunction: 'myFunc',
        permissions: { setting: 'open' },
      },
    },
    gen1ApiId: 'abc123',
    gen1RootResourceId: 'root456',
    ...overrides,
  };
}

function renderApi(renderer: RestApiRenderer, restApi: RestApiRenderOptions): string {
  const nodes = renderer.render(restApi);
  return nodes.map((n) => printer.printNode(ts.EmitHint.Unspecified, n as ts.Node, sourceFile)).join('\n');
}

describe('RestApiRenderer', () => {
  it('renders a basic REST API', () => {
    const renderer = new RestApiRenderer(false);
    const restApi = createBasicRestApi();
    const output = renderApi(renderer, restApi);

    expect(output).toContain('backend.createStack("rest-api-stack-myApi")');
    expect(output).toContain('new RestApi');
    expect(output).toContain('addGatewayResponse');
    expect(output).toContain('new LambdaIntegration(backend.myFunc.resources.lambda)');
    expect(output).toContain('RestApi.fromRestApiAttributes');
    expect(output).toContain('"abc123"');
    expect(output).toContain('"root456"');
    expect(output).toContain('addMethod("ANY"');
    expect(output).toContain('addProxy');
    expect(output).toContain('backend.addOutput');
  });

  it('renders Lambda integrations for unique functions', () => {
    const renderer = new RestApiRenderer(false);
    const restApi = createBasicRestApi({
      paths: {
        '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
        '/other': { lambdaFunction: 'otherFunc', permissions: { setting: 'open' } },
      },
    });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('myFuncIntegration');
    expect(output).toContain('otherFuncIntegration');
    expect(output).toContain('new LambdaIntegration(backend.myFunc.resources.lambda)');
    expect(output).toContain('new LambdaIntegration(backend.otherFunc.resources.lambda)');
  });

  it('renders policy attachment when auth exists and path is private', () => {
    const renderer = new RestApiRenderer(true);
    const restApi = createBasicRestApi({
      paths: {
        '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'private' } },
      },
    });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('authenticatedUserIamRole.attachInlinePolicy(gen1myApiPolicy)');
  });

  it('does not render policy attachment when no auth', () => {
    const renderer = new RestApiRenderer(false);
    const restApi = createBasicRestApi({
      paths: {
        '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'private' } },
      },
    });
    const output = renderApi(renderer, restApi);

    expect(output).not.toContain('attachInlinePolicy(gen1myApiPolicy)');
  });

  it('renders IAM auth type on resource', () => {
    const renderer = new RestApiRenderer(true);
    const restApi = createBasicRestApi({
      paths: {
        '/items': {
          lambdaFunction: 'myFunc',
          permissions: { setting: 'private' },
        },
      },
    });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('AuthorizationType.IAM');
  });

  it('renders auth path policies when permissions.auth is set', () => {
    const renderer = new RestApiRenderer(true);
    const restApi = createBasicRestApi({
      paths: {
        '/items': {
          lambdaFunction: 'myFunc',
          permissions: { setting: 'private', auth: ['read', 'create'] },
        },
      },
    });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('authenticatedUserIamRole.attachInlinePolicy');
    expect(output).toContain('itemsAuthPolicy');
  });

  it('renders group path policies', () => {
    const renderer = new RestApiRenderer(true);
    const restApi = createBasicRestApi({
      paths: {
        '/admin': {
          lambdaFunction: 'myFunc',
          permissions: {
            groups: { admins: ['read'] },
          },
        },
      },
    });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('groups["admins"].role.attachInlinePolicy');
    expect(output).toContain('adminadminsPolicy');
    expect(output).toContain('arnForExecuteApi("GET", "/admin")');
  });

  it('handles multiple paths', () => {
    const renderer = new RestApiRenderer(false);
    const restApi = createBasicRestApi({
      paths: {
        '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
        '/users': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
      },
    });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('addResource("items"');
    expect(output).toContain('addResource("users"');
  });

  it('sanitizes hyphenated path names into valid variable names', () => {
    const renderer = new RestApiRenderer(false);
    const restApi = createBasicRestApi({
      paths: {
        '/auth-test': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
      },
    });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('authtest');
    expect(output).not.toContain('const auth-test');
  });

  it('sanitizes hyphenated api names into valid variable names', () => {
    const renderer = new RestApiRenderer(false);
    const restApi = createBasicRestApi({ apiName: 'my-api' });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('myapiApi');
    expect(output).not.toContain('const my-api');
  });
});
