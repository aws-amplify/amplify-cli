import { getFunctionDefinition } from '../../../../../../../../src/commands/gen2-migration/codegen-generate/src/adapters/functions/index';

describe('getFunctionDefinition', () => {
  test('entry defaults to ./index.js', () => {
    const definition = getFunctionDefinition(
      [
        {
          Handler: undefined,
          FunctionName: 'MyFunc',
        },
      ],
      [],
      new Map(),
      {
        function: {
          MyFunc: {
            service: 'Lambda',
            providerPlugin: 'awscloudformation',
            output: {
              Name: 'MyFunc',
            },
          },
        },
      },
    );

    expect(definition.length).toEqual(1);
    expect(definition[0].entry).toEqual('./index.js');
  });

  test('entry is derived from Handler', () => {
    const definition = getFunctionDefinition(
      [
        {
          Handler: 'index.handler',
          FunctionName: 'MyFunc',
        },
      ],
      [],
      new Map(),
      {
        function: {
          MyFunc: {
            service: 'Lambda',
            providerPlugin: 'awscloudformation',
            output: {
              Name: 'MyFunc',
            },
          },
        },
      },
    );

    expect(definition.length).toEqual(1);
    expect(definition[0].entry).toEqual('./index.js');
  });
});
