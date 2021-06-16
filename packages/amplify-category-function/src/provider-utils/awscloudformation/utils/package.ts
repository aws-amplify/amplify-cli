import _ from 'lodash';
import { Packager } from '../types/packaging-types';
import { ServiceName } from './constants';
import { packageFunction } from './packageFunction';
import { packageLayer } from './packageLayer';

export const packageResource: Packager = async (context, resource) => getPackagerForService(resource.service)(context, resource);

// there are some other categories (api and maybe others) that depend on the packageFunction function to create a zip file of resource
// which is why it is the default return value here
const getPackagerForService = (service: string) => (service === ServiceName.LambdaLayer ? packageLayer : packageFunction);
