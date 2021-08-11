import { getCLIPath, nspawn as spawn } from '..';

export function amplifyPull(
  cwd: string,
  settings: { override?: boolean; emptyDir?: boolean; appId?: string; withRestore?: boolean; noUpdateBackend?: boolean },
): Promise<void> {
  return new Promise((resolve, reject) => {
    //Note:- Table checks have been removed since they are not necessary for push/pull flows and prone to breaking because
    //of stylistic changes. A simpler content based check will be added in the future.
    const args = ['pull'];

    if (settings.appId) {
      args.push('--appId', settings.appId);
    }

    if (settings.withRestore) {
      args.push('--restore');
    }

    const chain = spawn(getCLIPath(), args, { cwd, stripColors: true });

    if (settings.emptyDir) {
      chain
        .wait('Select the authentication method you want to use:')
        .sendCarriageReturn()
        .wait('Please choose the profile you want to use')
        .sendCarriageReturn()
        .wait('Choose your default editor:')
        .sendCarriageReturn()
        .wait("Choose the type of app that you're building")
        .sendCarriageReturn()
        .wait('What javascript framework are you using')
        .sendCarriageReturn()
        .wait('Source Directory Path:')
        .sendCarriageReturn()
        .wait('Distribution Directory Path:')
        .sendCarriageReturn()
        .wait('Build Command:')
        .sendCarriageReturn()
        .wait('Start Command:')
        .sendCarriageReturn()
        .wait('Do you plan on modifying this backend?')
        .sendLine(settings.noUpdateBackend ? 'n' : 'y');
    } else if (!settings.noUpdateBackend) {
      chain.wait('Pre-pull status').wait('Current Environment');
    }

    if (settings.override) {
      chain
        .wait('Local changes detected')
        .wait('Pulling changes from the cloud will override your local changes')
        .wait('Are you sure you would like to continue')
        .sendLine('y');
    }

    if (settings.noUpdateBackend) {
      chain.wait('Added backend environment config object to your project.').wait("Run 'amplify pull' to sync future upstream changes.");
    } else if (settings.emptyDir) {
      chain.wait(/Successfully pulled backend environment .+ from the cloud\./).wait("Run 'amplify pull' to sync future upstream changes.");
    } else {
      chain.wait('Post-pull status').wait('Current Environment');
    }

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        console.error(err);
        reject(err);
      }
    });
  });
}

export function amplifyPullSandbox(cwd: string, settings: { sandboxId: string; appType: string; framework: string }) {
  return new Promise((resolve, reject) => {
    const args = ['pull', '--sandboxId', settings.sandboxId];

    spawn(getCLIPath(), args, { cwd, stripColors: true })
      .wait('What type of app are you building')
      .sendKeyUp()
      .sendLine(settings.appType)
      .wait('What javascript framework are you using')
      .sendLine(settings.framework)
      .wait('Successfully generated models.')
      .run((err: Error) => {
        if (!err) {
          resolve({});
        } else {
          reject(err);
        }
      });
  });
}
