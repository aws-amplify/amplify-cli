const fs = require('fs-extra');
const path = require('path');
const publishIgnoreConfig = require('./configure-Publish');
const publishMetaConfig = require('./configure-Meta');

function scan(context, distributionDirPath, WebsiteConfiguration) {
  let fileList = [];
  if (fs.existsSync(distributionDirPath)) {
    const ignored = publishIgnoreConfig.getIgnore(context);
    const meta = publishMetaConfig.getMeta(context);

    fileList = recursiveScan(distributionDirPath, [], ignored, meta, distributionDirPath);

    if (fileList.length === 0) {
      const message = 'The distribution folder is empty';
      context.print.info('');
      context.print.error(message);
      context.print.info('Distribution folder is currently set as:');
      context.print.info(`  ${distributionDirPath}`);
      context.print.info('');
      throw new Error(message);
    } else if (
      WebsiteConfiguration &&
      WebsiteConfiguration.IndexDocument &&
      !fs.existsSync(path.join(distributionDirPath, WebsiteConfiguration.IndexDocument))
    ) {
      context.print.info('');
      context.print.warning('Index doc is missing in the distribution folder');
      context.print.info('Distribution folder is currently set as:');
      context.print.info(`  ${distributionDirPath}`);
      context.print.info('Index document is currently set as:');
      context.print.info(`  ${WebsiteConfiguration.IndexDocument}`);
      context.print.info('');
    }
  } else {
    const message = 'Cannot find the distribution folder.';
    context.print.info('');
    context.print.error(message);
    context.print.info('Distribution folder is currently set as:');
    context.print.info(`  ${distributionDirPath}`);
    context.print.info('');
    throw new Error(message);
  }
  return fileList;
}

function recursiveScan(dir, filelist, amplifyIgnore, amplifyMeta, amplifyRoot) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!publishIgnoreConfig.isIgnored(filePath, amplifyIgnore, amplifyRoot)) {
        filelist = recursiveScan(filePath, filelist, amplifyIgnore, amplifyMeta, amplifyRoot);
      }
    } else if (!publishIgnoreConfig.isIgnored(filePath, amplifyIgnore, amplifyRoot)) {
      const metaData = publishMetaConfig.getMetaKeyValue(filePath, amplifyMeta, amplifyRoot);
      filelist.push({ filePath: filePath, meta: metaData });
    }
  });
  return filelist;
}

module.exports = {
  scan,
};
