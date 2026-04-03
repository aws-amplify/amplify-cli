import execa from 'execa';

export async function checkout(targetAppPath: string, branch: string, create: boolean): Promise<void> {
  await commit(targetAppPath, `commit prior to switching to ${branch}`);
  const args = ['checkout'];
  if (create) {
    args.push('-b');
  }
  args.push(branch);
  await execa('git', args, { cwd: targetAppPath, stdin: 'inherit' });
}

export async function commit(targetAppPath: string, message: string): Promise<void> {
  await execa('git', ['status'], { cwd: targetAppPath });
  await execa('git', ['add', '.'], { cwd: targetAppPath });
  await execa('git', ['commit', '--allow-empty', '-m', message], { cwd: targetAppPath });
}

export async function init(targetAppPath: string): Promise<void> {
  await execa('git', ['init'], { cwd: targetAppPath });
}
