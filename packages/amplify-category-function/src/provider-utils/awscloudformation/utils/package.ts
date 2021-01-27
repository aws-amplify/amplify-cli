import _ from 'lodash';
import { Packager } from '../types/packaging-types';
import { ServiceName } from './constants';
import { packageFunction } from './packageFunction';
import { packageLayer } from './packageLayer';

export const packageResource: Packager = async (context, resource) => getServicePackager(resource.service)(context, resource);

const getServicePackager = (service: string) => (servicePackagerMap[service] ?? packageUnknown) as Packager;

const servicePackagerMap: Record<ServiceName, Packager> = {
  [ServiceName.LambdaFunction]: packageFunction,
  [ServiceName.LambdaLayer]: packageLayer,
};

const packageUnknown: Packager = (_, resource) => {
  throw new Error(`Unknown function service type ${resource.service}`);
};
