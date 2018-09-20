const path = require('path');

function getOutputFileName(inputFileName = 'API', target) {
  const extensionMap = {
    swift: 'swift',
    typescript: 'ts',
    flow: 'js',
  };
  if (Object.keys(extensionMap).includes(target)) {
    const fileExtension = extensionMap[target];
    const ext = path.extname(inputFileName);
    const baseName = inputFileName.substr(0, inputFileName.length - ext.length);
    const filename = ext === `.${fileExtension}` ? inputFileName : `${baseName}.${fileExtension}`;
    const defaultPath = ['typescript', 'flow'].includes(target) ? 'src' : '';
    return inputFileName === 'API' ? path.join(defaultPath, filename) : filename;
  }
  return inputFileName;
}

module.exports = getOutputFileName;
