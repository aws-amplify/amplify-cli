import { ASTCodeTransformer } from '../../../../../commands/gen2-migration/codegen-custom-resources/transformer/ast-code-transformer';
import { ParsedStack } from '../../../../../commands/gen2-migration/codegen-custom-resources/types';

describe('ASTCodeTransformer', () => {
  let transformer: ASTCodeTransformer;

  beforeEach(() => {
    transformer = new ASTCodeTransformer();
  });

  describe('CDK Function Reference Variations', () => {
    it('should handle cdk.Fn.ref with single quotes', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `const name = \`resource-\${cdk.Fn.ref('env')}\`;`,
        outputs: [],
        hasAmplifyHelpers: false,
        hasResourceDependency: false,
      };

      const result = transformer.transform(parsed, 'notifications');
      expect(result.constructorBody).toContain('process.env.AMPLIFY_ENV');
    });

    it('should handle cdk.Fn.ref with double quotes', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `const name = \`resource-\${cdk.Fn.ref("env")}\`;`,
        outputs: [],
        hasAmplifyHelpers: false,
        hasResourceDependency: false,
      };

      const result = transformer.transform(parsed, 'notifications');
      expect(result.constructorBody).toContain('process.env.AMPLIFY_ENV');
    });

    it('should handle Fn.ref without cdk prefix', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `const name = \`resource-\${Fn.ref('env')}\`;`,
        outputs: [],
        hasAmplifyHelpers: false,
        hasResourceDependency: false,
      };

      const result = transformer.transform(parsed, 'notifications');
      expect(result.constructorBody).toContain('process.env.AMPLIFY_ENV');
    });

    it('should ignore cdk.Fn.ref in comments', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `
          // This uses cdk.Fn.ref('env') for environment
          const name = 'static-name';
        `,
        outputs: [],
        hasAmplifyHelpers: false,
        hasResourceDependency: false,
      };

      const result = transformer.transform(parsed, 'notifications');
      expect(result.constructorBody).not.toContain('process.env.AMPLIFY_ENV');
      expect(result.constructorBody).toContain('static-name');
    });
  });

  describe('Complex AmplifyHelpers Scenarios', () => {
    it('should handle conditional AmplifyHelpers calls', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `
          const resources = condition ? 
            AmplifyHelpers.addResourceDependency(this, 'auth', 'userPool', []) :
            [];
        `,
        outputs: [],
        hasAmplifyHelpers: true,
        hasResourceDependency: true,
      };

      const result = transformer.transform(parsed, 'notifications');
      expect(result.constructorBody).toContain('TODO: Manual migration required');
    });

    it('should handle nested AmplifyHelpers.getProjectInfo calls', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `
          const config = {
            name: AmplifyHelpers.getProjectInfo().projectName,
            env: AmplifyHelpers.getProjectInfo().envName
          };
        `,
        outputs: [],
        hasAmplifyHelpers: true,
        hasResourceDependency: false,
      };

      const result = transformer.transform(parsed, 'notifications');
      expect(result.constructorBody).toContain('process.env.AMPLIFY_PROJECT_NAME');
    });

    it('should handle dynamic method calls on AmplifyHelpers', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `
          const methodName = 'getProjectInfo';
          const info = AmplifyHelpers[methodName]();
        `,
        outputs: [],
        hasAmplifyHelpers: true,
        hasResourceDependency: false,
      };

      const result = transformer.transform(parsed, 'notifications');
      // Should preserve dynamic calls as they can't be statically analyzed
      expect(result.constructorBody).toContain('AmplifyHelpers[methodName]');
    });
  });

  describe('Complex CDK Constructs', () => {
    it('should handle multiple CfnParameter declarations', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `
          new cdk.CfnParameter(this, 'env', { type: 'String' });
          new cdk.CfnParameter(this, 'region', { type: 'String' });
          const bucket = new s3.Bucket(this, 'MyBucket');
        `,
        outputs: [],
        hasAmplifyHelpers: false,
        hasResourceDependency: false,
      };

      const result = transformer.transform(parsed, 'notifications');
      expect(result.constructorBody).not.toContain('CfnParameter');
      expect(result.constructorBody).toContain('s3.Bucket');
    });

    it('should handle complex expressions with CDK functions', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `
          const bucketName = \`\${AmplifyHelpers.getProjectInfo().projectName}-\${cdk.Fn.ref('env')}-bucket\`;
          const policy = {
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Resource: \`arn:aws:s3:::\${bucketName}/*\`
            }]
          };
        `,
        outputs: [],
        hasAmplifyHelpers: true,
        hasResourceDependency: false,
      };

      const result = transformer.transform(parsed, 'notifications');
      expect(result.constructorBody).toContain('process.env.AMPLIFY_PROJECT_NAME');
      expect(result.constructorBody).toContain('process.env.AMPLIFY_ENV');
    });
  });

  describe('Real-World Edge Cases', () => {
    it('should handle cross-stack references', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `
          const authStack = AmplifyHelpers.addResourceDependency(this, 'auth', 'userPool', []);
          const userPoolId = authStack.userPool.userPoolId;
          const apiGateway = new apigateway.RestApi(this, 'API', {
            defaultCorsPreflightOptions: {
              allowOrigins: [authStack.userPoolDomain]
            }
          });
        `,
        outputs: [],
        hasAmplifyHelpers: true,
        hasResourceDependency: true,
      };

      const result = transformer.transform(parsed, 'notifications');
      expect(result.constructorBody).toContain('TODO: Manual migration required');
    });

    it('should handle conditional resource creation', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `
          const isProd = cdk.Fn.ref('env') === 'prod';
          if (isProd) {
            new cloudwatch.Alarm(this, 'ProdAlarm', {
              metric: lambda.metricErrors(),
              threshold: 1
            });
          }
        `,
        outputs: [],
        hasAmplifyHelpers: false,
        hasResourceDependency: false,
      };

      const result = transformer.transform(parsed, 'notifications');
      expect(result.constructorBody).toContain('process.env.AMPLIFY_ENV');
    });

    it('should preserve complex TypeScript syntax', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `
          interface Config {
            name: string;
            env: string;
          }
          
          const config: Config = {
            name: AmplifyHelpers.getProjectInfo().projectName,
            env: cdk.Fn.ref('env')
          };
          
          const resources = Object.entries(config).map(([key, value]) => 
            new cdk.CfnOutput(this, key, { value })
          );
        `,
        outputs: [],
        hasAmplifyHelpers: true,
        hasResourceDependency: false,
      };

      const result = transformer.transform(parsed, 'notifications');
      expect(result.constructorBody).toContain('interface Config');
      expect(result.constructorBody).toContain('process.env.AMPLIFY_PROJECT_NAME');
      expect(result.constructorBody).toContain('process.env.AMPLIFY_ENV');
    });
  });

  describe('Error Resilience', () => {
    it('should handle malformed code gracefully', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: `
          const incomplete = cdk.Fn.ref(
          // Missing closing parenthesis and argument
        `,
        outputs: [],
        hasAmplifyHelpers: false,
        hasResourceDependency: false,
      };

      expect(() => transformer.transform(parsed, 'notifications')).not.toThrow();
    });

    it('should handle empty constructor body', () => {
      const parsed: ParsedStack = {
        className: 'cdkStack',
        imports: [],
        constructorBody: '',
        outputs: [],
        hasAmplifyHelpers: false,
        hasResourceDependency: false,
      };

      const result = transformer.transform(parsed, 'notifications');
      expect(result.className).toBe('NotificationsStack');
      expect(result.constructorBody).toBeDefined();
    });
  });
});
