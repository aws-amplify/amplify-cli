import { $TSAny } from 'amplify-cli-core';
import path from 'path';
import builder from './builder';
import constants from './constants';

const hostingCategory = 'hosting';

/**
 Publisher run
 */
export const run = async (context): Promise<$TSAny> => {
  const { projectConfig, amplifyMeta } = context.exeInfo;
  const { projectPath } = context.amplify.getEnvInfo();
  const distributionDirName = projectConfig[constants.Label].config.DistributionDir;
  const distributionDirPath = path.join(projectPath, distributionDirName);
  let enabledHostingServices: string[] = [];

  if (amplifyMeta[hostingCategory] || Object.keys(amplifyMeta[hostingCategory]).length > 0) {
    enabledHostingServices = Object.keys(amplifyMeta[hostingCategory]);
  }

  if (!enabledHostingServices.includes('S3AndCloudFront')
    // eslint-disable-next-line spellcheck/spell-checker
    && !enabledHostingServices.includes('amplifyhosting')
    && !enabledHostingServices.includes('ElasticContainer')) {
    throw new Error('No hosting services are enabled for Javascript project.');
  }

  let frontendBuildComplete = false;
  if (enabledHostingServices.includes('S3AndCloudFront')) {
    await builder.run(context);
    frontendBuildComplete = true;

    const pluginInfo = context.amplify.getCategoryPluginInfo(context, 'hosting', 'S3AndCloudFront');
    const hostingPluginModule = await import(pluginInfo.packageLocation);
    context.print.info('Publish started for S3AndCloudFront');
    await hostingPluginModule.publish(context, 'S3AndCloudFront', { distributionDirPath });
  }

  /* eslint-disable spellcheck/spell-checker */
  if (enabledHostingServices.includes('amplifyhosting')) {
    const pluginInfo = context.amplify.getCategoryPluginInfo(context, 'hosting', 'amplifyhosting');
    const hostingPluginModule = await import(pluginInfo.packageLocation);
    context.print.info('Publish started for amplifyhosting');
    await hostingPluginModule.publish(context, 'amplifyhosting', { doSkipBuild: frontendBuildComplete });
  }
  /* eslint-enable spellcheck/spell-checker */

  if (enabledHostingServices.includes('ElasticContainer')) {
    const pluginInfo = context.amplify.getCategoryPluginInfo(context, 'hosting', 'ElasticContainer');
    const hostingPluginModule = await import(pluginInfo.packageLocation);
    await hostingPluginModule.publish(context, 'ElasticContainer', { doSkipBuild: frontendBuildComplete });
  }
};

export default {
  run,
};
