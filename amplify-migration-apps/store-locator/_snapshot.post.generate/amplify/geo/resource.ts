import { defineStoreLocatorMap } from './storeLocatorMap/resource';
import { defineStoreLocatorSearch } from './storeLocatorSearch/resource';
import { defineStoreLocatorGeofence } from './storeLocatorGeofence/resource';
import type { Backend } from '../backend';

export function defineGeo(backend: Backend) {
  const storeLocatorMap = defineStoreLocatorMap(backend);
  const storeLocatorSearch = defineStoreLocatorSearch(backend);
  const storeLocatorGeofence = defineStoreLocatorGeofence(backend);
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
}
