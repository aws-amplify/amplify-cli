import { GraphQLResolveInfo, SelectionNode } from 'graphql';
import { print } from 'graphql/language/printer';

const getSelectionSet = (nodes: readonly SelectionNode[], prefix: string = null) => {
  return nodes.reduce((selectionSetList: string[], node) => {
    if (node.kind == 'Field') {
      const name = prefix ? `${prefix}/${node.name.value}` : node.name.value;
      selectionSetList.push(name);
      if (node.selectionSet) {
        selectionSetList.push(...getSelectionSet(node.selectionSet.selections, name));
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
