import { convertToCompleteMapParams, isCompleteMapParams, MapParameters } from './utils/mapParams';
import { merge } from './utils/resourceParamsUtils';
import { supportedServices, ServiceConfig } from '../supportedServices';
import { ServiceName, provider } from './utils/constants';
import _ from 'lodash';
import { open, exitOnNextTick } from 'amplify-cli-core';
import { createMapResource } from './utils/createMapResource';

/**
 * Entry point for creating a new Geo resource
 * @param context Amplify Core Context object
 * @param service The cloud service that is providing the category
 * @param parameters Parameters used to configure the resource. If not specified, a walkthrough will be launched to populate it.
 */
export async function addResource(
  context: any,
  service: string,
  parameters?: Partial<MapParameters>
): Promise<string> {
  // load the service config for this service
  const BAD_SERVICE_ERR = new Error(`amplify-category-geo is not configured to provide service type ${service}`);

  while (!checkIfAuthExists(context)) {
    if (
      await context.amplify.confirmPrompt(
        'You need to add auth (Amazon Cognito) to your project in order to add geo resources. Do you want to add auth now?',
      )
    ) {
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
      break;
    } else {
      context.usageData.emitSuccess();
      exitOnNextTick(0);
    }
  }

  switch (service) {
    case ServiceName.Map:
      const serviceConfig: ServiceConfig<MapParameters> = supportedServices[service];
      return addMapResource(context, service, serviceConfig, parameters);
    default:
      throw BAD_SERVICE_ERR;
  }
}

function checkIfAuthExists(context: any) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    let authExists = false;
    const authServiceName = 'Cognito';
    const authCategory = 'auth';

    if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
        const categoryResources = amplifyMeta[authCategory];
        Object.keys(categoryResources).forEach(resource => {
        if (categoryResources[resource].service === authServiceName) {
            authExists = true;
        }
        });
    }
    return authExists;
}

export async function addMapResource(
  context: any,
  service: string,
  serviceConfig: ServiceConfig<MapParameters>,
  parameters?: Partial<MapParameters>
): Promise<string> {
  // Go through the walkthrough if the parameters are incomplete map parameters
  let completeParams: MapParameters;
  if (!parameters || !isCompleteMapParams(parameters)) {
    // initialize the Map parameters
    let mapParams: Partial<MapParameters> = {
      providerContext: {
        provider: provider,
        service: service,
        projectName: context.amplify.getProjectDetails().projectConfig.projectName,
      },
    };

    // merge in given parameters
    mapParams = merge(mapParams, parameters);

    // populate the parameters for the resource
    // This will modify mapParams
    await serviceConfig.walkthroughs.createWalkthrough(context, mapParams);
    completeParams = convertToCompleteMapParams(mapParams);
  } else {
    completeParams = parameters;
  }

  createMapResource(context, completeParams);

  const { print } = context;

  print.success(`Successfully added resource ${completeParams.mapName} locally.`);
  print.info('');
  print.success('Next steps:');
  print.info(`Check out sample function code generated in <project-dir>/amplify/backend/function/${completeParams.mapName}/src`);
  print.info('"amplify function build" builds all of your functions currently in the project');
  print.info('"amplify mock function <functionName>" runs your function locally');
  print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
  print.info(
    '"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud',
  );
  return completeParams.mapName;
}

export function openConsole(context: any, service: ServiceName) {
  const amplifyMeta = context.amplify.getProjectMeta();
  const region = amplifyMeta.providers[provider].Region;
  let selection: string | undefined;
  switch (service) {
    case ServiceName.Map:
        selection = "maps";
        break;
    default:
        selection = undefined;
  }
  let url: string = `https://${region}.console.aws.amazon.com/location/home?region=${region}#/`;
  if (selection) {
    url = `https://${region}.console.aws.amazon.com/location/${selection}/home?region=${region}#/`;
  }
  open(url, { wait: false });
}
