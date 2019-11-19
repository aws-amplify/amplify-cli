import { Kind, TypeNode } from 'graphql';

export function withNamedNodeNamed(t: TypeNode, n: string): TypeNode {
  switch (t.kind) {
    case Kind.NON_NULL_TYPE:
      return {
        ...t,
        type: withNamedNodeNamed(t.type, n),
      } as TypeNode;
    case Kind.LIST_TYPE:
      return {
        ...t,
        type: withNamedNodeNamed(t.type, n),
      } as TypeNode;
    case Kind.NAMED_TYPE:
      return {
        ...t,
        name: {
          kind: Kind.NAME,
          value: n,
        },
      };
  }
}
