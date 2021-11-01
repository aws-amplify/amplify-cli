import { FeatureFlags, pathManager, stateManager } from 'amplify-cli-core';


export async function updateTransformerVersion(env: string): Promise<void> {
  const projectPath = pathManager.findProjectRoot() ?? process.cwd();
  let envCLI = true;
  let cliJSON: any;
  try {
    cliJSON = stateManager.getCLIJSON(projectPath, env);
  }
  catch (e) {
    if (e.message.includes("File at path:") && e.message.includes("does not exist")) {
      envCLI = false;
      cliJSON = stateManager.getCLIJSON(projectPath);
    }
    else {
      throw e;
    }
  }
  if (!cliJSON.features) {
    cliJSON.features = {};
  }
  if (!cliJSON.features.graphqltransformer) {
    cliJSON.features.graphqltransformer = {}
  }
  cliJSON.features.graphqltransformer.useexperimentalpipelinedtransformer = true;
  cliJSON.features.graphqltransformer.transformerversion = 2;
  cliJSON.features.graphqltransformer.suppressSchemaMigrationPrompt = true;

  if (envCLI) {
    stateManager.setCLIJSON(projectPath, cliJSON, env);
  }
  else {
    stateManager.setCLIJSON(projectPath, cliJSON);
  }
  await FeatureFlags.reloadValues();
}
