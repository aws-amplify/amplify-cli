import { GraphQLResolveInfo, SelectionNode } from 'graphql';
import { print } from 'graphql/language/printer';

const getSelectionSet = (nodes: readonly SelectionNode[], info, prefix: string = null) => {
  return nodes.reduce((selectionSetList: string[], node) => {
    if (node.kind == 'Field') {
      const aliasOrNameField = node.alias || node.name;
      const name = prefix ? `${prefix}/${aliasOrNameField.value}` : aliasOrNameField.value;
      selectionSetList.push(name);
      if (node.selectionSet) {
        selectionSetList.push(...getSelectionSet(node.selectionSet.selections, info, name));
      }
    } else if (node.kind === 'InlineFragment' || node.kind === 'FragmentSpread') {
      const fragment = node.kind === 'FragmentSpread' ? info.fragments[node.name.value] : node;
      if (fragment && fragment.selectionSet) {
        selectionSetList.push(...getSelectionSet(fragment.selectionSet.selections, info, prefix));
      }
    }

    return selectionSetList;
  }, []);
};

export function createInfo(info: GraphQLResolveInfo) {
  let selectionSetGraphQL = '';
  let selectionSetList = [];

  const fieldNode = info.fieldNodes.find(f => f.name.value === info.fieldName);
  if (fieldNode && fieldNode.selectionSet) {
    const query = print(fieldNode);
    selectionSetGraphQL = query.substr(query.indexOf('{'));
    selectionSetList = getSelectionSet(fieldNode.selectionSet.selections, info);
  }

  return {
    fieldName: info.fieldName,
    variables: info.variableValues,
    parentTypeName: info.parentType,
    selectionSetList,
    selectionSetGraphQL,
  };
}
