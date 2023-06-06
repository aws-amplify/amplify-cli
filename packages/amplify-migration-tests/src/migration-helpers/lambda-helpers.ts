import {
  ExecutionContext,
  FunctionRuntimes,
  getRuntimeDisplayName,
  getTemplateChoices,
  moveUp,
  runtimeChoices,
  singleSelect,
} from '@aws-amplify/amplify-e2e-core';

export const selectRuntimePreV12 = (chain: ExecutionContext, runtime: FunctionRuntimes) => {
  const runtimeName = getRuntimeDisplayName(runtime);
  chain.wait('Choose the runtime that you want to use:');

  // reset cursor to top of list because node is default but it throws off offset calculations
  moveUp(chain, runtimeChoices.indexOf(getRuntimeDisplayName('nodejs')));

  singleSelect(chain, runtimeName, runtimeChoices);
};

export const selectTemplatePreV12 = (chain: ExecutionContext, functionTemplate: string, runtime: FunctionRuntimes) => {
  const templateChoices = getTemplateChoices(runtime);
  chain.wait('Choose the function template that you want to use');

  // reset cursor to top of list because Hello World is default but it throws off offset calculations
  moveUp(chain, templateChoices.indexOf('Hello World'));

  singleSelect(chain, functionTemplate, templateChoices);
};
