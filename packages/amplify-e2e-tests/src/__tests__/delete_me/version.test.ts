import { nspawn as spawn, getCLIPath, multiSelect } from '@aws-amplify/amplify-e2e-core';

describe('delete me', () => {
  it('version', async () => {
    await testVersion();
  });
});

const testVersion = async () => {
  const chain = spawn(getCLIPath(false), ['version'], { stripColors: true });
  chain.wait('Test me?').sendConfirmYes();

  chain.wait('Pick one or more').wait('(Use <space> to select, <ctrl + a> to toggle all)');

  multiSelect(chain, ['two'], ['one', 'two', 'three']);

  await chain.wait('You selected two').runAsync();
};
