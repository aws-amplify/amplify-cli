import { ValueNode } from 'graphql';
import { scalars } from '../../schema/appsync-scalars';

describe('AWSTimestamp parseLiteral', () => {
  it('Returns literals as integers', () => {
    const astNode = { kind: 'IntValue', value: '1234', loc: { start: 68, end: 74 } } as ValueNode;
    expect(scalars.AWSTimestamp.parseLiteral(astNode, null)).toEqual(1234);
  });

  it('Rejects non-integer literals', () => {
    const astNode = { kind: 'StringValue', value: '1234', loc: { start: 68, end: 74 } } as ValueNode;

    expect(() => {
      scalars.AWSTimestamp.parseLiteral(astNode, null);
    }).toThrow('Can only validate integers but received: StringValue');
  });
});
