import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export function addCodegen(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    const run = nexpect.spawn(getCLIPath(), ['codegen', 'add'], { cwd, stripColors: true, verbose });
    if (!(settings.ios || settings.android)) {
      run.wait('Choose the code generation language target').sendline('');
    }
    run
      .wait('Enter the file name pattern of graphql queries, mutations and subscriptions')
      .sendline('\r')
      .wait('Do you want to generate/update all possible GraphQL operations')
      .sendline('Yes')
      .wait('Enter maximum statement depth [increase from default if your schema is deeply')
      .sendline('\r');
    if (settings.ios) {
      run
        .wait('Enter the file name for the generated code')
        .sendline('\r')
        .wait('Do you want to generate code for your newly created GraphQL API')
        .sendline('\r');
    }
    run.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
