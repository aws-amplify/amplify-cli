import assert from 'assert';
import { $TSObject } from 'amplify-cli-core';

export const pagedAWSCall = async <TAPIResult, TData, TNextToken, TParams = $TSObject>(
  action: (params: TParams, nextToken?: TNextToken) => Promise<TAPIResult>,
  params: TParams,
  accessor: (result?: TAPIResult) => TData[],
  getNextToken: (serviceResponse: TAPIResult, result: TData[]) => Promise<TNextToken | undefined>,
): Promise<TData[]> => {
  assert(action, 'missing argument: action');
  assert(accessor, 'missing argument: accessor');
  assert(getNextToken, 'missing argument: getNextToken');

  let result: TData[] = [];
  let response: TAPIResult;
  let nextToken: TNextToken = undefined;
  do {
    response = await action(params, nextToken);

    if (response && accessor(response)) {
      result = result.concat(accessor(response));
    }
    nextToken = response ? await getNextToken(response, result) : undefined;
  } while (!!nextToken);

  return result;
};
