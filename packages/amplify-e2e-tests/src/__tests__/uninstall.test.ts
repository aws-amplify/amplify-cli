import { pathManager } from 'amplify-cli-core';
import { createLinkWithCache } from 'aws-appsync';
import execa from 'execa';
import * as fs from 'fs-extra';
import which from 'which';

describe('amplify uninstall', () => {
  /**
   * NOTE: This test has side effetcs! It will remove the global amplify installation and wipe out the ~/.amplify directory
   * This is okay on CircleCI because each test suite runs in a separate box, but if you are running this test locally,
   * you will need to reinstall your global CLI instance.
   */
  it('amplify is unavailable after uninstall', async () => {
    // check amplify is available initially
    try {
      const { stderr: beforeError } = await execa.command('amplify version');
      if (beforeError) {
        throw new Error(`There's an issue with the amplify installation. [${beforeError}]`);
      }
    } catch (err) {
      throw new Error(`Initial amplify installation check failed with [${err}]`);
    }
    const { stderr: uninstallError, stdout: uninstallStdout } = await execa.command('amplify uninstall --yes');
    if (uninstallError) {
      throw new Error(`amplify uninstall command failed with [${uninstallError}]`);
    }
    expect(uninstallStdout.includes('Uninstalled the Amplify CLI')).toBe(true);
    await expect(which('amplify')).rejects.toMatchInlineSnapshot(`[Error: not found: amplify]`);
    // expect ~/.amplify to be deleted
    expect(fs.pathExistsSync(pathManager.getHomeDotAmplifyDirPath())).toBe(false);
  });
});
