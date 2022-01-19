import { $TSAny, FeatureFlags, pathManager, stateManager } from 'amplify-cli-core';
import _ from 'lodash';

export const updateTransformerVersion = async (env?: string): Promise<void> => {
  const mutation = (cliJSON: $TSAny) => {
    _.set(cliJSON, ['features', 'graphqltransformer', 'useexperimentalpipelinedtransformer'], true);
    _.set(cliJSON, ['features', 'graphqltransformer', 'transformerversion'], 2);
    _.set(cliJSON, ['features', 'graphqltransformer', 'suppressschemamigrationprompt'], true);
  };
  await mutateCliJsonFile(mutation, env);
};

export const revertTransformerVersion = async (env?: string): Promise<void> => {
  const mutation = (cliJSON: $TSAny) => {
    _.set(cliJSON, ['features', 'graphqltransformer', 'useexperimentalpipelinedtransformer'], false);
    _.set(cliJSON, ['features', 'graphqltransformer', 'transformerversion'], 1);
    _.set(cliJSON, ['features', 'graphqltransformer', 'suppressschemamigrationprompt'], false);
    _.set(cliJSON, ['features', 'codegen', 'useappsyncmodelgenplugin'], true);
  };
  await mutateCliJsonFile(mutation, env);
};

const mutateCliJsonFile = async (mutation: (cliObj: $TSAny) => void, env?: string): Promise<void> => {
  const projectPath = pathManager.findProjectRoot() ?? process.cwd();
  let envCLI = true;
  let cliJSON;
  if (env) {
    cliJSON = stateManager.getCLIJSON(projectPath, env, { throwIfNotExist: false });
  }
  if (!cliJSON) {
    envCLI = false;
    cliJSON = stateManager.getCLIJSON(projectPath);
  }
  mutation(cliJSON);
  stateManager.setCLIJSON(projectPath, cliJSON, envCLI ? env : undefined);
  await FeatureFlags.reloadValues();
};
