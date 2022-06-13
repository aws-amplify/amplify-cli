import { nspawn as spawn, getCLIPath } from 'amplify-e2e-core';

type AddCodegenSettings = {
  ios?: boolean;
  android?: boolean;
  apiId?: string;
};

/**
 * Execute a `codegen add` command for testing purposes.
 * @param cwd working directory to execute the command in
 * @param settings configuration settings for the command
 */
export const addCodegen = (cwd: string, settings: AddCodegenSettings): Promise<void> => new Promise((resolve, reject) => {
  const commandParams = ['codegen', 'add'];
  if (settings.apiId) {
    commandParams.push('--apiId', settings.apiId);
  }
  const run = spawn(getCLIPath(), commandParams, { cwd, stripColors: true });
  if (!(settings.ios || settings.android)) {
    run.wait('Choose the code generation language target').sendCarriageReturn();
  }
  run
    .wait('Enter the file name pattern of graphql queries, mutations and subscriptions')
    .sendCarriageReturn()
    .wait('Do you want to generate/update all possible GraphQL operations')
    .sendConfirmYes()
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
