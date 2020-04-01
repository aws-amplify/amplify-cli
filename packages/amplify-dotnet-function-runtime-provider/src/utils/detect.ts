import os from 'os';
import childProcess from 'child_process';

export async function detectDotNetCore(): Promise<boolean> {
  const dotnetCheck = new Promise<boolean>((resolve, reject) => {
    try {
      // Detect whether we're running on Windows
      const isWin = os.platform().startsWith('win');
      const where = isWin ? 'where' : 'which';
      const pathCheck = childProcess.spawn(where, ['dotnet'], { windowsHide: true });

      pathCheck.on('close', (code: number) => {
        if (code === 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
  if (await dotnetCheck) {
    return new Promise<boolean>((resolve, reject) => {
      try {
        var versionCheck = childProcess.spawn('dotnet', ['--version'], { stdio: ['pipe', 'pipe', process.stderr], windowsHide: true });
        let dataBuffer = Buffer.from('');
        versionCheck.stdout.on('data', data => {
          if (typeof data === 'string') {
            data = Buffer.from(data);
          }
          dataBuffer = Buffer.concat([dataBuffer, data]);
        });

        versionCheck.on('close', code => {
          if (code !== 0) {
            resolve(false);
          }
          const versionString = dataBuffer.toString('ascii');
          if (versionString && versionString.startsWith('3.1')) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  } else {
    return false;
  }
}
