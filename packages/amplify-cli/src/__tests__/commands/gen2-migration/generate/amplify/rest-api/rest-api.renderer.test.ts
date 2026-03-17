import ts from 'typescript';
import { RestApiRenderer, RestApiDefinition } from '../../../../../../commands/gen2-migration/generate/amplify/rest-api/rest-api.renderer';

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
  it('renders a basic REST API', () => {
    const renderer = new RestApiRenderer(false, new Set(['myFunc']));
    const restApi = createBasicRestApi();
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toMatchInlineSnapshot(`
      "const myApiStack = backend.createStack("rest-api-stack-myApi");
      const myApiApi = new RestApi(myApiStack, "RestApi", {
          restApiName: \`myApi-\${branchName}\`
      });
      myApiApi.addGatewayResponse("Default4XX", {
          type: ResponseType.DEFAULT_4XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      myApiApi.addGatewayResponse("Default5XX", {
          type: ResponseType.DEFAULT_5XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      const myFuncIntegration = new LambdaIntegration(backend.myFunc.resources.lambda);
      const gen1myApiApi = RestApi.fromRestApiAttributes(myApiStack, "Gen1myApiApi", {
          restApiId: "abc123",
          rootResourceId: "root456"
      });
      const gen1myApiPolicy = new Policy(myApiStack, "Gen1myApiPolicy", {
          statements: [new PolicyStatement({
                  actions: ["execute-api:Invoke"],
                  resources: [\`\${gen1myApiApi.arnForExecuteApi("GET", "/*")}\`, \`\${gen1myApiApi.arnForExecuteApi("POST", "/*")}\`]
              })]
      });
      const items = myApiApi.root.addResource("items", {
          defaultCorsPreflightOptions: {
              allowOrigins: Cors.ALL_ORIGINS,
              allowMethods: Cors.ALL_METHODS,
              allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
              statusCode: 200
          }
      });
      items.addMethod("ANY", myFuncIntegration);
      items.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration
      });
      backend.addOutput({
          custom: {
              API: {
                  [myApiApi.restApiName]: {
                      endpoint: myApiApi.url.slice(0, -1),
                      region: Stack.of(myApiApi).region,
                      apiName: myApiApi.restApiName
                  }
              }
          }
      });"
    `);
  });

  it('renders Lambda integrations for unique functions', () => {
    const renderer = new RestApiRenderer(false, new Set(['myFunc']));
    const restApi = createBasicRestApi({ uniqueFunctions: ['myFunc', 'otherFunc'] });
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toMatchInlineSnapshot(`
      "const myApiStack = backend.createStack("rest-api-stack-myApi");
      const myApiApi = new RestApi(myApiStack, "RestApi", {
          restApiName: \`myApi-\${branchName}\`
      });
      myApiApi.addGatewayResponse("Default4XX", {
          type: ResponseType.DEFAULT_4XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      myApiApi.addGatewayResponse("Default5XX", {
          type: ResponseType.DEFAULT_5XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      const myFuncIntegration = new LambdaIntegration(backend.myFunc.resources.lambda);
      const otherFuncIntegration = new LambdaIntegration(backend.otherFunc.resources.lambda);
      const gen1myApiApi = RestApi.fromRestApiAttributes(myApiStack, "Gen1myApiApi", {
          restApiId: "abc123",
          rootResourceId: "root456"
      });
      const gen1myApiPolicy = new Policy(myApiStack, "Gen1myApiPolicy", {
          statements: [new PolicyStatement({
                  actions: ["execute-api:Invoke"],
                  resources: [\`\${gen1myApiApi.arnForExecuteApi("GET", "/*")}\`, \`\${gen1myApiApi.arnForExecuteApi("POST", "/*")}\`]
              })]
      });
      const items = myApiApi.root.addResource("items", {
          defaultCorsPreflightOptions: {
              allowOrigins: Cors.ALL_ORIGINS,
              allowMethods: Cors.ALL_METHODS,
              allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
              statusCode: 200
          }
      });
      items.addMethod("ANY", myFuncIntegration);
      items.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration
      });
      backend.addOutput({
          custom: {
              API: {
                  [myApiApi.restApiName]: {
                      endpoint: myApiApi.url.slice(0, -1),
                      region: Stack.of(myApiApi).region,
                      apiName: myApiApi.restApiName
                  }
              }
          }
      });"
    `);
  });

  it('renders policy attachment when auth exists and authType is set', () => {
    const renderer = new RestApiRenderer(true, new Set());
    const restApi = createBasicRestApi({ authType: 'private' });
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).toMatchInlineSnapshot(`
      "const myApiStack = backend.createStack("rest-api-stack-myApi");
      const myApiApi = new RestApi(myApiStack, "RestApi", {
          restApiName: \`myApi-\${branchName}\`
      });
      myApiApi.addGatewayResponse("Default4XX", {
          type: ResponseType.DEFAULT_4XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      myApiApi.addGatewayResponse("Default5XX", {
          type: ResponseType.DEFAULT_5XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      const myFuncIntegration = new LambdaIntegration(backend.myFunc.resources.lambda);
      const gen1myApiApi = RestApi.fromRestApiAttributes(myApiStack, "Gen1myApiApi", {
          restApiId: "abc123",
          rootResourceId: "root456"
      });
      const gen1myApiPolicy = new Policy(myApiStack, "Gen1myApiPolicy", {
          statements: [new PolicyStatement({
                  actions: ["execute-api:Invoke"],
                  resources: [\`\${gen1myApiApi.arnForExecuteApi("GET", "/*")}\`, \`\${gen1myApiApi.arnForExecuteApi("POST", "/*")}\`]
              })]
      });
      backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(gen1myApiPolicy);
      const items = myApiApi.root.addResource("items", {
          defaultCorsPreflightOptions: {
              allowOrigins: Cors.ALL_ORIGINS,
              allowMethods: Cors.ALL_METHODS,
              allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
              statusCode: 200
          }
      });
      items.addMethod("ANY", myFuncIntegration);
      items.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration
      });
      backend.addOutput({
          custom: {
              API: {
                  [myApiApi.restApiName]: {
                      endpoint: myApiApi.url.slice(0, -1),
                      region: Stack.of(myApiApi).region,
                      apiName: myApiApi.restApiName
                  }
              }
          }
      });"
    `);
  });

  it('does not render policy attachment when no auth', () => {
    const renderer = new RestApiRenderer(false, new Set());
    const restApi = createBasicRestApi({ authType: 'private' });
    const output = printStatements(renderer.renderApi(restApi));

    const attachCount = (output.match(/attachInlinePolicy\(gen1myApiPolicy\)/g) || []).length;
    expect(attachCount).toBe(0);
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

    expect(output).toMatchInlineSnapshot(`
      "const myApiStack = backend.createStack("rest-api-stack-myApi");
      const myApiApi = new RestApi(myApiStack, "RestApi", {
          restApiName: \`myApi-\${branchName}\`
      });
      myApiApi.addGatewayResponse("Default4XX", {
          type: ResponseType.DEFAULT_4XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      myApiApi.addGatewayResponse("Default5XX", {
          type: ResponseType.DEFAULT_5XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      const myFuncIntegration = new LambdaIntegration(backend.myFunc.resources.lambda);
      const gen1myApiApi = RestApi.fromRestApiAttributes(myApiStack, "Gen1myApiApi", {
          restApiId: "abc123",
          rootResourceId: "root456"
      });
      const gen1myApiPolicy = new Policy(myApiStack, "Gen1myApiPolicy", {
          statements: [new PolicyStatement({
                  actions: ["execute-api:Invoke"],
                  resources: [\`\${gen1myApiApi.arnForExecuteApi("GET", "/*")}\`]
              })]
      });
      const items = myApiApi.root.addResource("items", {
          defaultMethodOptions: {
              authorizationType: AuthorizationType.IAM
          },
          defaultCorsPreflightOptions: {
              allowOrigins: Cors.ALL_ORIGINS,
              allowMethods: Cors.ALL_METHODS,
              allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
              statusCode: 200
          }
      });
      items.addMethod("ANY", myFuncIntegration);
      items.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration
      });
      backend.addOutput({
          custom: {
              API: {
                  [myApiApi.restApiName]: {
                      endpoint: myApiApi.url.slice(0, -1),
                      region: Stack.of(myApiApi).region,
                      apiName: myApiApi.restApiName
                  }
              }
          }
      });"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "const myApiStack = backend.createStack("rest-api-stack-myApi");
      const myApiApi = new RestApi(myApiStack, "RestApi", {
          restApiName: \`myApi-\${branchName}\`
      });
      myApiApi.addGatewayResponse("Default4XX", {
          type: ResponseType.DEFAULT_4XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      myApiApi.addGatewayResponse("Default5XX", {
          type: ResponseType.DEFAULT_5XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      const myFuncIntegration = new LambdaIntegration(backend.myFunc.resources.lambda);
      const gen1myApiApi = RestApi.fromRestApiAttributes(myApiStack, "Gen1myApiApi", {
          restApiId: "abc123",
          rootResourceId: "root456"
      });
      const gen1myApiPolicy = new Policy(myApiStack, "Gen1myApiPolicy", {
          statements: [new PolicyStatement({
                  actions: ["execute-api:Invoke"],
                  resources: [\`\${gen1myApiApi.arnForExecuteApi("GET", "/*")}\`, \`\${gen1myApiApi.arnForExecuteApi("POST", "/*")}\`]
              })]
      });
      const items = myApiApi.root.addResource("items", {
          defaultCorsPreflightOptions: {
              allowOrigins: Cors.ALL_ORIGINS,
              allowMethods: Cors.ALL_METHODS,
              allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
              statusCode: 200
          }
      });
      items.addMethod("ANY", myFuncIntegration);
      items.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration
      });
      // /items - all authenticated users

      backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(new Policy(myApiStack, "itemsAuthPolicy", {
          statements: [new PolicyStatement({
                  actions: ["execute-api:Invoke"],
                  resources: [myApiApi.arnForExecuteApi("GET", "/items"), myApiApi.arnForExecuteApi("GET", "/items/*"), myApiApi.arnForExecuteApi("POST", "/items"), myApiApi.arnForExecuteApi("POST", "/items/*")]
              })]
      }));
      backend.addOutput({
          custom: {
              API: {
                  [myApiApi.restApiName]: {
                      endpoint: myApiApi.url.slice(0, -1),
                      region: Stack.of(myApiApi).region,
                      apiName: myApiApi.restApiName
                  }
              }
          }
      });"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "const myApiStack = backend.createStack("rest-api-stack-myApi");
      const myApiApi = new RestApi(myApiStack, "RestApi", {
          restApiName: \`myApi-\${branchName}\`
      });
      myApiApi.addGatewayResponse("Default4XX", {
          type: ResponseType.DEFAULT_4XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      myApiApi.addGatewayResponse("Default5XX", {
          type: ResponseType.DEFAULT_5XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      const myFuncIntegration = new LambdaIntegration(backend.myFunc.resources.lambda);
      const gen1myApiApi = RestApi.fromRestApiAttributes(myApiStack, "Gen1myApiApi", {
          restApiId: "abc123",
          rootResourceId: "root456"
      });
      const gen1myApiPolicy = new Policy(myApiStack, "Gen1myApiPolicy", {
          statements: [new PolicyStatement({
                  actions: ["execute-api:Invoke"],
                  resources: [\`\${gen1myApiApi.arnForExecuteApi("GET", "/*")}\`]
              })]
      });
      const admin = myApiApi.root.addResource("admin", {
          defaultCorsPreflightOptions: {
              allowOrigins: Cors.ALL_ORIGINS,
              allowMethods: Cors.ALL_METHODS,
              allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
              statusCode: 200
          }
      });
      admin.addMethod("ANY", myFuncIntegration);
      admin.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration
      });
      // /admin - admins group only

      backend.auth.resources.groups["admins"].role.attachInlinePolicy(new Policy(myApiStack, "adminadminsPolicy", {
          statements: [new PolicyStatement({
                  actions: ["execute-api:Invoke"],
                  resources: [myApiApi.arnForExecuteApi("GET", "/admin"), myApiApi.arnForExecuteApi("GET", "/admin/*")]
              })]
      }));
      backend.addOutput({
          custom: {
              API: {
                  [myApiApi.restApiName]: {
                      endpoint: myApiApi.url.slice(0, -1),
                      region: Stack.of(myApiApi).region,
                      apiName: myApiApi.restApiName
                  }
              }
          }
      });"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "const myApiStack = backend.createStack("rest-api-stack-myApi");
      const myApiApi = new RestApi(myApiStack, "RestApi", {
          restApiName: \`myApi-\${branchName}\`
      });
      myApiApi.addGatewayResponse("Default4XX", {
          type: ResponseType.DEFAULT_4XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      myApiApi.addGatewayResponse("Default5XX", {
          type: ResponseType.DEFAULT_5XX,
          responseHeaders: {
              "Access-Control-Allow-Origin": "'*'",
              "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              "Access-Control-Allow-Methods": "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
              "Access-Control-Expose-Headers": "'Date,X-Amzn-ErrorType'"
          }
      });
      const myFuncIntegration = new LambdaIntegration(backend.myFunc.resources.lambda);
      const gen1myApiApi = RestApi.fromRestApiAttributes(myApiStack, "Gen1myApiApi", {
          restApiId: "abc123",
          rootResourceId: "root456"
      });
      const gen1myApiPolicy = new Policy(myApiStack, "Gen1myApiPolicy", {
          statements: [new PolicyStatement({
                  actions: ["execute-api:Invoke"],
                  resources: [\`\${gen1myApiApi.arnForExecuteApi("GET", "/*")}\`, \`\${gen1myApiApi.arnForExecuteApi("POST", "/*")}\`]
              })]
      });
      const items = myApiApi.root.addResource("items", {
          defaultCorsPreflightOptions: {
              allowOrigins: Cors.ALL_ORIGINS,
              allowMethods: Cors.ALL_METHODS,
              allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
              statusCode: 200
          }
      });
      items.addMethod("ANY", myFuncIntegration);
      items.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration
      });
      const users = myApiApi.root.addResource("users", {
          defaultCorsPreflightOptions: {
              allowOrigins: Cors.ALL_ORIGINS,
              allowMethods: Cors.ALL_METHODS,
              allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
              statusCode: 200
          }
      });
      users.addMethod("ANY", myFuncIntegration);
      users.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration
      });
      backend.addOutput({
          custom: {
              API: {
                  [myApiApi.restApiName]: {
                      endpoint: myApiApi.url.slice(0, -1),
                      region: Stack.of(myApiApi).region,
                      apiName: myApiApi.restApiName
                  }
              }
          }
      });"
    `);
  });

  it('handles no uniqueFunctions gracefully', () => {
    const renderer = new RestApiRenderer(false, new Set());
    const restApi = createBasicRestApi({ uniqueFunctions: undefined });
    const output = printStatements(renderer.renderApi(restApi));

    expect(output).not.toContain('new LambdaIntegration');
  });
});
