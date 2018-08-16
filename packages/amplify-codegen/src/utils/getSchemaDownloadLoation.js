const { join, dirname } = require('path')

const getAndroidResDir = require('./getAndroidResDir')

function getSchemaDownloadLocation(context) {
  const { amplify } = context
  let downloadDir
  try {
    const androidResDir = getAndroidResDir(context)
    downloadDir = join(dirname(androidResDir), 'graphql')
  } catch (e) {
    const outputPath = amplify.pathManager.getBackendDirPath()
    downloadDir = join(outputPath, 'introspection')
  }
  return join(downloadDir, 'schema.json')
}

module.exports = getSchemaDownloadLocation
