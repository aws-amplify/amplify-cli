import { BackendSynthesizer, BackendRenderParameters } from './synthesizer';
import ts from 'typescript';

describe('BackendSynthesizer REST API Migration', () => {
  let synthesizer: BackendSynthesizer;

  beforeEach(() => {
    synthesizer = new BackendSynthesizer();
  });

  describe('REST API Generation', () => {
    it('should generate HttpApi with CORS configuration', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'testFunction',
              paths: [
                {
                  path: '/items',
                  methods: ['GET', 'POST'],
                  authType: 'private',
                  lambdaFunction: 'testFunction',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['testFunction', 'function']]),
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Check for CORS imports
      expect(output).toContain('CorsHttpMethod');
      expect(output).toContain('aws-cdk-lib/aws-apigatewayv2');

      // Check for HttpApi with CORS configuration
      expect(output).toContain('corsPreflight');
      expect(output).toContain('allowMethods');
      expect(output).toContain('allowOrigins');
      expect(output).toContain('allowHeaders');
      expect(output).toContain('CorsHttpMethod.ANY');
    });

    it('should map auth types to correct authorizers', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'testFunction',
              paths: [
                {
                  path: '/private',
                  methods: ['GET'],
                  authType: 'private',
                  lambdaFunction: 'testFunction',
                },
                {
                  path: '/protected',
                  methods: ['POST'],
                  authType: 'protected',
                  lambdaFunction: 'testFunction',
                },
                {
                  path: '/open',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'testFunction',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['testFunction', 'function']]),
        },
        auth: {
          importFrom: './auth/resource',
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Check for authorizer creation
      expect(output).toContain('HttpIamAuthorizer');
      expect(output).toContain('HttpUserPoolAuthorizer');

      // Check for correct authorizer assignment
      expect(output).toContain('authorizer: iamAuthorizer');
      expect(output).toContain('authorizer: userPoolAuthorizer');
    });

    it('should generate unique integration names per function', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'function1', // Use function1 as default
              paths: [
                {
                  path: '/items',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'function1',
                },
                {
                  path: '/books',
                  methods: ['POST'],
                  authType: 'open',
                  lambdaFunction: 'function2',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([
            ['function1', 'function'],
            ['function2', 'function'],
          ]),
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Check for unique integration names
      expect(output).toContain('function1Integration');
      expect(output).toContain('function2Integration');
      expect(output).toContain('backend.function1.resources');
      expect(output).toContain('backend.function2.resources');
    });

    it('should respect HTTP methods from path configuration', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'testFunction',
              paths: [
                {
                  path: '/items',
                  methods: ['GET', 'POST'],
                  authType: 'open',
                  lambdaFunction: 'testFunction',
                },
                {
                  path: '/books',
                  methods: ['PUT', 'DELETE'],
                  authType: 'open',
                  lambdaFunction: 'testFunction',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['testFunction', 'function']]),
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Check for specific HTTP methods
      expect(output).toContain('HttpMethod.GET');
      expect(output).toContain('HttpMethod.POST');
      expect(output).toContain('HttpMethod.PUT');
      expect(output).toContain('HttpMethod.DELETE');

      // Should not contain methods not specified
      expect(output).not.toContain('HttpMethod.PATCH');
      expect(output).not.toContain('HttpMethod.OPTIONS');
    });

    it('should generate IAM policy for all HttpApis', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'testFunction',
              paths: [
                {
                  path: '/items',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'testFunction',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['testFunction', 'function']]),
        },
        auth: {
          importFrom: './auth/resource',
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Check for IAM policy creation
      expect(output).toContain('Policy');
      expect(output).toContain('PolicyStatement');
      expect(output).toContain('execute-api:Invoke');
      expect(output).toContain('arnForExecuteApi');

      // Check for policy attachment
      expect(output).toContain('authenticatedUserIamRole');
      expect(output).toContain('unauthenticatedUserIamRole');
      expect(output).toContain('attachInlinePolicy');
    });

    it('should generate backend output for client configuration', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'testFunction',
              paths: [
                {
                  path: '/items',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'testFunction',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['testFunction', 'function']]),
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Check for backend output generation
      expect(output).toContain('backend.addOutput');
      expect(output).toContain('custom');
      expect(output).toContain('API');
      expect(output).toContain('endpoint');
      expect(output).toContain('region');
      expect(output).toContain('apiName');
    });

    it('should skip routes for non-existent functions', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'existingFunction', // Use existing function as default
              paths: [
                {
                  path: '/items',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'existingFunction',
                },
                {
                  path: '/missing',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'nonExistentFunction',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['existingFunction', 'function']]),
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Should contain route for existing function
      expect(output).toContain('/items');
      expect(output).toContain('existingFunction');

      // Should not contain route for non-existent function
      expect(output).not.toContain('/missing');
      expect(output).not.toContain('nonExistentFunction');
    });
  });
});
