import { nspawn as spawn, ExecutionContext, KEY_DOWN_ARROW, getCLIPath /* getProjectMeta, invokeFunction */ } from '../../src';
import { selectRuntime } from './lambda-function';

export function addLayer(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    let chain: ExecutionContext = spawn(getCLIPath(), ['add', 'function'], { cwd, stripColors: true })
      .wait('Select which capability you want to add:')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() // Layer
      .wait('Provide a name for your Lambda layer:')
      .sendCarriageReturn()
      .wait('Select up to 5 compatible runtimes:');

    // Choose runtime func goes here
    selectRuntime(chain, settings.runtime || 'nodejs');

    chain
      .wait('Who should have permission to use this layer?')
      .sendCarriageReturn() // Only current account TODO: generalize this in settings obj
      .wait('Next steps:') // TODO: Test all relevant text
      .wait('Move your libraries in the following folder:')
      .wait('Include any files you want to share across runtimes in this folder:')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
