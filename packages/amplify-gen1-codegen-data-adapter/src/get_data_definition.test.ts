import assert from 'node:assert';
import { Stack } from '@aws-sdk/client-cloudformation';
import { getDataDefinition, tableMappingKey } from './get_data_definition';

describe('Data definition', () => {
  it('parses the table mapping', () => {
    const stack: Stack = {
      Outputs: [
        {
          OutputKey: tableMappingKey,
          OutputValue: '{"hello":"world"}',
        },
      ],
    } as Stack;
    const result = getDataDefinition(stack);
    assert.equal(result.hello, 'world');
  });
});
