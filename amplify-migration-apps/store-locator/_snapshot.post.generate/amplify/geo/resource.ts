import { defineStoreLocatorGeofence } from './storeLocatorGeofence/resource';
import { defineStoreLocatorMap } from './storeLocatorMap/resource';
import { defineStoreLocatorSearch } from './storeLocatorSearch/resource';
import { Backend } from '@aws-amplify/backend';

export const defineGeo = (backend: Backend<any>) => {
  const storeLocatorGeofence = defineStoreLocatorGeofence(backend);
  const storeLocatorMap = defineStoreLocatorMap(backend);
  const storeLocatorSearch = defineStoreLocatorSearch(backend);
  backend.addOutput({
    geo: {
      aws_region: storeLocatorMap.region,
      maps: {
        items: {
          [storeLocatorMap.name]: { style: storeLocatorMap.style },
        },
        default: storeLocatorMap.name,
      },
      search_indices: {
        items: [storeLocatorSearch.name],
        default: storeLocatorSearch.name,
      },
      geofence_collections: {
        items: [storeLocatorGeofence.name],
        default: storeLocatorGeofence.name,
      },
    },
  });
};
