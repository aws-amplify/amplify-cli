import * as fs from 'fs-extra';
import { command } from 'execa';
import { oldVersionPath, pendingDeletePath, tmpRegPath } from './win-constants';

const regPath = 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager';
const regKey = 'PendingFileRenameOperations';
const regPreamble = `Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Session Manager]
"${regKey}"=hex(7):`;

/**
 * On Windows when upgrading, the current binary can't be deleted, only renamed.
 * This function checks for the renamed binary (the old one after upgrading) and removes it on the next run of the CLI
 *
 */
export const deleteOldVersion = () => {
  if (process.platform.startsWith('win') && fs.existsSync(oldVersionPath)) {
    try {
      fs.removeSync(oldVersionPath);
    } catch (err) {
      console.warn(`Failed to clean up previous CLI installation at [${oldVersionPath}].`);
      console.log(err);
      console.warn('Make sure this file is not open anywhere else.');
    }
  }
};

/**
 * On Windows the current binary cannot uninstall itself
 * There is a registry value that can be set to mark files for deletion on the next reboot of the system
 * This function marks the Amplify binary for deletion
 */
export const setRegPendingDelete = async () => {
  if (!process.platform.startsWith('win')) return;
  let regQueryOutput = '';
  try {
    ({ stdout: regQueryOutput } = await command(`reg query "${regPath}" /v ${regKey}`, { shell: 'cmd.exe' }));
  } catch (err) {
    // intentionally swallow this
    // it means the regKey doesn't exist which is fine, it will be created
  }
  const startIdx = Math.max(0, regQueryOutput.indexOf('\\??'));
  const currentPaths = regQueryOutput
    .slice(startIdx)
    .trim()
    .split('\\0')
    .filter(p => !!p);
  const newPaths = currentPaths.concat(`\\??\\${pendingDeletePath}`);
  const newHex = newPaths
    .map(strToLittleEndianHex)
    .map(hexArr => hexArr.join(','))
    .join(',00,00,00,00,')
    .concat(',00,00,00,00,00,00');
  const regContent = `${regPreamble}${newHex}`;
  await fs.writeFile(tmpRegPath, regContent);
  await command(`reg import "${tmpRegPath}"`, { shell: 'cmd.exe' });
  await fs.remove(tmpRegPath);
};

const strToLittleEndianHex = (str: string) => {
  const hexArr: string[] = [];
  for (let i = 0; i < str.length; i++) {
    let hexCode = str.charCodeAt(i).toString(16);
    switch (hexCode.length) {
      case 1:
        hexArr.push(`0${hexCode}`);
        hexArr.push('00');
        break;
      case 2:
        hexArr.push(hexCode);
        hexArr.push('00');
        break;
      case 3:
        hexArr.push(hexCode.slice(1));
        hexArr.push(`0${hexCode[0]}`);
        break;
      case 4:
        hexArr.push(hexCode.slice(2));
        hexArr.push(hexCode.slice(0, 2));
        break;
      default:
        throw new Error(`Could not convert hex code ${hexCode} into 16 bit little endian format`);
    }
  }
  return hexArr;
};
