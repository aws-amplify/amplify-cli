import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import execa from 'execa';
import * as e2eCore from '.';

/**
 * Mocks `getCLIpath` with the path to a specific version of Amplify.
 *
 * Ideally we could use this in migration tests directly without spying on getCLIPath but that's going to require a larger test refactoring
 *
 * Be careful if using this class with test.concurrent as one test may step on the version of another test.
 */
class CLIVersionController {
  #getCLIPathSpy: jest.SpyInstance<string>;
  /**
   * All CLI calls (that use getCLIVersion) will use the specified CLI version
   */
  useCliVersion = async (version: string) => {
    const overridePath = await this.getCLIVersionPath(version);
    this.#getCLIPathSpy = jest.spyOn(e2eCore, 'getCLIPath');
    this.#getCLIPathSpy.mockReturnValue(overridePath);
  };

  /**
   * Resets getCLIVersion to its original implementation
   */
  resetCliVersion = () => {
    if (this.#getCLIPathSpy) {
      this.#getCLIPathSpy.mockRestore();
    }
  };

  private getCLIVersionPath = async (version: string) => {
    const versioningRoot = path.join(os.homedir(), '.amplify', 'versions');
    await fs.ensureDir(versioningRoot);
    const relativePathToAmplfiy = path.join('node_modules', '@aws-amplify', 'cli', 'bin', 'amplify');
    const versionRoot = path.join(versioningRoot, version);
    const versionPath = path.join(versionRoot, relativePathToAmplfiy);
    if (fs.existsSync(versionPath)) {
      return versionPath;
    }
    // need to install the specified version
    await execa('npm', ['install', '--prefix', versionRoot, `@aws-amplify/cli@${version}`]);
    return versionPath;
  };
}

export const cliVersionController = new CLIVersionController();
