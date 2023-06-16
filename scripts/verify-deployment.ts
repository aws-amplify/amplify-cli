import { execSync } from 'child_process';

type ProcessArgs = {
  version: string;
};
const githubBinaries = ['amplify-pkg-linux-arm64.tgz', 'amplify-pkg-linux.tgz', 'amplify-pkg-macos.tgz', 'amplify-pkg-win.exe.tgz'];
const parseArgs = (): ProcessArgs => {
  const version = process.argv.slice(2)?.at(0);
  if (!version) {
    throw new TypeError('version is not defined');
  }
  return {
    version,
  };
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
  const { version } = parseArgs();
  console.log(`#### Verifying version ${version} deployed correctly ####`);
  if ((await existsInS3(version)) && existsInNpm(version) && (await existsInGitHub(version))) {
    process.exit(0);
  }
  process.exit(1);
};

main();
