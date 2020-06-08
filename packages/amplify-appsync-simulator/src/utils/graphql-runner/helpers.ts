import { DocumentNode, getOperationAST, OperationTypeNode } from 'graphql';

export const getOperationType = (document: DocumentNode, operationName?: string): OperationTypeNode => {
  const operationAST = getOperationAST(document, operationName);

  if (operationAST) {
    return operationAST.operation;
  }

  throw new Error('Could not get operation from the document');
};
