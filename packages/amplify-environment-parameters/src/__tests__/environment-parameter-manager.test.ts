/* eslint-disable spellcheck/spell-checker */
import { $TSContext } from 'amplify-cli-core';
import { ensureEnvParamManager } from '../../lib';

test('local testing', async () => {
  // eslint-disable-next-line spellcheck/spell-checker
  const projectPath = '/Users/foyleef/sandboxes/envvartest';
  // eslint-disable-next-line spellcheck/spell-checker
  process.chdir(projectPath);
  const contextStub = {
    amplify: {
      invokePluginMethod: jest.fn().mockReturnValue({ client: jest.fn() }),
    },
  } as unknown as $TSContext;
  const paramManager = (await ensureEnvParamManager(contextStub, 'dev')).instance;
  paramManager.setNonSecretResourceParam('somethingNew', 'aNewValue', 'function', 'envvartest97590510');
  console.log(JSON.stringify(paramManager.getResourceParams('funcion', 'envvartest97590510')));
  paramManager.save();
});
