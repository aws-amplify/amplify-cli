import { useEffect, useRef, useState } from 'react';
import { createMap, drawPoints, AmplifyGeofenceControl } from 'maplibre-gl-js-amplify';
import maplibregl from 'maplibre-gl';
import { Geo } from '@aws-amplify/geo';
import { Authenticator } from '@aws-amplify/ui-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-gl-js-amplify/dist/public/amplify-map.css';
import 'maplibre-gl-js-amplify/dist/public/amplify-ctrl-geofence.css';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

// Sample store locations - New York
const storeLocations = [
  {
    coordinates: [-73.9857, 40.7484] as [number, number],
    title: 'Midtown Manhattan Store',
    address: '350 5th Avenue, New York, NY',
  },
  {
    coordinates: [-73.9805, 40.787] as [number, number],
    title: 'Upper West Side Store',
    address: '2100 Broadway, New York, NY',
  },
  {
    coordinates: [-73.9442, 40.6782] as [number, number],
    title: 'Brooklyn Store',
    address: '445 Albee Square, Brooklyn, NY',
  },
  {
    coordinates: [-74.006, 40.7128] as [number, number],
    title: 'Financial District Store',
    address: '100 Wall Street, New York, NY',
  },
  {
    coordinates: [-73.9855, 40.758] as [number, number],
    title: 'Times Square Store',
    address: '1560 Broadway, New York, NY',
  },
  {
    coordinates: [-73.9654, 40.7829] as [number, number],
    title: 'Central Park Store',
    address: '10 Columbus Circle, New York, NY',
  },
  {
    coordinates: [-73.9934, 40.7505] as [number, number],
    title: 'Hudson Yards Store',
    address: '20 Hudson Yards, New York, NY',
  },
  {
    coordinates: [-73.9776, 40.7614] as [number, number],
    title: 'Rockefeller Center Store',
    address: '45 Rockefeller Plaza, New York, NY',
  },
  {
    coordinates: [-74.0445, 40.6892] as [number, number],
    title: 'Staten Island Ferry Store',
    address: '4 Whitehall Street, New York, NY',
  },
  {
    coordinates: [-73.9496, 40.6501] as [number, number],
    title: 'Flatbush Store',
    address: '900 Flatbush Avenue, Brooklyn, NY',
  },
];

interface SearchResult {
  label?: string;
  geometry?: {
    point?: [number, number];
  };
}

interface StoreLocatorProps {
  signOut: () => void;
  user: { signInDetails?: { loginId?: string } };
}

function StoreLocator({ signOut, user }: StoreLocatorProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function initializeMap() {
      const map = await createMap({
        container: 'map',
        center: [-73.9857, 40.7484],
        zoom: 11,
      });

      mapRef.current = map;

      map.on('load', function () {
        drawPoints('storeLocations', storeLocations, map, {
          showCluster: true,
          unclusteredOptions: {
            showMarkerPopup: true,
          },
          clusterOptions: {
            showCount: true,
            smCircleSize: 20,
            mdCircleSize: 30,
            lgCircleSize: 40,
            clusterMaxZoom: 12,
          },
        });

        // Add geofence control
        const geofenceControl = new AmplifyGeofenceControl();
        map.addControl(geofenceControl as unknown as maplibregl.IControl);
      });
    }

    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await Geo.searchByText(searchQuery, {
        maxResults: 5,
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.geometry?.point && mapRef.current) {
      const [lng, lat] = result.geometry.point;

      if (markerRef.current) {
        markerRef.current.remove();
      }

      markerRef.current = new maplibregl.Marker({ color: '#ff9900' })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup().setHTML(`<strong>${result.label}</strong>`))
        .addTo(mapRef.current);

      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 15,
      });
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>Store Locator</h1>
          <div className="auth-section">
            <span className="user-email">{user.signInDetails?.loginId}</span>
            <button onClick={signOut} className="sign-out-button">
              Sign Out
            </button>
          </div>
        </div>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search for an address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.map((result, index) => (
              <li key={index} onClick={() => handleResultClick(result)}>
                {result.label}
              </li>
            ))}
          </ul>
        )}
      </header>
      <div id="map" className="map-container"></div>
    </div>
  );
}

function App() {
  return <Authenticator>{({ signOut, user }) => <StoreLocator signOut={signOut!} user={user!} />}</Authenticator>;
}

export default App;
