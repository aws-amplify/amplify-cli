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
            alias: {
              kind: 'Name',
              value: 'aliasedField',
            },
            name: {
              kind: 'Name',
              value: 'otherField',
            },
          },
          {
            kind: 'FragmentSpread',
            name: {
              kind: 'Name',
              value: 'fragment',
              loc: {
                start: 109,
                end: 117,
              },
            },
            directives: [],
            loc: {
              start: 106,
              end: 117,
            },
          },
          {
            kind: 'InlineFragment',
            typeCondition: {
              kind: 'NamedType',
              name: {
                kind: 'Name',
                value: 'FragmentType',
              },
            },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  alias: {
                    kind: 'Name',
                    value: 'aliasedInlineFragmentField',
                  },
                  name: {
                    kind: 'Name',
                    value: 'inlineFragmentField',
                  },
                },
                {
                  kind: 'Field',
                  name: {
                    kind: 'Name',
                    value: 'inlineFragmentField',
                  },
                },
              ],
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
                {
                  kind: 'Field',
                  alias: {
                    kind: 'Name',
                    value: 'aliasedSubField',
                  },
                  name: {
                    kind: 'Name',
                    value: 'subField',
                  },
                },
                {
                  kind: 'FragmentSpread',
                  name: {
                    kind: 'Name',
                    value: 'subfragment',
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
  fragments: {
    fragment: {
      kind: 'FragmentDefinition',
      name: {
        kind: 'Name',
        value: 'fragment',
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: {
              kind: 'Name',
              value: 'fragmentField',
            },
          },
          {
            kind: 'Field',
            alias: {
              kind: 'Name',
              value: 'aliasedFragmentField',
            },
            name: {
              kind: 'Name',
              value: 'fragmentField',
            },
          },
        ],
      },
    },
    subfragment: {
      kind: 'FragmentDefinition',
      name: {
        kind: 'Name',
        value: 'subfragment',
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: {
              kind: 'Name',
              value: 'subFragmentField',
            },
          },
        ],
      },
    },
  },
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
    selectionSetList: [
      'otherField',
      'aliasedField',
      'fragmentField',
      'aliasedFragmentField',
      'aliasedInlineFragmentField',
      'inlineFragmentField',
      'someOtherField',
      'someOtherField/subField',
      'someOtherField/aliasedSubField',
      'someOtherField/subFragmentField',
    ],
    selectionSetGraphQL:
      '{\n  otherField\n  aliasedField: otherField\n  ...fragment\n  ... on FragmentType {\n    aliasedInlineFragmentField: inlineFragmentField\n    inlineFragmentField\n  }\n  someOtherField(varName: $foo) {\n    subField\n    aliasedSubField: subField\n    ...subfragment\n  }\n}',
  });
});
