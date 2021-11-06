import { $TSAny, $TSContext, readCFNTemplate, writeCFNTemplate } from 'amplify-cli-core';
import * as os from 'os';
import * as path from 'path';
import { getCfnFiles } from './push-resources';

enum DeploymentTypes {
  AMPLIFY_CLI = 'Amplify',
  AMPLIFY_ADMIN = 'AmplifyAdmin',
}

enum SupportedPlatforms {
  WINDOWS = 'Windows',
  MAC = 'Mac',
  LINUX = 'Linux',
  OTHER = 'Other',
}

type TemplateDescription = {
  createdOn: SupportedPlatforms;
  createdBy: DeploymentTypes;
  createdWith: string;
  stackType: string;
  metadata: object;
};

export async function prePushTemplateDescriptionHandler(context: $TSContext, resourcesToBeCreated: $TSAny) {
  let promises = [];

  for (const { category, resourceName, service } of resourcesToBeCreated) {
    const { resourceDir, cfnFiles } = getCfnFiles(category, resourceName);
    for (const cfnFile of cfnFiles) {
      const cfnFilePath = path.resolve(path.join(resourceDir, cfnFile));
      promises.push(await setDefaultTemplateDescription(context, category, resourceName, service, cfnFilePath));
    }
  }

  await Promise.all(promises);
}

export async function setDefaultTemplateDescription(
  context: $TSContext,
  category: string,
  resourceName: string,
  service: string,
  cfnFilePath: string,
) {
  const { templateFormat, cfnTemplate } = readCFNTemplate(cfnFilePath);

  cfnTemplate.Description = getDefaultTemplateDescription(context, category, service);

  await writeCFNTemplate(cfnTemplate, cfnFilePath, { templateFormat });
}

export function getDefaultTemplateDescription(context: $TSContext, category: string, service?: string): string {
  let descriptionJson: TemplateDescription;

  // get platform "createdOn"

  let platformDescription: SupportedPlatforms;
  let deploymentTypeDescription: DeploymentTypes;
  let stackTypeDescription: string;

  const platform = os.platform();

  if (platform == 'darwin') {
    platformDescription = SupportedPlatforms.MAC;
  } else if (platform == 'win32') {
    platformDescription = SupportedPlatforms.WINDOWS;
  } else if (platform == 'linux') {
    platformDescription = SupportedPlatforms.LINUX;
  } else {
    platformDescription = SupportedPlatforms.OTHER;
  }

  // get deployment mchanism "createdBy"

  if (!!process.env.CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_DELETION) {
    deploymentTypeDescription = DeploymentTypes.AMPLIFY_ADMIN;
  } else {
    deploymentTypeDescription = DeploymentTypes.AMPLIFY_CLI;
  }

  // get CLI version number "createdWith"
  const cliVersion = context.pluginPlatform.plugins.core[0].packageVersion;

  // get stack type "stackType"
  stackTypeDescription = service ? `${category}-${service}` : category;

  descriptionJson = {
    createdOn: platformDescription,
    createdBy: deploymentTypeDescription,
    createdWith: cliVersion,
    stackType: stackTypeDescription,
    metadata: {},
  };

  return JSON.stringify(descriptionJson);
}
