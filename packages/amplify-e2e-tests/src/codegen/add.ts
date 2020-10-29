import { nspawn as spawn, getCLIPath } from 'amplify-e2e-core';

export function addCodegen(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    const run = spawn(getCLIPath(), ['codegen', 'add'], { cwd, stripColors: true });
    if (!(settings.ios || settings.android)) {
      run.wait('Choose the code generation language target').sendCarriageReturn();
    }
    run
      .wait('Enter the file name pattern of graphql queries, mutations and subscriptions')
      .sendCarriageReturn()
      .wait('Do you want to generate/update all possible GraphQL operations')
      .sendLine('y')
      .wait('Enter maximum statement depth [increase from default if your schema is deeply')
      .sendCarriageReturn();
    if (settings.ios) {
      run
        .wait('Enter the file name for the generated code')
        .sendCarriageReturn()
        .wait('Do you want to generate code for your newly created GraphQL API')
        .sendCarriageReturn();
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
