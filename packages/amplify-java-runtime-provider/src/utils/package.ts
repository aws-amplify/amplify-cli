import childProcess from 'child_process';
import path from 'path';
import { PackageRequest, PackageResult } from 'amplify-function-plugin-interface/src';

export async function packageResource(request: PackageRequest, context: any): Promise<PackageResult> {
  const resourceDir = path.join(request.srcRoot);
  const meta = context.amplify.getProjectDetails().amplifyMeta;
  const zipFileName = Object.keys(meta.function)[0] + '-1.0-SNAPSHOT.jar';
  if (!request.lastPackageTimestamp || request.lastBuildTimestamp > request.lastPackageTimestamp) {
    installDependencies(resourceDir);
    return Promise.resolve({zipFileName });
  }
  return Promise.resolve({});
}

function installDependencies(resourceDir: string) {
    runPackageManager(resourceDir);
}

function runPackageManager(cwd: string) {
    const packageManager = 'mvn';
    const args = ['package'];
    const childProcessResult = childProcess.spawnSync(packageManager, args, {
      cwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    if (childProcessResult.status !== 0) {
      throw new Error(childProcessResult.output.join());
    }
  }