import getDirectives, { getValueFromValeNode } from '../../src/generator/getDirectives'
import { isType } from 'graphql'

describe('getDirectives', () => {
  it('should return an empty list if operation ast node is null', () => {
    const op = {
      astNode: null,
    }
    expect(getDirectives(op)).toEqual([])
  })
  it('should return directive list when operation has directives', () => {
    const op = {
      astNode: {
        directives: [
          {
            name: {
              value: 'aws_iam',
            },
            arguments: [],
          },
          {
            name: {
              value: 'oidc',
            },
            arguments: [],
          },
          {
            name: {
              value: 'public',
            },
            arguments: [],
          },
          {
            name: {
              value: 'cognito_auth',
            },
            arguments: [],
          },
        ],
      },
    }
    expect(getDirectives(op)).toEqual([
      { name: 'aws_iam', args: [] },
      { name: 'oidc', args: [] },
      { name: 'public', args: [] },
      { name: 'cognito_auth', args: [] },
    ])
  })
  it('should not include any directive that are not multiauth directives', () => {
    const op = {
      astNode: {
        directives: [
          {
            name: {
              value: 'foo',
            },
            arguments: [],
          },
        ],
      },
    }
    expect(getDirectives(op)).toEqual([])
  })
})

describe('getValueFromValeNode', () => {
  it('should return null when KIND is NULL_VALUE', () => {
    expect(
      getValueFromValeNode({
        kind: 'NullValue',
      })
    ).toBeNull()
  })
  it('should return a list when value is list type', () => {
    const val = {
      kind: 'ListValue',
      values: [
        {
          kind: 'StringValue',
          value: 'Foo',
        },
      ],
    }
    expect(getValueFromValeNode(val)).toEqual(['Foo'])
  })
  it('should return a Object when value is object type', () => {
    const val = {
      kind: 'ObjectValue',
      fields: [
        {
          name: {
            value: 'Foo',
          },
          value: {
            kind: 'StringValue',
            value: 'bar',
          },
        },
      ],
    }
    expect(getValueFromValeNode(val)).toEqual({ Foo: 'bar' })
  })

  it('should return a number when value is FloatValue', () => {
    const val = {
      kind: 'FloatValue',
      value: '22.2',
    }
    expect(getValueFromValeNode(val)).toEqual(22.2)
  })

  it('should return a number when value is IntValue', () => {
    const val = {
      kind: 'FloatValue',
      value: '22',
    }
    expect(getValueFromValeNode(val)).toEqual(22)
  })

  it('should return a number when value is boolean', () => {
    const val = {
      kind: 'BooleanValue',
      value: true,
    }
    expect(getValueFromValeNode(val)).toEqual(true)
  })
})
