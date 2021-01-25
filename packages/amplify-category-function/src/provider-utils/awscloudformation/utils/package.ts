import { $TSContext } from 'amplify-cli-core';
import _ from 'lodash';
import { Packager, ResourceMeta } from '../types/packaging-types';
import { ServiceName } from './constants';
import { packageFunction } from './packageFunction';
import { packageLayer } from './packageLayer';

export const packageResource: Packager = async (context, resource) => getServicePackager(resource.service)(context, resource);

const servicePackagerMap: Record<ServiceName, Packager> = {
  [ServiceName.LambdaFunction]: packageFunction,
  [ServiceName.LambdaLayer]: packageLayer,
};

const getServicePackager = (service: string) =>
  (servicePackagerMap[service] ??
    (() => {
      throw new Error(`Unknown function service type ${service}`);
    })) as Packager;
