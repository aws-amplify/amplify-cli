import { GraphQLResolveInfo } from 'graphql';
import { createInfo } from '../../../velocity/util/info';

const stubInfo = {
  fieldName: 'someField',
  fieldNodes: [
    {
      kind: 'Field',
      name: {
        kind: 'Name',
        value: 'someField',
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: {
              kind: 'Name',
              value: 'otherField',
            },
          },
          {
            kind: 'Field',
            name: {
              kind: 'Name',
              value: 'someOtherField',
            },
            arguments: [
              {
                kind: 'Argument',
                name: {
                  kind: 'Name',
                  value: 'varName',
                },
                value: {
                  kind: 'Variable',
                  name: {
                    kind: 'Name',
                    value: 'foo',
                  },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: {
                    kind: 'Name',
                    value: 'subField',
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
  parentType: 'Query',
  variableValues: {
    foo: 'bar',
  },
} as unknown;
const mockInfo = stubInfo as GraphQLResolveInfo;

it('should generate a valid graphql info object', () => {
  const info = createInfo(mockInfo);
  expect(info).toEqual({
    fieldName: 'someField',
    variables: {
      foo: 'bar',
    },
    parentTypeName: 'Query',
    selectionSetList: ['otherField', 'someOtherField', 'someOtherField/subField'],
    selectionSetGraphQL: '{\n  otherField\n  someOtherField(varName: $foo) {\n    subField\n  }\n}',
  });
});
