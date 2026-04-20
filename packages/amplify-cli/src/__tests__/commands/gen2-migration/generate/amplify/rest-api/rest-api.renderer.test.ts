import ts from 'typescript';
import { RestApiRenderer, RestApiDefinition } from '../../../../../../commands/gen2-migration/generate/amplify/rest-api/rest-api.renderer';

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

function createBasicRestApi(overrides?: Partial<RestApiDefinition>): RestApiDefinition {
  return {
    apiName: 'myApi',
    functionName: 'myFunc',
    paths: [
      {
        path: '/items',
        methods: ['GET', 'POST'],
        lambdaFunction: 'myFunc',
      },
    ],
    gen1ApiId: 'abc123',
    gen1RootResourceId: 'root456',
    uniqueFunctions: ['myFunc'],
    ...overrides,
  };
}

function renderApi(renderer: RestApiRenderer, restApi: RestApiDefinition): string {
  const nodes = renderer.render(restApi);
  return nodes.map((n) => printer.printNode(ts.EmitHint.Unspecified, n as ts.Node, sourceFile)).join('\n');
}

describe('RestApiRenderer', () => {
  it('renders a basic REST API', () => {
    const renderer = new RestApiRenderer(false, new Set(['myFunc']));
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
    const renderer = new RestApiRenderer(false, new Set(['myFunc']));
    const restApi = createBasicRestApi({ uniqueFunctions: ['myFunc', 'otherFunc'] });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('myFuncIntegration');
    expect(output).toContain('otherFuncIntegration');
    expect(output).toContain('new LambdaIntegration(backend.myFunc.resources.lambda)');
    expect(output).toContain('new LambdaIntegration(backend.otherFunc.resources.lambda)');
  });

  it('renders policy attachment when auth exists and authType is set', () => {
    const renderer = new RestApiRenderer(true, new Set());
    const restApi = createBasicRestApi({ authType: 'private' });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(gen1myApiPolicy)');
  });

  it('does not render policy attachment when no auth', () => {
    const renderer = new RestApiRenderer(false, new Set());
    const restApi = createBasicRestApi({ authType: 'private' });
    const output = renderApi(renderer, restApi);

    expect(output).not.toContain('attachInlinePolicy(gen1myApiPolicy)');
  });

  it('renders IAM auth type on resource', () => {
    const renderer = new RestApiRenderer(true, new Set(['myFunc']));
    const restApi = createBasicRestApi({
      paths: [
        {
          path: '/items',
          methods: ['GET'],
          authType: 'private',
          lambdaFunction: 'myFunc',
        },
      ],
    });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('AuthorizationType.IAM');
  });

  it('renders auth path policies when permissions.hasAuth is true', () => {
    const renderer = new RestApiRenderer(true, new Set(['myFunc']));
    const restApi = createBasicRestApi({
      paths: [
        {
          path: '/items',
          methods: ['GET', 'POST'],
          lambdaFunction: 'myFunc',
          permissions: { hasAuth: true },
        },
      ],
    });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('authenticatedUserIamRole.attachInlinePolicy');
    expect(output).toContain('itemsAuthPolicy');
    expect(output).toContain('arnForExecuteApi("GET", "/items")');
    expect(output).toContain('arnForExecuteApi("POST", "/items")');
  });

  it('renders group path policies', () => {
    const renderer = new RestApiRenderer(true, new Set(['myFunc']));
    const restApi = createBasicRestApi({
      paths: [
        {
          path: '/admin',
          methods: ['GET'],
          lambdaFunction: 'myFunc',
          permissions: {
            groups: { admins: ['GET'] },
          },
        },
      ],
    });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('groups["admins"].role.attachInlinePolicy');
    expect(output).toContain('adminadminsPolicy');
    expect(output).toContain('arnForExecuteApi("GET", "/admin")');
  });

  it('appends Resource suffix when resource name collides with function name', () => {
    const renderer = new RestApiRenderer(false, new Set(['items']));
    const restApi = createBasicRestApi();
    const output = renderApi(renderer, restApi);

    expect(output).toContain('itemsResource');
  });

  it('handles multiple paths', () => {
    const renderer = new RestApiRenderer(false, new Set());
    const restApi = createBasicRestApi({
      paths: [
        { path: '/items', methods: ['GET'], lambdaFunction: 'myFunc' },
        { path: '/users', methods: ['POST'], lambdaFunction: 'myFunc' },
      ],
    });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('addResource("items"');
    expect(output).toContain('addResource("users"');
  });

  it('sanitizes hyphenated path names into valid variable names', () => {
    const renderer = new RestApiRenderer(false, new Set(['myFunc']));
    const restApi = createBasicRestApi({
      paths: [{ path: '/auth-test', methods: ['GET'], lambdaFunction: 'myFunc' }],
    });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('authtest');
    expect(output).not.toContain('const auth-test');
  });

  it('sanitizes hyphenated api names into valid variable names', () => {
    const renderer = new RestApiRenderer(false, new Set(['myFunc']));
    const restApi = createBasicRestApi({ apiName: 'my-api' });
    const output = renderApi(renderer, restApi);

    expect(output).toContain('myapiStack');
    expect(output).toContain('myapiApi');
    expect(output).not.toContain('const my-api');
  });

  it('handles no uniqueFunctions gracefully', () => {
    const renderer = new RestApiRenderer(false, new Set());
    const restApi = createBasicRestApi({ uniqueFunctions: undefined });
    const output = renderApi(renderer, restApi);

    expect(output).not.toContain('new LambdaIntegration');
  });
});
