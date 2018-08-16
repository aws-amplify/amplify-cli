const path = require('path')

function getOutputFileName(inputFileName = 'API', target) {
  const extensionMap = {
    swift: 'swift',
    typescript: 'ts',
    flow: 'js',
  }
  if (Object.keys(extensionMap).includes(target)) {
    const fileExtension = extensionMap[target]
    const ext = path.extname(inputFileName)
    const baseName = inputFileName.substr(0, inputFileName.length - ext.length)
    return ext === `.${fileExtension}` ? inputFileName : `${baseName}.${fileExtension}`
  }
  return inputFileName
}

module.exports = getOutputFileName
