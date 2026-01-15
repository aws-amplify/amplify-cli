import { generateLambdaEnvVars } from './lambda_env_generator';
import ts from 'typescript';

describe('generateLambdaEnvVars', () => {
  const printer = ts.createPrinter();

  it('generates API GraphQL endpoint escape hatch', () => {
    const envVars = { API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT: 'https://example.com' };
    const result = generateLambdaEnvVars('myFunction', envVars);

    expect(result).toHaveLength(1);
    const code = printer.printNode(ts.EmitHint.Unspecified, result[0], ts.createSourceFile('', '', ts.ScriptTarget.Latest));
    expect(code).toMatchSnapshot();
  });

  it('generates API key escape hatch with non-null assertion', () => {
    const envVars = { API_TESTAPP_GRAPHQLAPIKEYOUTPUT: 'da2-xyz' };
    const result = generateLambdaEnvVars('myFunction', envVars);

    const code = printer.printNode(ts.EmitHint.Unspecified, result[0], ts.createSourceFile('', '', ts.ScriptTarget.Latest));
    expect(code).toBe('backend.myFunction.addEnvironment("API_TESTAPP_GRAPHQLAPIKEYOUTPUT", backend.data.apiKey!);');
  });

  it('generates auth user pool escape hatch', () => {
    const envVars = { AUTH_TESTAPP_USERPOOLID: 'us-east-1_ABC123' };
    const result = generateLambdaEnvVars('myFunction', envVars);

    const code = printer.printNode(ts.EmitHint.Unspecified, result[0], ts.createSourceFile('', '', ts.ScriptTarget.Latest));
    expect(code).toBe('backend.myFunction.addEnvironment("AUTH_TESTAPP_USERPOOLID", backend.auth.resources.userPool.userPoolId);');
  });

  it('generates storage table escape hatch with table name extraction', () => {
    const envVars = { STORAGE_TODOTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/todo' };
    const result = generateLambdaEnvVars('myFunction', envVars);

    const code = printer.printNode(ts.EmitHint.Unspecified, result[0], ts.createSourceFile('', '', ts.ScriptTarget.Latest));
    expect(code).toBe('backend.myFunction.addEnvironment("STORAGE_TODOTABLE_ARN", todo.tableArn);');
  });

  it('generates S3 bucket escape hatch', () => {
    const envVars = { STORAGE_S32F16FFE0_BUCKETNAME: 'my-bucket' };
    const result = generateLambdaEnvVars('myFunction', envVars);

    const code = printer.printNode(ts.EmitHint.Unspecified, result[0], ts.createSourceFile('', '', ts.ScriptTarget.Latest));
    expect(code).toBe('backend.myFunction.addEnvironment("STORAGE_S32F16FFE0_BUCKETNAME", backend.storage.resources.bucket.bucketName);');
  });

  it('generates function name escape hatch with function name extraction', () => {
    const envVars = { FUNCTION_TESTAPP9725C797_NAME: 'testapp9725c797-dev' };
    const result = generateLambdaEnvVars('myFunction', envVars);

    const code = printer.printNode(ts.EmitHint.Unspecified, result[0], ts.createSourceFile('', '', ts.ScriptTarget.Latest));
    expect(code).toBe(
      'backend.myFunction.addEnvironment("FUNCTION_TESTAPP9725C797_NAME", backend.testapp9725c797.resources.lambda.functionName);',
    );
  });

  it('ignores non-matching environment variables', () => {
    const envVars = { CUSTOM_VAR: 'value', REGION: 'us-east-1' };
    const result = generateLambdaEnvVars('myFunction', envVars);

    expect(result).toHaveLength(0);
  });

  it('generates multiple escape hatches snapshot', () => {
    const envVars = {
      API_TESTAPP_GRAPHQLAPIENDPOINTOUTPUT: 'https://example.com',
      AUTH_TESTAPP_USERPOOLID: 'us-east-1_ABC123',
      STORAGE_TODOTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/todo',
      FUNCTION_TESTAPP9725C797_NAME: 'testapp9725c797-dev',
    };
    const result = generateLambdaEnvVars('S3Trigger', envVars);

    const code = result
      .map((stmt) => printer.printNode(ts.EmitHint.Unspecified, stmt, ts.createSourceFile('', '', ts.ScriptTarget.Latest)))
      .join('\n');
    expect(code).toMatchSnapshot();
  });

  describe('snapshots', () => {
    it('matches snapshot for all supported environment variable patterns', () => {
      const envVars = {
        API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT: 'https://example.com',
        API_TESTAPP_GRAPHQLAPIIDOUTPUT: 'abc123',
        API_TESTAPP_GRAPHQLAPIKEYOUTPUT: 'da2-xyz',
        AUTH_TESTAPP_USERPOOLID: 'us-east-1_ABC123',
        STORAGE_TODOTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/todo',
        STORAGE_COUNTSTABLE_NAME: 'counts-table',
        STORAGE_TODOTABLE_STREAMARN: 'arn:aws:dynamodb:us-east-1:123:table/todo/stream',
        STORAGE_S32F16FFE0_BUCKETNAME: 'my-bucket',
        FUNCTION_TESTAPP9725C797_NAME: 'testapp9725c797-dev',
      };
      const result = generateLambdaEnvVars('S3Trigger', envVars);

      const generatedCode = result.map((stmt) =>
        printer.printNode(ts.EmitHint.Unspecified, stmt, ts.createSourceFile('', '', ts.ScriptTarget.Latest)),
      );

      expect(generatedCode).toMatchSnapshot();
    });
  });
});
