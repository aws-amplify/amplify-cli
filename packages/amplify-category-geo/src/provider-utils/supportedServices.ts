import { MapParameters } from './awscloudformation/utils/mapParams';
import { createMapWalkthrough, updateMapWalkthrough } from './awscloudformation/service-walkthroughs/mapWalkthrough';
import * as geoController from './awscloudformation';
import { $TSContext } from 'amplify-cli-core';

export interface SupportedServices extends Record<string, any> {
  Map: ServiceConfig<MapParameters>;
}

export interface ServiceConfig<T> {
  alias: string;
  walkthroughs: WalkthroughProvider<T>;
  provider: string;
  providerController: any;
}

export interface WalkthroughProvider<T> {
  createWalkthrough: (context: $TSContext, parameters?: Partial<T>) => Promise<Partial<T>>;
  updateWalkthrough: (context: $TSContext, parameters?: Partial<T>, resourceToUpdate?: string) => Promise<Partial<T>>;
}

export const supportedServices: SupportedServices = {
  Map: {
    alias: 'Map (visualize the geospatial data)',
    walkthroughs: {
      createWalkthrough: createMapWalkthrough,
      updateWalkthrough: updateMapWalkthrough
    },
    provider: 'awscloudformation',
    providerController: geoController,
  },
  PlaceIndex: {
    alias: 'Place Index (search places, geocode and reverse geocode)',
    walkthroughs: {
      createWalkthrough: null,
      updateWalkthrough: null
    },
    provider: 'awscloudformation',
    providerController: geoController,
  },
  Tracker: {
    alias: 'Tracker (track asset location)',
    walkthroughs: {
      createWalkthrough: null,
      updateWalkthrough: null
    },
    provider: 'awscloudformation',
    providerController: geoController,
  },
  GeofenceCollection: {
    alias: 'Geofence Collection (create virtual perimeters and get breach notifications)',
    walkthroughs: {
      createWalkthrough: null,
      updateWalkthrough: null
    },
    provider: 'awscloudformation',
    providerController: geoController,
  }
};
