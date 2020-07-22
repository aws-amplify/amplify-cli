import { GraphQLResolveInfo, SelectionNode } from 'graphql';
import { print } from 'graphql/language/printer';

export function createInfo(info: GraphQLResolveInfo) {
  const getSelectionSet = (nodes: readonly SelectionNode[], prefix: string = null) => {
    return nodes.reduce((selectionSetList: string[], node) => {
      if (node.kind == 'Field') {
        const aliasOrName = (node.alias || node.name).value;
        const name = prefix ? `${prefix}/${aliasOrName}` : aliasOrName;
        selectionSetList.push(name);
        if (node.selectionSet) {
          selectionSetList.push(...getSelectionSet(node.selectionSet.selections, name));
        }
      } else if (node.kind === 'InlineFragment' || node.kind === 'FragmentSpread') {
        const fragment = node.kind === 'FragmentSpread' ? info.fragments[node.name.value] : node;
        if (fragment && fragment.selectionSet) {
          selectionSetList.push(...getSelectionSet(fragment.selectionSet.selections, prefix));
        }
      }

      return selectionSetList;
    }, []);
  };
  let selectionSetGraphQL = '';
  let selectionSetList = [];

  const fieldNode = info.fieldNodes.find(f => f.name.value === info.fieldName);
  if (fieldNode && fieldNode.selectionSet) {
    const query = print(fieldNode);
    selectionSetGraphQL = query.substr(query.indexOf('{'));
    selectionSetList = getSelectionSet(fieldNode.selectionSet.selections);
  }

  return {
    fieldName: info.fieldName,
    variables: info.variableValues,
    parentTypeName: info.parentType,
    selectionSetList,
    selectionSetGraphQL,
  };
}
