const path = require('path');

function getOutputFileName(inputFileName, target) {
  const extensionMap = {
    swift: 'swift',
    typescript: 'ts',
    flow: 'js',
    angular: 'service.ts',
  };
  const folderMap = {
    javascript: 'src',
    typescript: 'src',
    flow: 'src',
    angular: 'src/app',
  };

  inputFileName = inputFileName || (target === 'angular' ? 'api' : 'API');
  if (Object.keys(extensionMap).includes(target)) {
    const fileExtension = extensionMap[target];
    const ext = path.extname(inputFileName);
    const baseName = inputFileName.substr(0, inputFileName.length - ext.length);
    const filename = ext === `.${fileExtension}` ? inputFileName : `${baseName}.${fileExtension}`;
    const defaultPath = Object.keys(folderMap).includes(target) ? folderMap[target] : '';
    return ['API', 'api'].includes(inputFileName) ? path.join(defaultPath, filename) : filename;
  }
  return inputFileName;
}

module.exports = getOutputFileName;
