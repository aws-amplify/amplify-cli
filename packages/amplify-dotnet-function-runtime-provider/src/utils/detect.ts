import os from 'os';
import childProcess from 'child_process';

export async function detectDotNetCore() {
  return new Promise<boolean>((resolve, reject) => {
    try {
      // Detect whether we're running on Windows
      var isWin = os.platform().startsWith('win');
      var where = isWin ? 'where' : 'whereis';
      var out = childProcess.spawn(where, ['dotnet.exe'], { windowsHide: true });

      out.on('close', (code: number) => {
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
}
