import {
  DescribeStackResourcesCommand,
  DescribeStackResourcesCommandInput,
  UpdateStackCommand,
  DescribeStacksCommand,
  DescribeStacksCommandInput,
  UpdateStackCommandInput,
  CreateStackRefactorCommandInput,
  ExecuteStackRefactorCommandInput,
  DescribeStackRefactorCommandInput,
  CreateStackRefactorCommand, ExecuteStackRefactorCommand, DescribeStackRefactorCommand,
} from '@aws-sdk/client-cloudformation';

type CFNCommand = DescribeStackResourcesCommand | DescribeStacksCommand | UpdateStackCommand;
type CFNCommandType = typeof DescribeStackResourcesCommand | typeof DescribeStacksCommand | typeof UpdateStackCommand | typeof CreateStackRefactorCommand | typeof ExecuteStackRefactorCommand | typeof DescribeStackRefactorCommand;
type CFNCommandInput =
  | DescribeStackResourcesCommandInput
  | DescribeStacksCommandInput
  | UpdateStackCommandInput
  | CreateStackRefactorCommandInput
  | ExecuteStackRefactorCommandInput
  | DescribeStackRefactorCommandInput;

export const toBeACloudFormationCommand = (actual: [CFNCommand], expectedInput: CFNCommandInput, expectedType: CFNCommandType) => {
  const actualInstance = actual[0];
  expect(actualInstance.input).toEqual(expectedInput);
  const constructorName = actualInstance.constructor.name;
  const pass = constructorName === expectedType.prototype.constructor.name;

  return {
    pass,
    message: () => `expected ${actual} to be instance of ${constructorName}`,
  };
};

declare global {
  // Needed for custom matchers.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeACloudFormationCommand(expectedInput: CFNCommandInput, expectedType: CFNCommandType): R;
    }
  }
}
