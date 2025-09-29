import { execSync } from 'child_process';

export const installPython313 = () => {
  try {
    execSync('python3.13 --version', { stdio: 'ignore' });
  } catch {
    console.log('Installing Python 3.13...');
    execSync('sudo add-apt-repository ppa:deadsnakes/ppa -y && sudo apt-get update && sudo apt-get install -y python3.13', {
      stdio: 'inherit',
    });
  }
};
