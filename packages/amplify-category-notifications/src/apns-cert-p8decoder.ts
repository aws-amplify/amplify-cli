import * as fs from 'fs-extra';

/**
 * Run function for p8 decoder
 * @param filePath - path to cert file
 * @returns p8 decoded content from the file
 */
export const run = (filePath:string):string => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/-----.*-----/gi, '').replace(/\s/g, '');
  return content.trim();
};

module.exports = {
  run,
};
