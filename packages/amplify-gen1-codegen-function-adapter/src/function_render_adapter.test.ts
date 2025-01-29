import assert from 'node:assert';
import { getFunctionDefinition } from './function_render_adapter';
import { FunctionConfiguration } from '@aws-sdk/client-lambda';

void describe('function codegen', () => {
  void describe('Function definition', () => {
    void it('sets the correct function configuration', () => {
      const configurations: FunctionConfiguration[] = [];
      const functionConf1: FunctionConfiguration = {};
      functionConf1.FunctionName = 'function1';
      functionConf1.Runtime = 'nodejs18.x';
      functionConf1.Handler = 'index.handler';
      functionConf1.Timeout = 3;
      functionConf1.MemorySize = 128;
      functionConf1.Environment = { Variables: { ENV: 'dev', REGION: 'us-west-2' } };
      configurations.push(functionConf1);

      const result = getFunctionDefinition(configurations, new Map([['function1', 'function']]), {
        function: {
          'function1': {
            providerPlugin: 'awscloudformation',
            service: 'Lambda',
            output: {
              Name: 'function1'
            }
          },
          'function2': {
            providerPlugin: 'awscloudformation',
            service: 'Lambda',
            output: {

              Name: 'function2'
            }
          }
        },
      });

      for (const func of result) {
        assert.equal(func.runtime, 'nodejs18.x');
        assert.equal(func.timeoutSeconds, 3);
        assert.equal(func.memoryMB, 128);
        assert.deepEqual(func.environment, { Variables: { ENV: 'dev', REGION: 'us-west-2' } });
        assert.equal(func.entry, 'index.handler');
      }
    });
  });
});
