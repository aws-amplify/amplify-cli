import { execSync } from 'child_process';
import yargs from 'yargs';

type ProcessArgs = {
  version: string;
  excludeGithub: boolean;
};
const githubBinaries = ['amplify-pkg-linux-arm64.tgz', 'amplify-pkg-linux.tgz', 'amplify-pkg-macos.tgz', 'amplify-pkg-win.exe.tgz'];
const parseArgs = async (): Promise<ProcessArgs> => {
  const args = yargs(process.argv.slice(2))
    .version(false)
    .options({
      v: { alias: 'version', type: 'string', demandOption: true },
      'exclude-github': { type: 'boolean', default: false },
    })
    .parseSync();

  return { version: args.v, excludeGithub: args['exclude-github'] };
};

const existsInNpm = (version: string): boolean => {
  try {
    execSync(`npm show @aws-amplify/cli@${version}`, {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
};
const existsInGitHub = async (version: string): Promise<boolean> => {
  const buildUrl = (binary: string) => `https://github.com/aws-amplify/amplify-cli/releases/download/v${version}/${binary}`;
  const responses = await Promise.all(githubBinaries.map((binary) => fetch(buildUrl(binary), { method: 'HEAD' })));
  const responseStatuses = responses.map((r) => r.status);
  return responseStatuses.every((s) => s === 200);
};

const s3Binaries = ['amplify-pkg-linux-arm64.tgz', 'amplify-pkg-linux-x64.tgz', 'amplify-pkg-macos-x64.tgz', 'amplify-pkg-win-x64.tgz'];
const existsInS3 = async (version: string): Promise<boolean> => {
  const buildUrl = (binary: string) => `https://package.cli.amplify.aws/${version}/${binary}`;
  const responses = await Promise.all(s3Binaries.map((b) => fetch(buildUrl(b))));
  const responseStatuses = responses.map((r) => r.status);
  return responseStatuses.every((s) => s === 200);
};

const main = async () => {
  const { version, excludeGithub } = await parseArgs();
  console.log(`#### Verifying version ${version} deployed correctly ####`);
  const isGitHubSatisfied = excludeGithub || (await existsInGitHub(version));
  if (!isGitHubSatisfied) {
    console.error('Release not found in GitHub');
    process.exit(1);
  }
  if (!existsInNpm(version)) {
    console.error('Release not found in NPM');
    process.exit(1);
  }
  if (!(await existsInS3(version))) {
    console.error('Release not found in S3');
    process.exit(1);
  }
  process.exit(0);
};

main();
