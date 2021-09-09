import { replaceFnImport } from '../../disconnect-dependent-resources/disconnect-dependent-resources';

it('test replacefnimport', () => {
  const obj = {
    Handler: 'index.handler',
    FunctionName: {
      'Fn::If': [
        'ShouldNotCreateEnvResources',
        'uploadtestfd07b864',
        {
          'Fn::Join': [
            '',
            [
              'uploadtestfd07b864',
              '-',
              {
                Ref: 'env',
              },
            ],
          ],
        },
      ],
    },
    Environment: {
      Variables: {
        ENV: { Ref: 'env' },
        REGION: { Ref: 'AWS::Region' },
        API_UPLOADTEST_TODOTABLE_NAME: { 'Fn::ImportValue': { 'Fn::Sub': '${apiuploadtestGraphQLAPIIdOutput}:GetAtt:TodoTable:Name' } },
        API_UPLOADTEST_TODOTABLE_ARN: {
          'Fn::Join': [
            '',
            [
              'arn:aws:dynamodb:',
              { Ref: 'AWS::Region' },
              ':',
              { Ref: 'AWS::AccountId' },
              ':table/',
              { 'Fn::ImportValue': { 'Fn::Sub': '${apiuploadtestGraphQLAPIIdOutput}:GetAtt:TodoTable:Name' } },
            ],
          ],
        },
        API_UPLOADTEST_GRAPHQLAPIIDOUTPUT: { Ref: 'apiuploadtestGraphQLAPIIdOutput' },
      },
    },
    Role: { 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] },
    Runtime: 'nodejs14.x',
    Layers: [],
    Timeout: 25,
  };
  replaceFnImport(obj);
  console.log(JSON.stringify(obj, undefined, 2));
});
