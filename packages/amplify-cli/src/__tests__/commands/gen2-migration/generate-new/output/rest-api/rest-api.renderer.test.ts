import ts from 'typescript';
import {
  RestApiRenderer,
  RestApiDefinition,
} from '../../../../../../commands/gen2-migration/generate-new/output/rest-api/rest-api.renderer';

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

function printStatements(statements: ts.Statement[]): string {
  return statements.map((s) => printer.printNode(ts.EmitHint.Unspecified, s, sourceFile)).join('\n');
}

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

describe('RestApiRenderer', () => {
  it('renders a basic REST API with stack and construct', () => {
    const renderer = new RestApiRenderer(false, new Set(['myFunc']));
    const restApi = createBasicRestApi();
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('myApiStack');
    expect(output).toContain('backend.createStack("rest-api-stack-myApi")');
    expect(output).toContain('myApiApi');
    expect(output).toContain('new RestApi');
    expect(output).toContain('myApi-');
    expect(output).toContain('branchName');
  });

  it('renders gateway responses for 4XX and 5XX', () => {
    const renderer = new RestApiRenderer(false, new Set());
    const restApi = createBasicRestApi();
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('addGatewayResponse');
    expect(output).toContain('"Default4XX"');
    expect(output).toContain('DEFAULT_4XX');
    expect(output).toContain('"Default5XX"');
    expect(output).toContain('DEFAULT_5XX');
    expect(output).toContain('"Access-Control-Allow-Origin"');
    expect(output).toContain('"Access-Control-Allow-Headers"');
    expect(output).toContain('"Access-Control-Allow-Methods"');
  });

  it('renders Lambda integrations for unique functions', () => {
    const renderer = new RestApiRenderer(false, new Set(['myFunc']));
    const restApi = createBasicRestApi({ uniqueFunctions: ['myFunc', 'otherFunc'] });
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('myFuncIntegration');
    expect(output).toContain('otherFuncIntegration');
    expect(output).toContain('new LambdaIntegration');
    expect(output).toContain('backend.myFunc.resources.lambda');
  });

  it('renders Gen1 API reference with fromRestApiAttributes', () => {
    const renderer = new RestApiRenderer(false, new Set());
    const restApi = createBasicRestApi();
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('gen1myApiApi');
    expect(output).toContain('RestApi.fromRestApiAttributes');
    expect(output).toContain('restApiId: "abc123"');
    expect(output).toContain('rootResourceId: "root456"');
  });

  it('renders Gen1 policy with execute-api:Invoke', () => {
    const renderer = new RestApiRenderer(false, new Set());
    const restApi = createBasicRestApi();
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('gen1myApiPolicy');
    expect(output).toContain('new Policy');
    expect(output).toContain('new PolicyStatement');
    expect(output).toContain('"execute-api:Invoke"');
    expect(output).toContain('arnForExecuteApi');
  });

  it('renders policy attachment when auth exists and authType is set', () => {
    const renderer = new RestApiRenderer(true, new Set());
    const restApi = createBasicRestApi({ authType: 'private' });
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('authenticatedUserIamRole');
    expect(output).toContain('attachInlinePolicy');
    expect(output).toContain('gen1myApiPolicy');
  });

  it('does not render policy attachment when no auth', () => {
    const renderer = new RestApiRenderer(false, new Set());
    const restApi = createBasicRestApi({ authType: 'private' });
    const output = printStatements(renderer.renderApi(restApi));

    const attachCount = (output.match(/attachInlinePolicy\(gen1myApiPolicy\)/g) || []).length;
    expect(attachCount).toBe(0);
  });

  it('renders resource paths with addResource and addMethod', () => {
    const renderer = new RestApiRenderer(false, new Set(['myFunc']));
    const restApi = createBasicRestApi();
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('addResource');
    expect(output).toContain('"items"');
    expect(output).toContain('addMethod("ANY"');
    expect(output).toContain('addProxy');
    expect(output).toContain('anyMethod: true');
  });

  it('renders CORS preflight options', () => {
    const renderer = new RestApiRenderer(false, new Set());
    const restApi = createBasicRestApi();
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('defaultCorsPreflightOptions');
    expect(output).toContain('Cors.ALL_ORIGINS');
    expect(output).toContain('Cors.ALL_METHODS');
    expect(output).toContain('"Content-Type"');
    expect(output).toContain('"Authorization"');
    expect(output).toContain('statusCode: 200');
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
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('AuthorizationType.IAM');
    expect(output).toContain('defaultMethodOptions');
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
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('"itemsAuthPolicy"');
    expect(output).toContain('authenticatedUserIamRole');
    expect(output).toContain('arnForExecuteApi("GET"');
    expect(output).toContain('arnForExecuteApi("POST"');
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
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('"adminadminsPolicy"');
    expect(output).toContain('groups["admins"]');
    expect(output).toContain('role');
    expect(output).toContain('attachInlinePolicy');
  });

  it('renders output with addOutput', () => {
    const renderer = new RestApiRenderer(false, new Set());
    const restApi = createBasicRestApi();
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('backend.addOutput');
    expect(output).toContain('API');
    expect(output).toContain('endpoint');
    expect(output).toContain('region');
    expect(output).toContain('apiName');
    expect(output).toContain('.url.slice(0, -1)');
  });

  it('appends Resource suffix when resource name collides with function name', () => {
    const renderer = new RestApiRenderer(false, new Set(['items']));
    const restApi = createBasicRestApi();
    const output = printStatements(renderer.renderApi(restApi));

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
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toContain('"items"');
    expect(output).toContain('"users"');
  });

  it('handles no uniqueFunctions gracefully', () => {
    const renderer = new RestApiRenderer(false, new Set());
    const restApi = createBasicRestApi({ uniqueFunctions: undefined });
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).not.toContain('new LambdaIntegration');
  });
});
